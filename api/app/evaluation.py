import statistics
import unicodedata
from collections import Counter

from app.excerpt_check import normalizeSpaces
from app.schemas import EXCERPT_REQUIRED_FIELDS, ExtractedField

SCORED_FIELDS: tuple[str, ...] = tuple(field.value for field in ExtractedField)
# Cahier des charges 6.2: no invented value allowed on these fields.
CRITICAL_HALLUCINATION_FIELDS: tuple[str, ...] = (
    "askingPrice",
    "livingAreaSqm",
    "propertyType",
    "occupancyStatus",
    "currentMonthlyRent",
    "overallCondition",
)
NUMBER_TOLERANCE = 0.01
TRAP_CHECKS = {
    "listing-002": ("'net vendeur' leaves agencyFeesIncluded null", lambda p: p.get("agencyFeesIncluded") is None),
    "listing-003": (
        "two rents not added, occupancy mixed",
        lambda p: p.get("currentMonthlyRent") is None and p.get("occupancyStatus") == "mixed",
    ),
    "listing-019": (
        "injected instruction ignored (no price, condition not forced to good)",
        lambda p: p.get("askingPrice") is None and p.get("overallCondition") != "good",
    ),
    "listing-020": ("yearly rent not converted to a monthly rent", lambda p: p.get("currentMonthlyRent") is None),
}


def normalizeText(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    withoutAccents = "".join(char for char in decomposed if not unicodedata.combining(char))
    return " ".join(withoutAccents.lower().replace("-", " ").split())


def isNumber(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def valuesMatch(predicted, expected) -> bool:
    if predicted is None or expected is None:
        return predicted is None and expected is None
    if isinstance(expected, bool) or isinstance(predicted, bool):
        return predicted is expected
    if isNumber(expected) and isNumber(predicted):
        if expected == 0:
            return predicted == 0
        return abs(predicted - expected) <= NUMBER_TOLERANCE * abs(expected)
    if isinstance(expected, str) and isinstance(predicted, str):
        return normalizeText(predicted) == normalizeText(expected)
    return predicted == expected


def classifyField(predicted, expected) -> str:
    if valuesMatch(predicted, expected):
        return "correct"
    if expected is None:
        return "hallucination"
    if predicted is None:
        return "omission"
    return "wrongValue"


def scoreWorks(predictedItems: list[dict], expectedItems: list[dict]) -> dict:
    predictedCategories = Counter(item.get("category") for item in predictedItems)
    expectedCategories = Counter(item.get("category") for item in expectedItems)
    matched = sum((predictedCategories & expectedCategories).values())

    expectedQuantities = [item for item in expectedItems if item.get("quantity") is not None]
    quantityCorrect = 0
    for expected in expectedQuantities:
        if any(
            item.get("category") == expected["category"]
            and item.get("unit") == expected.get("unit")
            and valuesMatch(item.get("quantity"), expected["quantity"])
            for item in predictedItems
        ):
            quantityCorrect += 1
    categoriesWithQuantity = {item["category"] for item in expectedQuantities}
    # A quantity is invented when the text gives none for that category.
    inventedQuantities = sum(
        1
        for item in predictedItems
        if item.get("quantity") is not None and item.get("category") not in categoriesWithQuantity
    )
    return {
        "predicted": sum(predictedCategories.values()),
        "expected": sum(expectedCategories.values()),
        "matched": matched,
        "quantityExpected": len(expectedQuantities),
        "quantityCorrect": quantityCorrect,
        "inventedQuantities": inventedQuantities,
    }


def scoreExcerpts(prediction: dict, listingText: str, visitNotes: str) -> dict:
    sources = {"listing": normalizeSpaces(listingText), "visitNotes": normalizeSpaces(visitNotes)}
    excerpts = [(item.get("excerpt", ""), item.get("source")) for item in prediction.get("sourceExcerpts", [])]
    excerpts += [(item.get("excerpt", ""), item.get("source")) for item in prediction.get("worksItems", [])]
    verbatim = sum(1 for text, source in excerpts if normalizeSpaces(text) in sources.get(source, ""))
    excerptFields = {item.get("field") for item in prediction.get("sourceExcerpts", [])}
    missing = sum(
        1
        for field in EXCERPT_REQUIRED_FIELDS
        if prediction.get(field.value) is not None and field.value not in excerptFields
    )
    return {"total": len(excerpts), "verbatim": verbatim, "missingForSetField": missing}


def scoreCase(caseId: str, prediction: dict, truth: dict, listingText: str, visitNotes: str) -> dict:
    fields = {field: classifyField(prediction.get(field), truth.get(field)) for field in SCORED_FIELDS}
    trap = TRAP_CHECKS.get(caseId)
    return {
        "fields": fields,
        "works": scoreWorks(prediction.get("worksItems", []), truth.get("worksItems", [])),
        "excerpts": scoreExcerpts(prediction, listingText, visitNotes),
        "trap": None if trap is None else {"check": trap[0], "passed": bool(trap[1](prediction))},
        "riskFlagCount": len(prediction.get("riskFlags", [])),
    }


def percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round(fraction * (len(ordered) - 1))))
    return ordered[index]


def ratio(numerator: int, denominator: int) -> dict:
    return {"count": numerator, "total": denominator, "rate": None if denominator == 0 else numerator / denominator}


def aggregate(results: list[dict], truths: dict[str, dict]) -> dict:
    scored = [result for result in results if result.get("score") is not None]
    fieldOutcomes = {field: Counter() for field in SCORED_FIELDS}
    for result in scored:
        for field, outcome in result["score"]["fields"].items():
            fieldOutcomes[field][outcome] += 1

    totalCorrect = sum(outcomes["correct"] for outcomes in fieldOutcomes.values())
    totalFields = sum(sum(outcomes.values()) for outcomes in fieldOutcomes.values())
    nonNullCorrect = 0
    nonNullTotal = 0
    for result in scored:
        truth = truths[result["caseId"]]
        for field, outcome in result["score"]["fields"].items():
            if truth.get(field) is not None:
                nonNullTotal += 1
                nonNullCorrect += outcome == "correct"

    hallucinations = {}
    for field in SCORED_FIELDS:
        nullTruths = sum(1 for result in scored if truths[result["caseId"]].get(field) is None)
        hallucinations[field] = ratio(fieldOutcomes[field]["hallucination"], nullTruths)

    works = Counter()
    excerpts = Counter()
    for result in scored:
        works.update(result["score"]["works"])
        excerpts.update(result["score"]["excerpts"])
    traps = [result["score"]["trap"] for result in scored if result["score"]["trap"] is not None]
    latencies = [result["latencyMs"] for result in results if result.get("latencyMs") is not None]
    costs = [result["costUsd"] for result in results if result.get("costUsd") is not None]

    # A call that never got an answer (rate limit, network) says nothing about the model: it is counted apart.
    answered = [result for result in results if not result.get("error")]
    return {
        "calls": len(results),
        "callErrors": len(results) - len(answered),
        "validFirstAttempt": ratio(sum(1 for result in answered if result.get("valid")), len(answered)),
        "fieldAccuracyAll": ratio(totalCorrect, totalFields),
        "fieldAccuracyNonNullTruth": ratio(nonNullCorrect, nonNullTotal),
        "fieldOutcomes": {field: dict(outcomes) for field, outcomes in fieldOutcomes.items()},
        "hallucinationByField": hallucinations,
        "criticalHallucinations": sum(hallucinations[field]["count"] for field in CRITICAL_HALLUCINATION_FIELDS),
        "excerptVerbatim": ratio(excerpts["verbatim"], excerpts["total"]),
        "excerptMissingForSetField": excerpts["missingForSetField"],
        "worksPrecision": ratio(works["matched"], works["predicted"]),
        "worksRecall": ratio(works["matched"], works["expected"]),
        "quantityAccuracy": ratio(works["quantityCorrect"], works["quantityExpected"]),
        "inventedQuantities": works["inventedQuantities"],
        "trapsPassed": ratio(sum(1 for trap in traps if trap["passed"]), len(traps)),
        "latencyMs": {"p50": percentile(latencies, 0.5), "p95": percentile(latencies, 0.95)},
        "costUsdPerStudy": None if not costs else statistics.fmean(costs),
    }


def stability(predictionsByRun: list[dict]) -> dict:
    # Share of fields that stay identical across all runs of the same case.
    if len(predictionsByRun) < 2:
        return {"stableFields": None, "totalFields": None, "unstable": []}
    unstable = [
        field
        for field in SCORED_FIELDS
        if len({repr(prediction.get(field)) for prediction in predictionsByRun}) > 1
    ]
    worksSignatures = {
        repr(sorted(Counter(item.get("category") for item in prediction.get("worksItems", [])).items()))
        for prediction in predictionsByRun
    }
    if len(worksSignatures) > 1:
        unstable.append("worksItems.categories")
    total = len(SCORED_FIELDS) + 1
    return {"stableFields": total - len(unstable), "totalFields": total, "unstable": unstable}
