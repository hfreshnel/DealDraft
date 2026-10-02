import copy
import json
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas import (
    EXCERPT_REQUIRED_FIELDS,
    AnalysisAssumptions,
    ExtractedField,
    ListingExtraction,
    WorkItem,
)
from app.tool_schema import buildInputSchema, buildToolDefinition, computeSchemaVersion

EVAL_DIR = Path(os.environ.get("EVAL_DIR", Path(__file__).resolve().parents[2] / "eval"))

VALID_WORK_ITEM = {
    "category": "windows",
    "quantity": 3,
    "unit": "unit",
    "note": None,
    "excerpt": "Fenêtres à changer, il y en a trois",
    "source": "visitNotes",
}

VALID_EXTRACTION = {
    "listingTitle": "Studio 25 m²",
    "city": "Saint-Étienne",
    "district": None,
    "propertyType": "studio",
    "livingAreaSqm": 25,
    "roomCount": 1,
    "floorNumber": None,
    "hasElevator": None,
    "lotCount": None,
    "askingPrice": 55000,
    "agencyFeesIncluded": None,
    "occupancyStatus": "vacant",
    "currentMonthlyRent": None,
    "rentIncludesCharges": None,
    "leaseEndDate": None,
    "annualCondoFees": None,
    "annualPropertyTax": None,
    "energyClass": None,
    "overallCondition": "renovation",
    "worksItems": [VALID_WORK_ITEM],
    "riskFlags": ["DPE non communiqué"],
    "sourceExcerpts": [{"field": "askingPrice", "excerpt": "Prix : 55 000 €", "source": "listing"}],
}

VALID_ASSUMPTIONS = {
    "notaryFeeRate": 0.07,
    "expectedMonthlyRent": 570,
    "furnitureBudget": None,
    "financing": None,
}

client = TestClient(app)


def collectKeys(node, key):
    found = []
    if isinstance(node, dict):
        for currentKey, value in node.items():
            if currentKey == key:
                found.append(value)
            found.extend(collectKeys(value, key))
    elif isinstance(node, list):
        for item in node:
            found.extend(collectKeys(item, key))
    return found


def normalizeSpaces(value: str) -> str:
    return " ".join(value.split())


def test_validExtractionPasses():
    extraction = ListingExtraction.model_validate(VALID_EXTRACTION)
    assert extraction.askingPrice == 55000
    assert extraction.worksItems[0].quantity == 3


def test_missingKeyIsRejected():
    payload = copy.deepcopy(VALID_EXTRACTION)
    del payload["overallCondition"]
    with pytest.raises(ValidationError):
        ListingExtraction.model_validate(payload)


def test_unknownKeyIsRejected():
    payload = {**VALID_EXTRACTION, "pricePerSqm": 2200}
    with pytest.raises(ValidationError):
        ListingExtraction.model_validate(payload)


def test_oldMentionedWorksFieldIsGone():
    assert "mentionedWorks" not in ListingExtraction.model_fields


@pytest.mark.parametrize(
    "field,value",
    [
        ("askingPrice", -1),
        ("livingAreaSqm", 0),
        ("energyClass", "H"),
        ("leaseEndDate", "09/2027"),
        ("propertyType", "castle"),
        ("occupancyStatus", "squatted"),
        ("overallCondition", "ruin"),
        ("floorNumber", 99),
    ],
)
def test_invalidValuesAreRejected(field, value):
    payload = {**VALID_EXTRACTION, field: value}
    with pytest.raises(ValidationError):
        ListingExtraction.model_validate(payload)


def test_excerptMustReferenceKnownField():
    excerpt = {"field": "price", "excerpt": "55 000 €", "source": "listing"}
    payload = {**VALID_EXTRACTION, "sourceExcerpts": [excerpt]}
    with pytest.raises(ValidationError):
        ListingExtraction.model_validate(payload)


def test_excerptMustDeclareItsSource():
    excerpt = {"field": "askingPrice", "excerpt": "55 000 €"}
    payload = {**VALID_EXTRACTION, "sourceExcerpts": [excerpt]}
    with pytest.raises(ValidationError):
        ListingExtraction.model_validate(payload)


@pytest.mark.parametrize(
    "overrides",
    [
        {"quantity": 3, "unit": None},
        {"quantity": None, "unit": "unit"},
        {"category": "other", "quantity": None, "unit": None, "note": None},
        {"category": "plumbing", "quantity": 1, "unit": "box"},
        {"category": "garden"},
        {"excerpt": ""},
    ],
)
def test_invalidWorkItemsAreRejected(overrides):
    with pytest.raises(ValidationError):
        WorkItem.model_validate({**VALID_WORK_ITEM, **overrides})


def test_otherWorkItemWithNoteIsAccepted():
    item = {**VALID_WORK_ITEM, "category": "other", "quantity": None, "unit": None, "note": "Two vacant lots"}
    assert WorkItem.model_validate(item).note == "Two vacant lots"


def test_assumptionsRequireExplicitNullableValues():
    for key in ("notaryFeeRate", "expectedMonthlyRent", "furnitureBudget", "financing"):
        payload = {name: value for name, value in VALID_ASSUMPTIONS.items() if name != key}
        with pytest.raises(ValidationError):
            AnalysisAssumptions.model_validate(payload)


def test_assumptionsDefaults():
    assumptions = AnalysisAssumptions.model_validate(VALID_ASSUMPTIONS)
    assert assumptions.primaryYieldBase.value == "acquisitionAndWorks"
    assert assumptions.otherCosts == 0
    assert assumptions.vacancyRate == pytest.approx(1 / 12)


def test_toolSchemaIsSelfContained():
    inputSchema = buildInputSchema()
    serialized = json.dumps(inputSchema)
    assert "$ref" not in serialized
    assert "$defs" not in serialized
    assert collectKeys(inputSchema, "title") == []


def test_toolSchemaRequiresEveryField():
    inputSchema = buildInputSchema()
    assert set(inputSchema["required"]) == set(ListingExtraction.model_fields.keys())
    assert inputSchema["additionalProperties"] is False


def test_workItemSchemaIsNestedAndStrict():
    workItemSchema = buildInputSchema()["properties"]["worksItems"]["items"]
    assert workItemSchema["additionalProperties"] is False
    assert set(workItemSchema["required"]) == set(WorkItem.model_fields.keys())


def test_extractedFieldEnumMatchesModel():
    excerptableFields = {field.value for field in ExtractedField}
    modelFields = set(ListingExtraction.model_fields.keys()) - {"worksItems", "riskFlags", "sourceExcerpts"}
    assert excerptableFields == modelFields


def test_toolDefinitionShape():
    tool = buildToolDefinition()
    assert set(tool.keys()) == {"name", "description", "input_schema"}
    assert tool["input_schema"]["type"] == "object"


def test_schemaVersionIsStable():
    assert computeSchemaVersion() == computeSchemaVersion()


def test_healthEndpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_extractionToolEndpoint():
    response = client.get("/extraction-tool")
    assert response.status_code == 200
    assert response.json()["tool"]["name"] == "record_listing_extraction"


def test_analyzeRejectsInvalidPayloadWithStructuredError():
    response = client.post("/analyze", json={"extraction": {}, "assumptions": {}})
    assert response.status_code == 422
    assert response.json()["error"] == "validationFailed"


def test_analyzeAcceptsValidPayloadButIsNotImplementedYet():
    response = client.post("/analyze", json={"extraction": VALID_EXTRACTION, "assumptions": VALID_ASSUMPTIONS})
    assert response.status_code == 501


def listingIds():
    datasetDir = EVAL_DIR / "dataset"
    if not datasetDir.is_dir():
        return []
    return sorted(path.stem for path in datasetDir.glob("*.txt") if not path.name.endswith(".visit.txt"))


def loadSourceTexts(listingId):
    datasetDir = EVAL_DIR / "dataset"
    visitPath = datasetDir / f"{listingId}.visit.txt"
    return {
        "listing": normalizeSpaces((datasetDir / f"{listingId}.txt").read_text(encoding="utf-8")),
        "visitNotes": normalizeSpaces(visitPath.read_text(encoding="utf-8")) if visitPath.exists() else "",
    }


@pytest.mark.skipif(not listingIds(), reason="No dataset found")
@pytest.mark.parametrize("listingId", listingIds())
def test_groundTruthMatchesContract(listingId):
    path = EVAL_DIR / "ground_truth" / f"{listingId}.json"
    ListingExtraction.model_validate_json(path.read_text(encoding="utf-8"))


@pytest.mark.skipif(not listingIds(), reason="No dataset found")
@pytest.mark.parametrize("listingId", listingIds())
def test_groundTruthExcerptsAreVerbatim(listingId):
    path = EVAL_DIR / "ground_truth" / f"{listingId}.json"
    truth = ListingExtraction.model_validate_json(path.read_text(encoding="utf-8"))
    sources = loadSourceTexts(listingId)
    excerpts = [(item.excerpt, item.source.value) for item in truth.sourceExcerpts]
    excerpts += [(item.excerpt, item.source.value) for item in truth.worksItems]
    for excerpt, source in excerpts:
        assert normalizeSpaces(excerpt) in sources[source], f"{listingId}: '{excerpt}' not found in {source}"


@pytest.mark.skipif(not listingIds(), reason="No dataset found")
@pytest.mark.parametrize("listingId", listingIds())
def test_groundTruthHasRequiredExcerpts(listingId):
    path = EVAL_DIR / "ground_truth" / f"{listingId}.json"
    truth = ListingExtraction.model_validate_json(path.read_text(encoding="utf-8"))
    excerptedFields = {item.field for item in truth.sourceExcerpts}
    for field in EXCERPT_REQUIRED_FIELDS:
        if getattr(truth, field.value) is not None:
            assert field in excerptedFields, f"{listingId}: no excerpt for {field.value}"


@pytest.mark.skipif(not listingIds(), reason="No dataset found")
def test_everyListingHasGroundTruthAndManifestEntry():
    truthIds = {path.stem for path in (EVAL_DIR / "ground_truth").glob("*.json")}
    manifestLines = (EVAL_DIR / "manifest.csv").read_text(encoding="utf-8").strip().splitlines()[1:]
    manifestIds = {line.split(",")[0] for line in manifestLines}
    assert set(listingIds()) == truthIds == manifestIds


def test_groundTruthEncodesTheTraps():
    truth = {
        listingId: ListingExtraction.model_validate_json(
            (EVAL_DIR / "ground_truth" / f"{listingId}.json").read_text(encoding="utf-8")
        )
        for listingId in listingIds()
    }
    if "listing-003" in truth:
        assert truth["listing-003"].currentMonthlyRent is None
        assert truth["listing-003"].occupancyStatus.value == "mixed"
    if "listing-002" in truth:
        assert truth["listing-002"].agencyFeesIncluded is None
        assert truth["listing-002"].energyClass is None
