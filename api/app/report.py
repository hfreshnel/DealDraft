import logging
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from app.localization import (
    CONDITION_LABELS,
    FIELD_LABELS,
    NBSP,
    OCCUPANCY_LABELS,
    PROPERTY_TYPE_LABELS,
    SOURCE_LABELS,
    WORK_CATEGORY_LABELS,
    WORK_UNIT_LABELS,
    formatNumber,
)
from app.schemas import (
    AnalysisResult,
    AnalysisStatus,
    ExtractedField,
    ListingExtraction,
    OccupancyStatus,
    ReportRequest,
    WorksPricingMode,
    YieldBase,
)

logger = logging.getLogger("deal-analyzer-report")

TEMPLATE_DIR = Path(__file__).resolve().parent / "templates"
TEMPLATE_NAME = "report.html.j2"
NOT_FOUND = "non trouvé"
# Shown only when a value was found: they only make sense for buildings or rented properties.
CONDITIONAL_FIELDS = {"lotCount", "currentMonthlyRent", "rentIncludesCharges", "leaseEndDate"}
WORKS_MODE_SENTENCES = {
    WorksPricingMode.ITEMIZED: "Travaux chiffrés poste par poste avec la grille de prix.",
    WorksPricingMode.PER_SQM_FALLBACK: (
        "Travaux estimés au m² d'après l'état général : les postes listés ne sont pas chiffrés un par un."
    ),
    WorksPricingMode.NONE: "Travaux non chiffrés : aucun prix de la grille ne s'applique.",
}
YIELD_BASE_LABELS = {
    YieldBase.ACQUISITION_AND_WORKS: "achat + notaire + travaux + ameublement",
    YieldBase.TOTAL_BUDGET: "budget total, autres frais compris",
}
STATUS_LABELS = {
    AnalysisStatus.READY_FOR_REVIEW: "Prêt à relire",
    AnalysisStatus.INCOMPLETE: "Incomplet : données critiques manquantes",
}

ENVIRONMENT = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=True,
    undefined=StrictUndefined,
    trim_blocks=True,
    lstrip_blocks=True,
)


def formatEuros(value: float | None, missing: str = "non chiffré") -> str:
    return missing if value is None else f"{formatNumber(value)}{NBSP}€"


def formatPercent(value: float | None, missing: str = "non calculé") -> str:
    return missing if value is None else f"{formatNumber(value * 100, 2)}{NBSP}%"


def formatBoolean(value: bool | None) -> str:
    return NOT_FOUND if value is None else ("oui" if value else "non")


def formatFieldValue(extraction: ListingExtraction, field: str) -> str:
    value = getattr(extraction, field)
    if value is None:
        return NOT_FOUND
    if isinstance(value, bool):
        return formatBoolean(value)
    match field:
        case "propertyType":
            return PROPERTY_TYPE_LABELS[value.value]
        case "occupancyStatus":
            return OCCUPANCY_LABELS[value.value]
        case "overallCondition":
            return CONDITION_LABELS[value.value]
        case "energyClass":
            return value.value
        case "livingAreaSqm":
            return f"{formatNumber(value, 1)}{NBSP}m²"
        case "floorNumber":
            return "rez-de-chaussée" if value == 0 else ("sous-sol" if value < 0 else str(value))
        case "askingPrice":
            return formatEuros(value)
        case "currentMonthlyRent":
            return f"{formatEuros(value)} par mois"
        case "annualCondoFees" | "annualPropertyTax":
            return f"{formatEuros(value)} par an"
        case _:
            return str(value)


def buildPropertyRows(extraction: ListingExtraction) -> list[dict]:
    excerptsByField: dict[str, list[dict]] = {}
    for excerpt in extraction.sourceExcerpts:
        excerptsByField.setdefault(excerpt.field.value, []).append(
            {"text": excerpt.excerpt, "source": SOURCE_LABELS[excerpt.source.value]}
        )
    rows = []
    for field in ExtractedField:
        name = field.value
        if name == "listingTitle":
            continue
        if name in CONDITIONAL_FIELDS and getattr(extraction, name) is None:
            continue
        rows.append(
            {
                "label": FIELD_LABELS[name],
                "value": formatFieldValue(extraction, name),
                "found": getattr(extraction, name) is not None,
                "excerpts": excerptsByField.get(name, []),
            }
        )
    return rows


def buildWorkRows(extraction: ListingExtraction, analysis: AnalysisResult) -> list[dict]:
    unpriced = {category.value for category in analysis.unpricedWorkItems}
    rows = []
    for item in extraction.worksItems:
        quantity = "non précisée"
        if item.quantity is not None and item.unit is not None:
            quantity = f"{formatNumber(item.quantity, 1)}{NBSP}{WORK_UNIT_LABELS[item.unit.value]}"
        label = WORK_CATEGORY_LABELS[item.category.value]
        if item.note:
            label = f"{label} ({item.note})"
        rows.append(
            {
                "label": label,
                "quantity": quantity,
                "priced": "non" if item.category.value in unpriced else "oui",
                "excerpt": item.excerpt,
                "source": SOURCE_LABELS[item.source.value],
            }
        )
    return rows


def buildTitle(request: ReportRequest) -> str:
    extraction = request.extraction
    parts = [request.meta.studyId]
    if extraction.propertyType is not None:
        parts.append(PROPERTY_TYPE_LABELS[extraction.propertyType.value])
    if extraction.livingAreaSqm is not None:
        parts.append(f"{formatNumber(extraction.livingAreaSqm, 1)} m²")
    if extraction.city is not None:
        parts.append(extraction.city)
    return "Étude de rendement · " + " · ".join(parts)


def furnitureOrigin(request: ReportRequest, analysis: AnalysisResult) -> str:
    if request.assumptions.furnitureBudget is not None:
        return "saisi"
    if analysis.furnitureCost is not None:
        return "grille, selon le type de bien"
    return "inconnu"


def buildView(request: ReportRequest, analysis: AnalysisResult) -> dict:
    extraction = request.extraction
    assumptions = request.assumptions
    meta = request.meta
    financing = analysis.financing
    return {
        "title": buildTitle(request),
        "listingTitle": extraction.listingTitle,
        "studyId": meta.studyId,
        "createdAt": meta.createdAt.strftime("%d/%m/%Y à %H:%M"),
        "revision": meta.revision,
        "revisionNote": meta.revisionNote,
        "statusLabel": STATUS_LABELS[analysis.status],
        "isIllustrativeGrid": analysis.pricingGridStatus != "validated",
        "pricingGridStatus": analysis.pricingGridStatus,
        "pricingGridVersion": analysis.pricingGridVersion,
        "summary": [
            {"label": "Budget total", "value": formatEuros(analysis.totalBudget)},
            {
                "label": "Loyer mensuel estimé après travaux",
                "value": formatEuros(assumptions.expectedMonthlyRent, "non saisi"),
            },
            {
                "label": f"Rendement brut ({YIELD_BASE_LABELS[analysis.primaryYieldBase]})",
                "value": formatPercent(analysis.primaryYield),
            },
            {"label": "Points de vigilance", "value": str(len(extraction.riskFlags) + len(analysis.warnings))},
        ],
        "propertyRows": buildPropertyRows(extraction),
        "budgetRows": [
            {"label": "Prix d'achat", "value": formatEuros(analysis.purchasePrice)},
            {
                "label": f"Frais de notaire ({formatPercent(assumptions.notaryFeeRate)} du prix)",
                "value": formatEuros(analysis.notaryFees),
            },
            {"label": "Travaux", "value": formatEuros(analysis.worksCost)},
            {
                "label": f"Ameublement ({furnitureOrigin(request, analysis)})",
                "value": formatEuros(analysis.furnitureCost),
            },
        ],
        "acquisitionAndWorksBase": formatEuros(analysis.acquisitionAndWorksBase),
        "otherCosts": formatEuros(analysis.otherCosts),
        "totalBudget": formatEuros(analysis.totalBudget),
        "worksModeSentence": WORKS_MODE_SENTENCES[analysis.worksPricingMode],
        "worksDuration": (
            None
            if analysis.estimatedWorksDurationMonths is None
            else formatNumber(analysis.estimatedWorksDurationMonths, 1)
        ),
        "expectedMonthlyRent": formatEuros(assumptions.expectedMonthlyRent, "non saisi"),
        "annualRent": formatEuros(analysis.annualRent, "non calculé"),
        "yieldOnAcquisitionAndWorks": formatPercent(analysis.grossYieldOnAcquisitionAndWorks),
        "yieldOnTotalBudget": formatPercent(analysis.grossYieldOnTotalBudget),
        "primaryYieldBase": YIELD_BASE_LABELS[analysis.primaryYieldBase],
        "financingRows": None
        if financing is None
        else [
            {"label": "Apport", "value": formatEuros(financing.downPayment)},
            {"label": "Montant emprunté", "value": formatEuros(financing.loanAmount)},
            {"label": "Mensualité hors assurance", "value": formatEuros(financing.monthlyPayment)},
            {"label": "Assurance emprunteur par mois", "value": formatEuros(financing.monthlyInsurance)},
            {"label": "Cash-flow mensuel avant impôt", "value": formatEuros(financing.monthlyCashFlow)},
        ],
        "workRows": buildWorkRows(extraction, analysis),
        "unpricedWorks": [WORK_CATEGORY_LABELS[category.value] for category in analysis.unpricedWorkItems],
        "riskFlags": extraction.riskFlags,
        "warnings": analysis.warnings,
        "missingCriticalFields": [FIELD_LABELS[field.value] for field in analysis.missingCriticalFields],
        "assumptionRows": [
            {"label": "Taux de frais de notaire", "value": f"{formatPercent(assumptions.notaryFeeRate)} (saisi)"},
            {"label": "Loyer mensuel après travaux", "value": f"{formatEuros(assumptions.expectedMonthlyRent, 'non saisi')} (saisi par le chasseur)"},
            {"label": "Autres frais (honoraires, divers)", "value": formatEuros(assumptions.otherCosts)},
            {"label": "Rendement affiché", "value": f"loyer annuel / {YIELD_BASE_LABELS[analysis.primaryYieldBase]}"},
            {
                "label": "Grille de prix",
                "value": f"version {analysis.pricingGridVersion}, statut « {analysis.pricingGridStatus} »",
            },
        ]
        + (
            []
            if financing is None
            else [
                {"label": "Vacance locative (cash-flow)", "value": formatPercent(assumptions.vacancyRate)},
                {"label": "Frais de gestion (cash-flow)", "value": formatPercent(assumptions.managementFeeRate)},
            ]
        ),
        "traceRows": [
            {"label": "Référence", "value": f"{meta.studyId}, révision n° {meta.revision}"},
            {"label": "Modèle d'extraction", "value": meta.model or "inconnu"},
            {"label": "Tentatives d'extraction", "value": "inconnu" if meta.attempts is None else str(meta.attempts)},
            {
                "label": "Jetons (entrée / sortie)",
                "value": f"{meta.promptTokens if meta.promptTokens is not None else '?'} / "
                f"{meta.completionTokens if meta.completionTokens is not None else '?'}",
            },
            {"label": "Version du schéma", "value": meta.schemaVersion or "inconnue"},
            {"label": "Version du prompt", "value": meta.promptVersion or "inconnue"},
        ],
        "isRentedOrMixed": extraction.occupancyStatus in (OccupancyStatus.RENTED, OccupancyStatus.MIXED),
    }


def renderReport(request: ReportRequest, analysis: AnalysisResult) -> tuple[str, str]:
    try:
        view = buildView(request, analysis)
        html = ENVIRONMENT.get_template(TEMPLATE_NAME).render(**view)
    except Exception:
        logger.exception("Report rendering failed for study %s", request.meta.studyId)
        raise
    logger.info("Report rendered: study=%s size=%d", request.meta.studyId, len(html))
    return view["title"], html
