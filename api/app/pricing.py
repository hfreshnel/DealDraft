import logging
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, ValidationError, model_validator

from app.schemas import (
    OverallCondition,
    PositiveFloat,
    PropertyType,
    WorkCategory,
    WorkUnit,
)

logger = logging.getLogger("deal-analyzer-pricing")


class PricingGridError(Exception):
    pass


class PricePoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: PositiveFloat | None
    source: str | None

    @model_validator(mode="after")
    def checkSourced(self) -> "PricePoint":
        # A price without a source is an invented price.
        if self.value is not None and not self.source:
            raise ValueError("every non-null price must have a source")
        return self


class WorkItemPrice(PricePoint):
    unit: WorkUnit


class WorksPriceGrid(BaseModel):
    model_config = ConfigDict(extra="forbid")

    gridVersion: int
    status: Literal["illustrative", "validated"]
    currency: Literal["EUR"]
    itemPrices: dict[WorkCategory, WorkItemPrice]
    fallbackPerSqmByCondition: dict[OverallCondition, PricePoint]
    furnitureBudgetByPropertyType: dict[PropertyType, PricePoint]
    worksDurationMonthsPer10kEur: PricePoint

    @model_validator(mode="after")
    def checkCompleteness(self) -> "WorksPriceGrid":
        expectedKeys = (
            ("itemPrices", set(WorkCategory), set(self.itemPrices)),
            ("fallbackPerSqmByCondition", set(OverallCondition), set(self.fallbackPerSqmByCondition)),
            ("furnitureBudgetByPropertyType", set(PropertyType), set(self.furnitureBudgetByPropertyType)),
        )
        for name, expected, actual in expectedKeys:
            missing = expected - actual
            if missing:
                missingNames = sorted(member.value for member in missing)
                raise ValueError(f"{name} is missing entries: {missingNames}")
        return self


def loadWorksPriceGrid(path: Path) -> WorksPriceGrid:
    try:
        rawContent = yaml.safe_load(path.read_text(encoding="utf-8"))
        return WorksPriceGrid.model_validate(rawContent)
    except (OSError, yaml.YAMLError, ValidationError) as exc:
        logger.error("Cannot load pricing grid %s: %s", path, exc)
        raise PricingGridError(f"Invalid pricing grid {path}") from exc
