NBSP = " "

PROPERTY_TYPE_LABELS = {
    "studio": "Studio",
    "apartment": "Appartement",
    "house": "Maison",
    "building": "Immeuble",
    "office": "Bureaux",
    "commercial": "Local commercial",
    "other": "Autre",
}
OCCUPANCY_LABELS = {
    "vacant": "Libre",
    "rented": "Loué",
    "ownerOccupied": "Occupé par le propriétaire",
    "mixed": "Mixte (lots libres et loués)",
}
CONDITION_LABELS = {
    "good": "Bon état",
    "refresh": "À rafraîchir",
    "renovation": "Rénovation complète",
    "heavyRenovation": "Rénovation lourde (structure)",
}
WORK_CATEGORY_LABELS = {
    "windows": "Fenêtres",
    "painting": "Peinture",
    "flooring": "Sols",
    "bathroom": "Salle de bains",
    "kitchen": "Cuisine",
    "electricity": "Électricité",
    "plumbing": "Plomberie",
    "heating": "Chauffage",
    "insulation": "Isolation",
    "partitions": "Cloisons",
    "roofing": "Toiture",
    "facade": "Façade",
    "entranceDoor": "Porte d'entrée",
    "other": "Autre",
}
WORK_UNIT_LABELS = {"sqm": "m²", "linearMeter": "ml", "unit": "u.", "lumpSum": "forfait"}
SOURCE_LABELS = {"listing": "Annonce", "visitNotes": "Notes de visite"}
FIELD_LABELS = {
    "listingTitle": "Titre",
    "city": "Ville",
    "district": "Quartier",
    "propertyType": "Type de bien",
    "livingAreaSqm": "Surface habitable",
    "roomCount": "Pièces principales",
    "floorNumber": "Étage",
    "hasElevator": "Ascenseur",
    "lotCount": "Nombre de lots",
    "askingPrice": "Prix demandé",
    "agencyFeesIncluded": "Honoraires d'agence inclus (FAI)",
    "occupancyStatus": "Occupation",
    "currentMonthlyRent": "Loyer en place",
    "rentIncludesCharges": "Loyer charges comprises",
    "leaseEndDate": "Fin du bail en cours",
    "annualCondoFees": "Charges de copropriété",
    "annualPropertyTax": "Taxe foncière",
    "energyClass": "DPE",
    "overallCondition": "État général",
}


def formatNumber(value: float, decimals: int = 0) -> str:
    text = f"{value:,.{decimals}f}".replace(",", NBSP).replace(".", ",")
    if decimals and text.endswith("," + "0" * decimals):
        text = text[: -(decimals + 1)]
    return text
