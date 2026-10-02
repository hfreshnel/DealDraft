import copy
import json
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.excerpt_check import findExcerptProblems
from app.main import app
from app.schemas import ListingExtraction

EVAL_DIR = Path(os.environ.get("EVAL_DIR", Path(__file__).resolve().parents[2] / "eval"))
GROUND_TRUTH_FILES = sorted((EVAL_DIR / "ground_truth").glob("listing-*.json"))

client = TestClient(app)


def loadCase(truthPath: Path) -> tuple[dict, str, str]:
    caseId = truthPath.stem
    listingText = (EVAL_DIR / "dataset" / f"{caseId}.txt").read_text(encoding="utf-8")
    visitPath = EVAL_DIR / "dataset" / f"{caseId}.visit.txt"
    visitNotes = visitPath.read_text(encoding="utf-8") if visitPath.exists() else ""
    return json.loads(truthPath.read_text(encoding="utf-8")), listingText, visitNotes


@pytest.mark.parametrize("truthPath", GROUND_TRUTH_FILES, ids=lambda path: path.stem)
def test_groundTruthPassesExcerptCheck(truthPath):
    payload, listingText, visitNotes = loadCase(truthPath)
    assert findExcerptProblems(ListingExtraction.model_validate(payload), listingText, visitNotes) == []


def test_modifiedExcerptIsRejected():
    payload, listingText, visitNotes = loadCase(GROUND_TRUTH_FILES[0])
    payload = copy.deepcopy(payload)
    payload["sourceExcerpts"][0]["excerpt"] = payload["sourceExcerpts"][0]["excerpt"] + " invented"
    problems = findExcerptProblems(ListingExtraction.model_validate(payload), listingText, visitNotes)
    assert [problem["type"] for problem in problems] == ["excerptNotVerbatim"]


def test_missingExcerptIsRejected():
    payload, listingText, visitNotes = loadCase(GROUND_TRUTH_FILES[0])
    payload = copy.deepcopy(payload)
    removed = payload["sourceExcerpts"].pop(0)
    problems = findExcerptProblems(ListingExtraction.model_validate(payload), listingText, visitNotes)
    assert [(problem["type"], problem["location"][-1]) for problem in problems] == [("excerptMissing", removed["field"])]


def test_excerptOnNullFieldIsRejected():
    payload, listingText, visitNotes = loadCase(GROUND_TRUTH_FILES[0])
    payload = copy.deepcopy(payload)
    nullField = next(name for name, value in payload.items() if value is None and name != "listingTitle")
    payload["sourceExcerpts"].append({"field": nullField, "excerpt": listingText.split()[0], "source": "listing"})
    problems = findExcerptProblems(ListingExtraction.model_validate(payload), listingText, visitNotes)
    assert [problem["type"] for problem in problems] == ["excerptOnNullField"]


def test_validateExtractionEndpoint():
    payload, listingText, visitNotes = loadCase(GROUND_TRUTH_FILES[0])
    response = client.post(
        "/validate-extraction", json={"extraction": payload, "listingText": listingText, "visitNotes": visitNotes}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "valid"

    payload = copy.deepcopy(payload)
    payload["sourceExcerpts"][0]["excerpt"] = "not in the text"
    response = client.post(
        "/validate-extraction", json={"extraction": payload, "listingText": listingText, "visitNotes": visitNotes}
    )
    assert response.status_code == 422
    assert response.json()["details"][0]["type"] == "excerptNotVerbatim"
