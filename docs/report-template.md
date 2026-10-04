# Étude de rendement — gabarit de la fiche

> Ce gabarit reprend les rubriques usuelles d'une fiche projet d'investissement locatif clé en main (type, budget, prix d'achat, coût des travaux, coût de l'ameublement, loyer, rendement, apport).
> Les champs `{{…}}` correspondent à la réponse de l'endpoint `/analyze` (`AnalysisResult`) et à l'extraction (`ListingExtraction`).
> Le gabarit effectivement utilisé est `api/app/templates/report.html.j2`, rendu par `POST /report` puis converti en Google Doc. Il reprend ces rubriques avec trois écarts : une synthèse en tête, un tableau « Le bien » avec l'extrait source de chaque valeur, et le nombre de jetons à la place du coût en euros.

---

## En-tête

| | |
|---|---|
| Statut | {{status}} · **Brouillon à valider par le chasseur** |
| Bien | {{propertyType}} · {{livingAreaSqm}} m² · {{district}}, {{city}} |
| Occupation | {{occupancyStatus}} |
| État général | {{overallCondition}} |
| Grille de prix | {{pricingGridStatus}} (`illustrative` = valeurs d'exemple, non contractuelles) |

---

## 1. Budget clé en main

| Poste | Montant |
|---|---|
| Prix d'achat | {{purchasePrice}} € |
| Frais de notaire ({{notaryFeeRate}}) | {{notaryFees}} € |
| Coût des travaux ({{worksPricingMode}}) | {{worksCost}} € |
| Coût de l'ameublement | {{furnitureCost}} € |
| **Sous-total acquisition + travaux + ameublement** | **{{acquisitionAndWorksBase}} €** |
| Autres frais (honoraires, divers) | {{otherCosts}} € |
| **Budget total** | **{{totalBudget}} €** |

Durée de chantier estimée : {{estimatedWorksDurationMonths}} mois (ordre de grandeur).

---

## 2. Rendement

| | Valeur |
|---|---|
| Loyer mensuel estimé (saisi par le chasseur) | {{expectedMonthlyRent}} € |
| Loyer annuel | {{annualRent}} € |
| Rendement brut sur acquisition + travaux + ameublement | {{grossYieldOnAcquisitionAndWorks}} |
| Rendement brut sur budget total | {{grossYieldOnTotalBudget}} |
| **Rendement affiché** | **{{primaryYield}}** (base : {{primaryYieldBase}}) |

> Les deux définitions sont affichées car la base de calcul d'un rendement peut varier. La définition retenue est à confirmer.

---

## 3. Financement (si renseigné)

| | |
|---|---|
| Apport ({{downPaymentRate}} du montant acquisition + travaux) | {{financing.downPayment}} € |
| Montant emprunté | {{financing.loanAmount}} € |
| Mensualité (hors assurance) | {{financing.monthlyPayment}} € |
| Assurance emprunteur mensuelle | {{financing.monthlyInsurance}} € |
| Cash-flow mensuel avant impôt | {{financing.monthlyCashFlow}} € |

---

## 4. Travaux repérés

| Poste | Quantité | Chiffré ? | Extrait source | Source |
|---|---|---|---|---|
| {{worksItems[].category}} | {{quantity}} {{unit}} | {{priced}} | « {{excerpt}} » | {{source}} |

Postes non chiffrés (prix absent de la grille) : {{unpricedWorkItems}}

---

## 5. Points de vigilance

{{riskFlags}}

{{warnings}}

---

## 6. Données manquantes

{{missingCriticalFields}}

---

## 7. Hypothèses utilisées

| Hypothèse | Valeur |
|---|---|
| Taux de frais de notaire | {{notaryFeeRate}} |
| Vacance locative | {{vacancyRate}} |
| Frais de gestion | {{managementFeeRate}} |
| Charges de copropriété | comptées en totalité (hypothèse prudente) |
| Définition du rendement affiché | {{primaryYieldBase}} |

---

## 8. Traçabilité

Chaque valeur extraite est reliée à un passage du message ou des notes de visite (section 4 et annexe). Version du schéma d'extraction : {{schemaVersion}}. Modèle : {{modelId}}. Coût de l'analyse : {{analysisCostEur}} €.
