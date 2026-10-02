import logging

from app.pricing import WorksPriceGrid
from app.schemas import (
    CRITICAL_FIELDS,
    IMPORTANT_FIELDS,
    AnalysisAssumptions,
    AnalysisRequest,
    AnalysisResult,
    AnalysisStatus,
    ExtractedField,
    FinancingResult,
    ListingExtraction,
    OccupancyStatus,
    PropertyType,
    WorkCategory,
    WorksPricingMode,
    WorkUnit,
    YieldBase,
)

logger = logging.getLogger("deal-analyzer-finance")

PRICE_PER_SQM_MIN = 300
PRICE_PER_SQM_MAX = 15000
HIGH_YIELD_THRESHOLD = 0.20
WORKS_DURATION_REFERENCE_EUR = 10000


def totalOrNone(*amounts: float | None) -> float | None:
    if any(amount is None for amount in amounts):
        return None
    return sum(amounts)


def rounded(value: float | None, digits: int) -> float | None:
    return None if value is None else round(value, digits)


def priceWorkItems(extraction: ListingExtraction, grid: WorksPriceGrid) -> tuple[float, list[WorkCategory]]:
    pricedTotal = 0.0
    unpriced: list[WorkCategory] = []
    for item in extraction.worksItems:
        gridPrice = grid.itemPrices[item.category]
        quantity: float | None
        if gridPrice.value is None:
            quantity = None
        elif item.quantity is None:
            # A lump sum needs no quantity; per-unit and per-sqm prices cannot be guessed.
            quantity = 1.0 if gridPrice.unit is WorkUnit.LUMP_SUM else None
        elif item.unit is gridPrice.unit:
            quantity = item.quantity
        else:
            quantity = None
        if quantity is None:
            if item.category not in unpriced:
                unpriced.append(item.category)
            continue
        pricedTotal += quantity * gridPrice.value
    return pricedTotal, unpriced


def computeWorks(
    extraction: ListingExtraction, grid: WorksPriceGrid, warnings: list[str]
) -> tuple[float | None, WorksPricingMode, list[WorkCategory]]:
    pricedTotal, unpriced = priceWorkItems(extraction, grid)
    if extraction.worksItems and not unpriced:
        return pricedTotal, WorksPricingMode.ITEMIZED, []

    if not extraction.worksItems:
        warnings.append("Aucun poste de travaux repéré dans les textes : travaux non chiffrés par poste.")
    elif pricedTotal > 0:
        warnings.append("Certains postes sont chiffrés par la grille, d'autres non : le total par poste est écarté.")

    condition = extraction.overallCondition
    area = extraction.livingAreaSqm
    if condition is not None and area is not None:
        perSqm = grid.fallbackPerSqmByCondition[condition].value
        if perSqm is not None:
            warnings.append(
                f"Travaux estimés au m² d'après l'état général ({condition.value}, {perSqm:g} €/m²), "
                "pas poste par poste."
            )
            return perSqm * area, WorksPricingMode.PER_SQM_FALLBACK, unpriced
    warnings.append("Travaux non chiffrés : aucun prix de grille applicable (postes ou état général).")
    return None, WorksPricingMode.NONE, unpriced


def computeFurniture(extraction: ListingExtraction, assumptions: AnalysisAssumptions, grid: WorksPriceGrid) -> float | None:
    if assumptions.furnitureBudget is not None:
        return assumptions.furnitureBudget
    if extraction.propertyType is None:
        return None
    return grid.furnitureBudgetByPropertyType[extraction.propertyType].value


def isWholeBuildingCase(extraction: ListingExtraction) -> bool:
    return extraction.propertyType is PropertyType.BUILDING or extraction.occupancyStatus is OccupancyStatus.MIXED


def computeFinancing(
    request: AnalysisRequest,
    purchasePrice: float,
    worksCost: float,
    totalBudget: float,
    monthlyRent: float,
    warnings: list[str],
) -> FinancingResult | None:
    financing = request.assumptions.financing
    if financing is None:
        return None
    assumptions = request.assumptions
    extraction = request.extraction

    downPayment = financing.downPaymentRate * (purchasePrice + worksCost)
    loanAmount = max(totalBudget - downPayment, 0.0)
    monthlyRate = financing.loanRate / 12
    months = financing.loanDurationMonths
    if monthlyRate == 0:
        monthlyPayment = loanAmount / months
    else:
        monthlyPayment = loanAmount * monthlyRate / (1 - (1 + monthlyRate) ** -months)
    monthlyInsurance = loanAmount * financing.insuranceRate / 12

    if extraction.annualCondoFees is None:
        warnings.append("Charges de copropriété inconnues : non déduites du cash-flow.")
    if extraction.annualPropertyTax is None:
        warnings.append("Taxe foncière inconnue : non déduite du cash-flow.")
    yearlyCharges = (
        (extraction.annualCondoFees or 0.0) + (extraction.annualPropertyTax or 0.0) + assumptions.annualLandlordInsurance
    )
    netRent = monthlyRent * (1 - assumptions.vacancyRate) * (1 - assumptions.managementFeeRate)
    monthlyCashFlow = netRent - monthlyPayment - monthlyInsurance - yearlyCharges / 12
    return FinancingResult(
        downPayment=round(downPayment, 2),
        loanAmount=round(loanAmount, 2),
        monthlyPayment=round(monthlyPayment, 2),
        monthlyInsurance=round(monthlyInsurance, 2),
        monthlyCashFlow=round(monthlyCashFlow, 2),
    )


def flagPricePerSqm(label: str, amount: float | None, area: float | None, warnings: list[str]) -> None:
    if amount is None or area is None:
        return
    perSqm = amount / area
    if not PRICE_PER_SQM_MIN <= perSqm <= PRICE_PER_SQM_MAX:
        warnings.append(
            f"{label} de {perSqm:,.0f} €/m² hors de la plage attendue ({PRICE_PER_SQM_MIN} à {PRICE_PER_SQM_MAX} €/m²) : "
            "vérifier les données."
        )


def analyze(request: AnalysisRequest, grid: WorksPriceGrid) -> AnalysisResult:
    extraction = request.extraction
    assumptions = request.assumptions
    warnings: list[str] = []

    missingCritical: list[ExtractedField] = [
        field for field in CRITICAL_FIELDS if getattr(extraction, field.value) is None
    ]
    missingImportant = [field.value for field in IMPORTANT_FIELDS if getattr(extraction, field.value) is None]
    if missingImportant:
        warnings.append("Informations non trouvées dans les textes : " + ", ".join(missingImportant) + ".")
    if extraction.occupancyStatus is OccupancyStatus.RENTED:
        for field in ("currentMonthlyRent", "rentIncludesCharges"):
            if getattr(extraction, field) is None:
                warnings.append(f"Bien loué : {field} non trouvé dans les textes.")

    purchasePrice = extraction.askingPrice
    notaryFees = purchasePrice * assumptions.notaryFeeRate if purchasePrice is not None else None
    worksCost, worksMode, unpriced = computeWorks(extraction, grid, warnings)
    furnitureCost = computeFurniture(extraction, assumptions, grid)

    baseComponents = {
        "prix d'achat": purchasePrice,
        "frais de notaire": notaryFees,
        "travaux": worksCost,
        "ameublement": furnitureCost,
    }
    baseBudget = totalOrNone(*baseComponents.values())
    unknownComponents = [name for name, amount in baseComponents.items() if amount is None]
    if unknownComponents:
        warnings.append("Budget non calculé, montants inconnus : " + ", ".join(unknownComponents) + ".")
    totalBudget = totalOrNone(baseBudget, assumptions.otherCosts)

    wholeBuilding = isWholeBuildingCase(extraction)
    if wholeBuilding:
        warnings.append("Analyse par lot non supportée (immeuble ou occupation mixte) : rendement non calculé.")
    monthlyRent = None if wholeBuilding else assumptions.expectedMonthlyRent
    if monthlyRent is None and not wholeBuilding:
        warnings.append("Loyer estimé après travaux non saisi : rendement non calculé.")
    annualRent = monthlyRent * 12 if monthlyRent is not None else None

    yieldOnBase = annualRent / baseBudget if annualRent is not None and baseBudget else None
    yieldOnTotal = annualRent / totalBudget if annualRent is not None and totalBudget else None
    primaryYield = yieldOnBase if assumptions.primaryYieldBase is YieldBase.ACQUISITION_AND_WORKS else yieldOnTotal
    for candidate in (yieldOnBase, yieldOnTotal):
        if candidate is not None and candidate > HIGH_YIELD_THRESHOLD:
            warnings.append("Rendement brut supérieur à 20 % : vérifier les données.")
            break

    flagPricePerSqm("Prix d'achat", purchasePrice, extraction.livingAreaSqm, warnings)
    flagPricePerSqm("Coût des travaux", worksCost, extraction.livingAreaSqm, warnings)

    durationReference = grid.worksDurationMonthsPer10kEur.value
    estimatedDuration = (
        worksCost / WORKS_DURATION_REFERENCE_EUR * durationReference
        if worksCost is not None and durationReference is not None
        else None
    )

    financingResult = None
    if None not in (purchasePrice, worksCost, totalBudget, monthlyRent):
        financingResult = computeFinancing(request, purchasePrice, worksCost, totalBudget, monthlyRent, warnings)
    elif assumptions.financing is not None:
        warnings.append("Financement non calculé : budget ou loyer inconnu.")

    status = AnalysisStatus.INCOMPLETE if missingCritical or baseBudget is None else AnalysisStatus.READY_FOR_REVIEW
    if grid.status != "validated":
        warnings.append(f"Grille de prix au statut « {grid.status} » : les montants ne constituent pas un barème.")
    logger.info("Analysis done: status=%s worksMode=%s warnings=%d", status.value, worksMode.value, len(warnings))

    return AnalysisResult(
        status=status,
        pricingGridStatus=grid.status,
        pricingGridVersion=grid.gridVersion,
        purchasePrice=purchasePrice,
        worksCost=rounded(worksCost, 2),
        worksPricingMode=worksMode,
        furnitureCost=rounded(furnitureCost, 2),
        notaryFees=rounded(notaryFees, 2),
        otherCosts=assumptions.otherCosts,
        acquisitionAndWorksBase=rounded(baseBudget, 2),
        totalBudget=rounded(totalBudget, 2),
        annualRent=rounded(annualRent, 2),
        grossYieldOnAcquisitionAndWorks=rounded(yieldOnBase, 8),
        grossYieldOnTotalBudget=rounded(yieldOnTotal, 8),
        primaryYield=rounded(primaryYield, 8),
        primaryYieldBase=assumptions.primaryYieldBase,
        estimatedWorksDurationMonths=rounded(estimatedDuration, 2),
        financing=financingResult,
        unpricedWorkItems=unpriced,
        missingCriticalFields=missingCritical,
        warnings=warnings,
    )
