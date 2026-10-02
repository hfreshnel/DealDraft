from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

PositiveFloat = Annotated[float, Field(gt=0)]
NonNegativeFloat = Annotated[float, Field(ge=0)]
PositiveInt = Annotated[int, Field(gt=0)]
Rate = Annotated[float, Field(ge=0, le=1)]
FloorNumber = Annotated[int, Field(ge=-1, le=60)]


class PropertyType(str, Enum):
    STUDIO = "studio"
    APARTMENT = "apartment"
    HOUSE = "house"
    BUILDING = "building"
    OFFICE = "office"
    COMMERCIAL = "commercial"
    OTHER = "other"


class OccupancyStatus(str, Enum):
    VACANT = "vacant"
    RENTED = "rented"
    OWNER_OCCUPIED = "ownerOccupied"
    MIXED = "mixed"


class OverallCondition(str, Enum):
    GOOD = "good"
    REFRESH = "refresh"
    RENOVATION = "renovation"
    HEAVY_RENOVATION = "heavyRenovation"


class EnergyClass(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"


class TextSource(str, Enum):
    LISTING = "listing"
    VISIT_NOTES = "visitNotes"


class WorkCategory(str, Enum):
    WINDOWS = "windows"
    PAINTING = "painting"
    FLOORING = "flooring"
    BATHROOM = "bathroom"
    KITCHEN = "kitchen"
    ELECTRICITY = "electricity"
    PLUMBING = "plumbing"
    HEATING = "heating"
    INSULATION = "insulation"
    PARTITIONS = "partitions"
    ROOFING = "roofing"
    FACADE = "facade"
    ENTRANCE_DOOR = "entranceDoor"
    OTHER = "other"


class WorkUnit(str, Enum):
    SQM = "sqm"
    LINEAR_METER = "linearMeter"
    UNIT = "unit"
    LUMP_SUM = "lumpSum"


class ExtractedField(str, Enum):
    LISTING_TITLE = "listingTitle"
    CITY = "city"
    DISTRICT = "district"
    PROPERTY_TYPE = "propertyType"
    LIVING_AREA_SQM = "livingAreaSqm"
    ROOM_COUNT = "roomCount"
    FLOOR_NUMBER = "floorNumber"
    HAS_ELEVATOR = "hasElevator"
    LOT_COUNT = "lotCount"
    ASKING_PRICE = "askingPrice"
    AGENCY_FEES_INCLUDED = "agencyFeesIncluded"
    OCCUPANCY_STATUS = "occupancyStatus"
    CURRENT_MONTHLY_RENT = "currentMonthlyRent"
    RENT_INCLUDES_CHARGES = "rentIncludesCharges"
    LEASE_END_DATE = "leaseEndDate"
    ANNUAL_CONDO_FEES = "annualCondoFees"
    ANNUAL_PROPERTY_TAX = "annualPropertyTax"
    ENERGY_CLASS = "energyClass"
    OVERALL_CONDITION = "overallCondition"


# Fields whose extracted value must be backed by a verbatim excerpt (listingTitle is exempt).
EXCERPT_REQUIRED_FIELDS: tuple[ExtractedField, ...] = tuple(
    field for field in ExtractedField if field is not ExtractedField.LISTING_TITLE
)

# Missing value blocks the yield computation.
CRITICAL_FIELDS: tuple[ExtractedField, ...] = (
    ExtractedField.ASKING_PRICE,
    ExtractedField.LIVING_AREA_SQM,
    ExtractedField.PROPERTY_TYPE,
)

# Missing value produces a warning on the report but does not block it.
IMPORTANT_FIELDS: tuple[ExtractedField, ...] = (
    ExtractedField.CITY,
    ExtractedField.OCCUPANCY_STATUS,
    ExtractedField.OVERALL_CONDITION,
    ExtractedField.ENERGY_CLASS,
    ExtractedField.ANNUAL_CONDO_FEES,
    ExtractedField.ANNUAL_PROPERTY_TAX,
)

# Required only when the property is sold with a tenant.
RENTAL_CRITICAL_FIELDS: tuple[ExtractedField, ...] = (
    ExtractedField.CURRENT_MONTHLY_RENT,
    ExtractedField.RENT_INCLUDES_CHARGES,
)

NULL_RULE = "Use null if the text does not explicitly state it. Never guess, never compute."


class SourceExcerpt(BaseModel):
    model_config = ConfigDict(extra="forbid")

    field: ExtractedField = Field(description="Name of the extracted field this excerpt supports.")
    excerpt: str = Field(
        min_length=1,
        max_length=300,
        description="Passage copied verbatim from the source text that justifies the value.",
    )
    source: TextSource = Field(description="Which input text the excerpt comes from.")


class WorkItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: WorkCategory = Field(description="Closed list of work categories. Use 'other' only if none fits.")
    quantity: PositiveFloat | None = Field(
        description="Quantity if the text states it (3 windows, 25 sqm). null otherwise. Never estimate."
    )
    unit: WorkUnit | None = Field(description="Unit of the quantity. Required when quantity is set, null otherwise.")
    note: str | None = Field(description="Short precision. Mandatory when category is 'other', null otherwise.")
    excerpt: str = Field(
        min_length=1,
        max_length=300,
        description="Passage copied verbatim from the source text that mentions this work.",
    )
    source: TextSource = Field(description="Which input text the excerpt comes from.")

    @model_validator(mode="after")
    def checkConsistency(self) -> "WorkItem":
        if self.quantity is not None and self.unit is None:
            raise ValueError("unit is required when quantity is set")
        if self.quantity is None and self.unit is not None:
            raise ValueError("unit must be null when quantity is null")
        if self.category is WorkCategory.OTHER and not self.note:
            raise ValueError("note is mandatory when category is 'other'")
        return self


class ListingExtraction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    listingTitle: str | None = Field(description=f"Headline of the listing or message. {NULL_RULE}")
    city: str | None = Field(description=f"City name only, without postal code. {NULL_RULE}")
    district: str | None = Field(description=f"Neighbourhood or area. No exact street address. {NULL_RULE}")
    propertyType: PropertyType | None = Field(
        description=f"'building' means a whole building sold with several lots. {NULL_RULE}"
    )
    livingAreaSqm: PositiveFloat | None = Field(
        description=f"Living area in square meters; an approximate value ('about 30') is kept as is. {NULL_RULE}"
    )
    roomCount: PositiveInt | None = Field(description=f"Main rooms (T2 = 2, studio = 1). {NULL_RULE}")
    floorNumber: FloorNumber | None = Field(description=f"Floor number, 0 for ground floor. {NULL_RULE}")
    hasElevator: bool | None = Field(description=f"True or false only if the text says so. {NULL_RULE}")
    lotCount: PositiveInt | None = Field(
        description=f"Number of lots included in this sale (buildings only). {NULL_RULE}"
    )
    askingPrice: PositiveFloat | None = Field(
        description=f"Total asking price in euros ('28k' = 28000). Whole price for multi-lot sales. {NULL_RULE}"
    )
    agencyFeesIncluded: bool | None = Field(
        description=f"True only if fees are explicitly included, false only if explicitly on top. Ambiguous wording ('net seller') = null. {NULL_RULE}"
    )
    occupancyStatus: OccupancyStatus | None = Field(
        description=f"'mixed' when some lots are vacant and others rented. {NULL_RULE}"
    )
    currentMonthlyRent: PositiveFloat | None = Field(
        description=f"Current monthly rent of a single rented unit. Several rents in the text = null, never add them. {NULL_RULE}"
    )
    rentIncludesCharges: bool | None = Field(description=f"True if rent includes charges ('CC'). {NULL_RULE}")
    leaseEndDate: str | None = Field(
        pattern=r"^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$",
        description=f"End of the current lease, YYYY-MM or YYYY-MM-DD. {NULL_RULE}",
    )
    annualCondoFees: NonNegativeFloat | None = Field(
        description=f"Yearly co-ownership charges in euros. Convert monthly amounts to yearly. {NULL_RULE}"
    )
    annualPropertyTax: NonNegativeFloat | None = Field(description=f"Yearly property tax in euros. {NULL_RULE}")
    energyClass: EnergyClass | None = Field(description=f"Energy performance class. {NULL_RULE}")
    overallCondition: OverallCondition | None = Field(
        description=(
            "Only from an explicit statement about the whole property: good = nothing to do, "
            "refresh = paint and floors, renovation = complete renovation, heavyRenovation = structural works. "
            "Partial work lists alone give null. Never guess."
        )
    )
    worksItems: list[WorkItem] = Field(
        description="One entry per work explicitly mentioned in the listing or visit notes. Empty list if none."
    )
    riskFlags: list[str] = Field(
        description="Factual points an investor must check (uncertain figures, humidity, non-compliant wiring, ambiguity). Empty list if none."
    )
    sourceExcerpts: list[SourceExcerpt] = Field(
        description="One verbatim excerpt for each non-null field, except listingTitle."
    )


class YieldBase(str, Enum):
    ACQUISITION_AND_WORKS = "acquisitionAndWorks"
    TOTAL_BUDGET = "totalBudget"


class FinancingAssumptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    loanRate: Rate
    insuranceRate: Rate
    loanDurationMonths: Annotated[int, Field(ge=12, le=360)] = 240
    # Month'immo FAQ: about 10% of the amount invested (purchase + works).
    downPaymentRate: Rate = 0.10


class AnalysisAssumptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Required but nullable: the caller must state explicitly that a value is unknown.
    notaryFeeRate: Rate
    expectedMonthlyRent: PositiveFloat | None
    furnitureBudget: NonNegativeFloat | None
    financing: FinancingAssumptions | None

    otherCosts: NonNegativeFloat = 0
    vacancyRate: Rate = 1 / 12
    managementFeeRate: Rate = 0
    annualLandlordInsurance: NonNegativeFloat = 0
    primaryYieldBase: YieldBase = YieldBase.ACQUISITION_AND_WORKS


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    extraction: ListingExtraction
    assumptions: AnalysisAssumptions


class AnalysisStatus(str, Enum):
    READY_FOR_REVIEW = "readyForReview"
    INCOMPLETE = "incomplete"


class WorksPricingMode(str, Enum):
    ITEMIZED = "itemized"
    PER_SQM_FALLBACK = "perSqmFallback"
    NONE = "none"


class FinancingResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    downPayment: float
    loanAmount: float
    monthlyPayment: float
    monthlyInsurance: float
    monthlyCashFlow: float


class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: AnalysisStatus
    purchasePrice: float | None
    worksCost: float | None
    worksPricingMode: WorksPricingMode
    furnitureCost: float | None
    notaryFees: float | None
    otherCosts: float
    acquisitionAndWorksBase: float | None
    totalBudget: float | None
    annualRent: float | None
    grossYieldOnAcquisitionAndWorks: float | None
    grossYieldOnTotalBudget: float | None
    primaryYield: float | None
    primaryYieldBase: YieldBase
    estimatedWorksDurationMonths: float | None
    financing: FinancingResult | None
    unpricedWorkItems: list[WorkCategory]
    missingCriticalFields: list[ExtractedField]
    warnings: list[str]


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str
    schemaVersion: str
