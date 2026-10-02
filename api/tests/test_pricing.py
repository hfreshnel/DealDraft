import copy
import os
from pathlib import Path

import pytest
import yaml

from app.pricing import PricingGridError, WorksPriceGrid, loadWorksPriceGrid
from app.schemas import OverallCondition, PropertyType, WorkCategory

PRICING_DIR = Path(os.environ.get("PRICING_DIR", Path(__file__).resolve().parents[2] / "pricing"))
GRID_PATH = PRICING_DIR / "works-grid.example.yaml"


@pytest.fixture
def rawGrid():
    return yaml.safe_load(GRID_PATH.read_text(encoding="utf-8"))


def test_exampleGridLoads():
    grid = loadWorksPriceGrid(GRID_PATH)
    assert grid.status == "illustrative"
    assert grid.currency == "EUR"


def test_exampleGridCoversEveryEnumMember():
    grid = loadWorksPriceGrid(GRID_PATH)
    assert set(grid.itemPrices) == set(WorkCategory)
    assert set(grid.fallbackPerSqmByCondition) == set(OverallCondition)
    assert set(grid.furnitureBudgetByPropertyType) == set(PropertyType)


def test_onlyPublicDataPointsAreFilled():
    grid = loadWorksPriceGrid(GRID_PATH)
    assert all(price.value is None for price in grid.itemPrices.values())
    assert grid.fallbackPerSqmByCondition[OverallCondition.RENOVATION].value == pytest.approx(21000 / 32)
    assert grid.furnitureBudgetByPropertyType[PropertyType.STUDIO].value == 4000


def test_everyFilledPriceHasASource():
    grid = loadWorksPriceGrid(GRID_PATH)
    pricePoints = [
        *grid.itemPrices.values(),
        *grid.fallbackPerSqmByCondition.values(),
        *grid.furnitureBudgetByPropertyType.values(),
        grid.worksDurationMonthsPer10kEur,
    ]
    for pricePoint in pricePoints:
        if pricePoint.value is not None:
            assert pricePoint.source


def test_priceWithoutSourceIsRejected(rawGrid):
    rawGrid["itemPrices"]["windows"]["value"] = 450
    with pytest.raises(Exception):
        WorksPriceGrid.model_validate(rawGrid)


def test_negativePriceIsRejected(rawGrid):
    rawGrid["itemPrices"]["windows"].update({"value": -10, "source": "test"})
    with pytest.raises(Exception):
        WorksPriceGrid.model_validate(rawGrid)


def test_missingCategoryIsRejected(rawGrid):
    del rawGrid["itemPrices"]["roofing"]
    with pytest.raises(Exception) as excinfo:
        WorksPriceGrid.model_validate(rawGrid)
    assert "roofing" in str(excinfo.value)


def test_unknownCategoryIsRejected(rawGrid):
    rawGrid["itemPrices"]["garden"] = copy.deepcopy(rawGrid["itemPrices"]["windows"])
    with pytest.raises(Exception):
        WorksPriceGrid.model_validate(rawGrid)


def test_loaderWrapsErrors(tmp_path):
    brokenPath = tmp_path / "broken.yaml"
    brokenPath.write_text("gridVersion: [unclosed", encoding="utf-8")
    with pytest.raises(PricingGridError):
        loadWorksPriceGrid(brokenPath)


def test_loaderReportsMissingFile(tmp_path):
    with pytest.raises(PricingGridError):
        loadWorksPriceGrid(tmp_path / "absent.yaml")
