import copy
import json
import os
from pathlib import Path

import pytest
import yaml
from fastapi.testclient import TestClient

from app.finance import analyze
from app.main import app
from app.pricing import WorksPriceGrid, loadWorksPriceGrid
from app.schemas import (
    AnalysisRequest,
    AnalysisStatus,
    WorkCategory,
    WorksPricingMode,
)

EVAL_DIR = Path(os.environ.get("EVAL_DIR", Path(__file__).resolve().parents[2] / "eval"))
PRICING_DIR = Path(os.environ.get("PRICING_DIR", Path(__file__).resolve().parents[2] / "pricing"))
GRID_PATH = PRICING_DIR / "works-grid.example.yaml"

client = TestClient(app)


def loadTruth(caseId: str) -> dict:
    return json.loads((EVAL_DIR / "ground_truth" / f"listing-{caseId}.json").read_text(encoding="utf-8"))


def makeAssumptions(**overrides) -> dict:
    base = {"notaryFeeRate": 0.07, "expectedMonthlyRent": 570, "furnitureBudget": None, "financing": None}
    return {**base, **overrides}


def makeRequest(extraction: dict, **assumptionOverrides) -> AnalysisRequest:
    return AnalysisRequest.model_validate(
        {"extraction": extraction, "assumptions": makeAssumptions(**assumptionOverrides)}
    )


def makeGrid(edit) -> WorksPriceGrid:
    raw = yaml.safe_load(GRID_PATH.read_text(encoding="utf-8"))
    edit(raw)
    return WorksPriceGrid.model_validate(raw)


@pytest.fixture(scope="module")
def grid() -> WorksPriceGrid:
    return loadWorksPriceGrid(GRID_PATH)


def test_publishedCaseCrossCheck(grid):
    result = analyze(makeRequest(loadTruth("004")), grid)
    assert result.worksPricingMode is WorksPricingMode.PER_SQM_FALLBACK
    assert result.worksCost == pytest.approx(21000)
    assert result.furnitureCost == 4000
    assert result.notaryFees == pytest.approx(1680)
    assert result.acquisitionAndWorksBase == pytest.approx(50680)
    assert result.annualRent == 6840
    assert result.primaryYield == pytest.approx(0.135, abs=0.002)
    assert result.estimatedWorksDurationMonths == pytest.approx(2.1)
    assert result.status is AnalysisStatus.READY_FOR_REVIEW


def test_publishedCaseWithHigherNotaryRate(grid):
    result = analyze(makeRequest(loadTruth("004"), notaryFeeRate=0.08), grid)
    assert result.primaryYield == pytest.approx(0.1343, abs=0.0002)


def test_twoYieldsUseTheirOwnBase(grid):
    result = analyze(makeRequest(loadTruth("004"), otherCosts=2000), grid)
    assert result.totalBudget == pytest.approx(52680)
    assert result.grossYieldOnAcquisitionAndWorks == pytest.approx(6840 / 50680)
    assert result.grossYieldOnTotalBudget == pytest.approx(6840 / 52680)
    assert result.primaryYield == result.grossYieldOnAcquisitionAndWorks


def test_gridStatusIsReported(grid):
    result = analyze(makeRequest(loadTruth("004")), grid)
    assert result.pricingGridStatus == "illustrative"
    assert any("illustrative" in warning for warning in result.warnings)


def test_itemizedModeWhenEveryItemIsPriced():
    def edit(raw):
        raw["itemPrices"]["windows"].update(value=500, source="test")
        raw["itemPrices"]["flooring"].update(value=40, source="test")
        raw["itemPrices"]["bathroom"].update(value=6000, source="test")

    truth = loadTruth("004")
    truth["worksItems"] = [
        {"category": "windows", "quantity": 3, "unit": "unit", "note": None, "excerpt": "x", "source": "listing"},
        {"category": "flooring", "quantity": 25, "unit": "sqm", "note": None, "excerpt": "x", "source": "listing"},
        {"category": "bathroom", "quantity": None, "unit": None, "note": None, "excerpt": "x", "source": "listing"},
    ]
    result = analyze(makeRequest(truth), makeGrid(edit))
    assert result.worksPricingMode is WorksPricingMode.ITEMIZED
    assert result.worksCost == 3 * 500 + 25 * 40 + 6000
    assert result.unpricedWorkItems == []


def test_perSqmItemWithoutQuantityStaysUnpriced():
    def edit(raw):
        raw["itemPrices"]["painting"].update(value=25, source="test")

    truth = loadTruth("004")
    truth["overallCondition"] = None
    truth["worksItems"] = [
        {"category": "painting", "quantity": None, "unit": None, "note": None, "excerpt": "x", "source": "listing"}
    ]
    result = analyze(makeRequest(truth), makeGrid(edit))
    assert result.worksPricingMode is WorksPricingMode.NONE
    assert result.worksCost is None
    assert result.unpricedWorkItems == [WorkCategory.PAINTING]


def test_unitMismatchStaysUnpriced():
    def edit(raw):
        raw["itemPrices"]["windows"].update(value=500, source="test")

    truth = loadTruth("004")
    truth["overallCondition"] = None
    truth["worksItems"] = [
        {"category": "windows", "quantity": 4, "unit": "sqm", "note": None, "excerpt": "x", "source": "listing"}
    ]
    result = analyze(makeRequest(truth), makeGrid(edit))
    assert result.unpricedWorkItems == [WorkCategory.WINDOWS]
    assert result.worksCost is None


def test_noWorksPriceMeansNoBudgetAndNoYield(grid):
    truth = loadTruth("004")
    truth["overallCondition"] = "heavyRenovation"
    result = analyze(makeRequest(truth), grid)
    assert result.worksPricingMode is WorksPricingMode.NONE
    assert result.worksCost is None
    assert result.acquisitionAndWorksBase is None
    assert result.primaryYield is None
    assert result.status is AnalysisStatus.INCOMPLETE
    assert WorkCategory.BATHROOM in result.unpricedWorkItems


def test_unknownFurnitureBlocksTheBudget(grid):
    truth = loadTruth("004")
    truth["propertyType"] = "apartment"
    result = analyze(makeRequest(truth), grid)
    assert result.furnitureCost is None
    assert result.acquisitionAndWorksBase is None


def test_explicitFurnitureBudgetOverridesTheGrid(grid):
    result = analyze(makeRequest(loadTruth("004"), furnitureBudget=0), grid)
    assert result.furnitureCost == 0


def test_missingCriticalFieldsMakeTheStudyIncomplete(grid):
    truth = loadTruth("004")
    truth["askingPrice"] = None
    truth["sourceExcerpts"] = [item for item in truth["sourceExcerpts"] if item["field"] != "askingPrice"]
    result = analyze(makeRequest(truth), grid)
    assert result.status is AnalysisStatus.INCOMPLETE
    assert [field.value for field in result.missingCriticalFields] == ["askingPrice"]
    assert result.notaryFees is None


def test_missingExpectedRentLeavesYieldEmpty(grid):
    result = analyze(makeRequest(loadTruth("004"), expectedMonthlyRent=None), grid)
    assert result.annualRent is None
    assert result.primaryYield is None
    assert result.acquisitionAndWorksBase == pytest.approx(50680)


def test_buildingGetsNoYield(grid):
    result = analyze(makeRequest(loadTruth("003")), grid)
    assert result.annualRent is None
    assert result.primaryYield is None
    assert any("lot" in warning for warning in result.warnings)


def test_highYieldIsFlagged(grid):
    result = analyze(makeRequest(loadTruth("004"), expectedMonthlyRent=1500), grid)
    assert any("20 %" in warning for warning in result.warnings)


def test_outOfRangePricePerSqmIsFlagged(grid):
    truth = loadTruth("004")
    truth["askingPrice"] = 2000
    result = analyze(makeRequest(truth), grid)
    assert any("Prix d'achat" in warning and "€/m²" in warning for warning in result.warnings)


def test_financingWithStandardLoan(grid):
    financing = {"loanRate": 0.035, "insuranceRate": 0.003, "loanDurationMonths": 240, "downPaymentRate": 0.10}
    truth = loadTruth("004")
    truth["askingPrice"] = 50000
    result = analyze(makeRequest(truth, notaryFeeRate=0, furnitureBudget=0, financing=financing), grid)
    assert result.totalBudget == pytest.approx(71000)
    assert result.financing.downPayment == pytest.approx(7100)
    assert result.financing.loanAmount == pytest.approx(63900)
    assert result.financing.monthlyPayment == pytest.approx(370.59, abs=0.05)
    assert result.financing.monthlyInsurance == pytest.approx(63900 * 0.003 / 12, abs=0.01)


def test_financingCashFlowDeductsChargesAndVacancy(grid):
    financing = {"loanRate": 0, "insuranceRate": 0, "loanDurationMonths": 120, "downPaymentRate": 0}
    truth = loadTruth("004")
    truth["annualCondoFees"] = 1200
    truth["annualPropertyTax"] = 600
    result = analyze(makeRequest(truth, financing=financing, vacancyRate=0.1), grid)
    expectedPayment = 50680 / 120
    expectedCashFlow = 570 * 0.9 - expectedPayment - (1200 + 600) / 12
    assert result.financing.monthlyPayment == pytest.approx(expectedPayment, abs=0.01)
    assert result.financing.monthlyCashFlow == pytest.approx(expectedCashFlow, abs=0.02)


def test_financingSkippedWhenBudgetUnknown(grid):
    financing = {"loanRate": 0.035, "insuranceRate": 0.003}
    truth = loadTruth("004")
    truth["overallCondition"] = "heavyRenovation"
    result = analyze(makeRequest(truth, financing=financing), grid)
    assert result.financing is None
    assert any("Financement non calculé" in warning for warning in result.warnings)


def test_analyzeEndpoint():
    payload = {"extraction": loadTruth("004"), "assumptions": makeAssumptions()}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["acquisitionAndWorksBase"] == pytest.approx(50680)
    assert body["pricingGridStatus"] == "illustrative"


def test_analyzeEndpointRejectsMissingAssumptions():
    payload = {"extraction": loadTruth("004"), "assumptions": {"expectedMonthlyRent": 570}}
    response = client.post("/analyze", json=payload)
    assert response.status_code == 422
    assert response.json()["error"] == "validationFailed"


def test_analyzeDoesNotMutateInput(grid):
    request = makeRequest(loadTruth("004"))
    before = copy.deepcopy(request.model_dump())
    analyze(request, grid)
    assert request.model_dump() == before
