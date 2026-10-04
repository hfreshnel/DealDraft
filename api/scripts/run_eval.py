import argparse
import csv
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import httpx
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.evaluation import SCORED_FIELDS, aggregate, scoreCase, stability  # noqa: E402
from app.excerpt_check import findExcerptProblems  # noqa: E402
from app.extraction_prompt import buildExtractionRequest, computePromptVersion  # noqa: E402
from app.finance import analyze  # noqa: E402
from app.pricing import loadWorksPriceGrid  # noqa: E402
from app.schemas import AnalysisAssumptions, AnalysisRequest, ListingExtraction  # noqa: E402
from app.tool_schema import computeSchemaVersion  # noqa: E402

EVAL_DIR = Path(os.environ.get("EVAL_DIR", Path(__file__).resolve().parents[2] / "eval"))
PRICING_DIR = Path(os.environ.get("PRICING_DIR", Path(__file__).resolve().parents[2] / "pricing"))
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
DEFAULT_MODELS = ("gpt-4o-2024-08-06", "gpt-4o-mini-2024-07-18")
# USD per million tokens, alias prices read on https://developers.openai.com/api/docs/pricing on 2026-10-04.
# The page also lists the dated snapshots at higher prices, most likely fine-tuning rates: to confirm.
PRICES_USD_PER_MILLION = {
    "gpt-4o-2024-08-06": {"input": 2.50, "cachedInput": 1.25, "output": 10.00},
    "gpt-4o-mini-2024-07-18": {"input": 0.15, "cachedInput": 0.075, "output": 0.60},
}
TRANSPORT_RETRIES = 8
MAX_WAIT_S = 30
REQUEST_TIMEOUT_S = 120
MAX_CALLS_DEFAULT = 200
# Same assumptions for prediction and truth: any budget or yield gap comes from the extraction alone.
BUSINESS_ASSUMPTIONS = {"notaryFeeRate": 0.07, "expectedMonthlyRent": 500, "furnitureBudget": None, "financing": None}
BUDGET_TOLERANCE = 0.01
YIELD_TOLERANCE_POINTS = 0.002


def loadCases() -> list[dict]:
    with (EVAL_DIR / "manifest.csv").open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    cases = []
    for row in rows:
        caseId = row["id"]
        visitPath = EVAL_DIR / "dataset" / f"{caseId}.visit.txt"
        cases.append(
            {
                **row,
                "listingText": (EVAL_DIR / "dataset" / f"{caseId}.txt").read_text(encoding="utf-8"),
                "visitNotes": visitPath.read_text(encoding="utf-8") if visitPath.exists() else "",
                "truth": json.loads((EVAL_DIR / "ground_truth" / f"{caseId}.json").read_text(encoding="utf-8")),
            }
        )
    return cases


def computeCost(model: str, usage: dict | None) -> float | None:
    prices = PRICES_USD_PER_MILLION.get(model)
    if prices is None or not usage:
        return None
    cached = (usage.get("prompt_tokens_details") or {}).get("cached_tokens", 0) or 0
    uncached = max((usage.get("prompt_tokens") or 0) - cached, 0)
    output = usage.get("completion_tokens") or 0
    return (uncached * prices["input"] + cached * prices["cachedInput"] + output * prices["output"]) / 1_000_000


def waitSeconds(response: httpx.Response, attempt: int) -> float:
    # Token-per-minute limits come with an explicit wait; fall back to a capped exponential delay.
    header = response.headers.get("retry-after")
    try:
        if header:
            return min(float(header) + 1, MAX_WAIT_S)
    except ValueError:
        pass
    match = re.search(r"try again in ([\d.]+)(ms|s)", response.text)
    if match:
        seconds = float(match.group(1)) / (1000 if match.group(2) == "ms" else 1)
        return min(seconds + 1 + attempt, MAX_WAIT_S)
    return min(2**attempt, MAX_WAIT_S)


def callOpenAi(client: httpx.Client, body: dict) -> tuple[dict, float]:
    lastError: Exception | None = None
    for attempt in range(TRANSPORT_RETRIES):
        started = time.perf_counter()
        try:
            response = client.post(OPENAI_URL, json=body)
            latencyMs = (time.perf_counter() - started) * 1000
            # Rate limits and server errors are transport failures, not model failures: wait and resend.
            if response.status_code == 429 or response.status_code >= 500:
                lastError = RuntimeError(f"HTTP {response.status_code}: {response.text[:300]}")
                time.sleep(waitSeconds(response, attempt))
                continue
            return response.json(), latencyMs
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            lastError = exc
        time.sleep(min(2**attempt, MAX_WAIT_S))
    raise RuntimeError(f"OpenAI call failed after {TRANSPORT_RETRIES} attempts: {lastError}")


def businessImpact(prediction: ListingExtraction, truth: ListingExtraction, grid) -> dict:
    assumptions = AnalysisAssumptions(**BUSINESS_ASSUMPTIONS)
    predicted = analyze(AnalysisRequest(extraction=prediction, assumptions=assumptions), grid)
    expected = analyze(AnalysisRequest(extraction=truth, assumptions=assumptions), grid)

    def differs(left, right, tolerance, relative):
        if left is None or right is None:
            return left is not right
        gap = abs(left - right) / abs(right) if relative and right else abs(left - right)
        return gap > tolerance

    return {
        "budgetDiffers": differs(predicted.totalBudget, expected.totalBudget, BUDGET_TOLERANCE, True),
        "yieldDiffers": differs(predicted.primaryYield, expected.primaryYield, YIELD_TOLERANCE_POINTS, False),
        "statusDiffers": predicted.status != expected.status,
        "predictedBudget": predicted.totalBudget,
        "expectedBudget": expected.totalBudget,
        "predictedYield": predicted.primaryYield,
        "expectedYield": expected.primaryYield,
    }


def evaluateCall(client: httpx.Client, case: dict, model: str, run: int, grid) -> dict:
    result = {"caseId": case["id"], "split": case["split"], "category": case["category"], "model": model, "run": run}
    try:
        body = buildExtractionRequest(case["listingText"], case["visitNotes"], model)
        response, latencyMs = callOpenAi(client, body)
        result["latencyMs"] = round(latencyMs)
        result["usage"] = response.get("usage")
        result["costUsd"] = computeCost(model, response.get("usage"))
        result["servedModel"] = response.get("model")
        if response.get("error"):
            raise RuntimeError(f"OpenAI error: {response['error'].get('message')}")
        choice = (response.get("choices") or [{}])[0]
        message = choice.get("message") or {}
        if message.get("refusal"):
            raise RuntimeError(f"Refusal: {message['refusal']}")
        if choice.get("finish_reason") != "stop":
            raise RuntimeError(f"Unexpected finish_reason: {choice.get('finish_reason')}")
        result["rawContent"] = message.get("content")
        prediction = json.loads(message.get("content") or "")
    except Exception as exc:
        result.update({"error": str(exc), "valid": False, "score": None})
        print(f"  {case['id']} {model} run {run}: ERROR {exc}", file=sys.stderr)
        return result

    result["score"] = scoreCase(case["id"], prediction, case["truth"], case["listingText"], case["visitNotes"])
    try:
        extraction = ListingExtraction.model_validate(prediction)
        problems = findExcerptProblems(extraction, case["listingText"], case["visitNotes"])
        result["validationProblems"] = problems
        result["valid"] = not problems
        result["business"] = businessImpact(extraction, ListingExtraction.model_validate(case["truth"]), grid)
    except ValidationError as exc:
        result["validationProblems"] = [{"message": error["msg"], "location": list(map(str, error["loc"]))} for error in exc.errors()]
        result["valid"] = False
    except Exception as exc:
        result["validationProblems"] = [{"message": f"Validation crashed: {exc}"}]
        result["valid"] = False
    result["prediction"] = prediction
    return result


def summarizeModel(results: list[dict], cases: list[dict]) -> dict:
    truths = {case["id"]: case["truth"] for case in cases}
    bySplit = {
        split: aggregate([result for result in results if result["split"] == split], truths)
        for split in sorted({result["split"] for result in results})
    }
    stabilityByCase = {}
    for caseId in sorted({result["caseId"] for result in results}):
        predictions = [result["prediction"] for result in results if result["caseId"] == caseId and "prediction" in result]
        stabilityByCase[caseId] = stability(predictions)
    measured = [entry for entry in stabilityByCase.values() if entry["totalFields"]]
    business = [result["business"] for result in results if result.get("business")]
    errorsByCase = {}
    for result in results:
        if result.get("score"):
            wrong = [f"{field}:{outcome}" for field, outcome in result["score"]["fields"].items() if outcome != "correct"]
            errorsByCase.setdefault(result["caseId"], []).append({"run": result["run"], "fieldErrors": wrong})
    return {
        "all": aggregate(results, truths),
        "bySplit": bySplit,
        "stability": {
            "stableFields": sum(entry["stableFields"] for entry in measured),
            "totalFields": sum(entry["totalFields"] for entry in measured),
            "byCase": stabilityByCase,
        },
        "business": {
            "compared": len(business),
            "budgetDiffers": sum(entry["budgetDiffers"] for entry in business),
            "yieldDiffers": sum(entry["yieldDiffers"] for entry in business),
            "statusDiffers": sum(entry["statusDiffers"] for entry in business),
        },
        "traps": {
            result["caseId"] + f"#{result['run']}": result["score"]["trap"]
            for result in results
            if result.get("score") and result["score"]["trap"]
        },
        "errorsByCase": errorsByCase,
    }


def formatRatio(entry: dict) -> str:
    if entry["rate"] is None:
        return "n/a"
    return f"{entry['rate'] * 100:.1f} % ({entry['count']}/{entry['total']})"


def writeSummary(outputDir: Path, metrics: dict) -> None:
    lines = [f"# Evaluation run {metrics['runId']}", "", f"Prompt {metrics['promptVersion']} · schema {metrics['schemaVersion']} · {metrics['runs']} run(s) per case", ""]
    rows = [
        ("Calls failed (transport, not scored)", lambda m: str(m["all"]["callErrors"])),
        ("Valid JSON, 1st attempt", lambda m: formatRatio(m["all"]["validFirstAttempt"])),
        ("Field accuracy, all fields", lambda m: formatRatio(m["all"]["fieldAccuracyAll"])),
        ("Field accuracy, non-null truth", lambda m: formatRatio(m["all"]["fieldAccuracyNonNullTruth"])),
        ("Hallucinations on critical fields", lambda m: str(m["all"]["criticalHallucinations"])),
        ("Verbatim excerpts", lambda m: formatRatio(m["all"]["excerptVerbatim"])),
        ("Works precision", lambda m: formatRatio(m["all"]["worksPrecision"])),
        ("Works recall", lambda m: formatRatio(m["all"]["worksRecall"])),
        ("Quantities correct", lambda m: formatRatio(m["all"]["quantityAccuracy"])),
        ("Invented quantities", lambda m: str(m["all"]["inventedQuantities"])),
        ("Traps passed", lambda m: formatRatio(m["all"]["trapsPassed"])),
        ("Stable fields across runs", lambda m: f"{m['stability']['stableFields']}/{m['stability']['totalFields']}"),
        ("Budget changed by extraction", lambda m: f"{m['business']['budgetDiffers']}/{m['business']['compared']}"),
        ("Yield changed by extraction", lambda m: f"{m['business']['yieldDiffers']}/{m['business']['compared']}"),
        ("Latency p50 / p95 (ms)", lambda m: f"{m['all']['latencyMs']['p50']} / {m['all']['latencyMs']['p95']}"),
        ("Cost per study (USD)", lambda m: "n/a" if m["all"]["costUsdPerStudy"] is None else f"{m['all']['costUsdPerStudy']:.4f}"),
    ]
    models = list(metrics["models"])
    lines += ["| Metric | " + " | ".join(models) + " |", "|---|" + "---|" * len(models)]
    for label, getter in rows:
        lines.append(f"| {label} | " + " | ".join(getter(metrics["models"][model]) for model in models) + " |")
    for model in models:
        lines += ["", f"## {model}: accuracy by split", "", "| Split | Field accuracy (non-null truth) | Critical hallucinations | Valid 1st attempt |", "|---|---|---|---|"]
        for split, entry in metrics["models"][model]["bySplit"].items():
            lines.append(f"| {split} | {formatRatio(entry['fieldAccuracyNonNullTruth'])} | {entry['criticalHallucinations']} | {formatRatio(entry['validFirstAttempt'])} |")
        lines += ["", f"## {model}: errors by field", "", "| Field | Correct | Hallucination | Omission | Wrong value |", "|---|---|---|---|---|"]
        for field in SCORED_FIELDS:
            outcomes = metrics["models"][model]["all"]["fieldOutcomes"][field]
            if outcomes.get("correct", 0) == sum(outcomes.values()):
                continue
            lines.append(f"| {field} | {outcomes.get('correct', 0)} | {outcomes.get('hallucination', 0)} | {outcomes.get('omission', 0)} | {outcomes.get('wrongValue', 0)} |")
    (outputDir / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate the extraction against the annotated dataset.")
    parser.add_argument("--models", nargs="+", default=list(DEFAULT_MODELS))
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--split", choices=["dev", "test", "all"], default="dev")
    parser.add_argument("--cases", nargs="*", default=None)
    parser.add_argument("--concurrency", type=int, default=2)
    parser.add_argument("--label", default="run")
    parser.add_argument("--max-calls", type=int, default=MAX_CALLS_DEFAULT)
    args = parser.parse_args()

    apiKey = os.environ.get("OPENAI_API_KEY", "")
    if not apiKey:
        print("OPENAI_API_KEY is not set (add it to .env; only the eval service receives it).", file=sys.stderr)
        return 1
    try:
        cases = [case for case in loadCases() if args.split == "all" or case["split"] == args.split]
        if args.cases:
            cases = [case for case in cases if case["id"] in set(args.cases)]
        grid = loadWorksPriceGrid(PRICING_DIR / "works-grid.example.yaml")
    except Exception as exc:
        print(f"Cannot load the evaluation inputs: {exc}", file=sys.stderr)
        return 1
    jobs = [(case, model, run) for model in args.models for case in cases for run in range(1, args.runs + 1)]
    if not jobs:
        print("Nothing to evaluate.", file=sys.stderr)
        return 1
    if len(jobs) > args.max_calls:
        print(f"{len(jobs)} calls planned, above --max-calls {args.max_calls}.", file=sys.stderr)
        return 1

    runId = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + args.label
    outputDir = EVAL_DIR / "runs" / runId
    outputDir.mkdir(parents=True, exist_ok=False)
    print(f"{runId}: {len(cases)} cases x {len(args.models)} model(s) x {args.runs} run(s) = {len(jobs)} calls")

    headers = {"Authorization": f"Bearer {apiKey}"}
    with httpx.Client(headers=headers, timeout=REQUEST_TIMEOUT_S) as client, ThreadPoolExecutor(args.concurrency) as pool:
        results = list(pool.map(lambda job: evaluateCall(client, job[0], job[1], job[2], grid), jobs))

    with (outputDir / "calls.jsonl").open("w", encoding="utf-8") as handle:
        for result in results:
            handle.write(json.dumps(result, ensure_ascii=False) + "\n")
    metrics = {
        "runId": runId,
        "promptVersion": computePromptVersion(),
        "schemaVersion": computeSchemaVersion(),
        "runs": args.runs,
        "split": args.split,
        "cases": [case["id"] for case in cases],
        "pricingSource": "https://developers.openai.com/api/docs/pricing (2026-10-04, alias prices)",
        "businessAssumptions": BUSINESS_ASSUMPTIONS,
        "models": {
            model: summarizeModel([result for result in results if result["model"] == model], cases)
            for model in args.models
        },
    }
    (outputDir / "metrics.json").write_text(json.dumps(metrics, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    writeSummary(outputDir, metrics)
    print((outputDir / "summary.md").read_text(encoding="utf-8"))
    errors = sum(1 for result in results if result.get("error"))
    print(f"Results in {outputDir} ({errors} call error(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
