# Cahier des charges — AI Deal Analyzer, version 2

> Projet de candidature · Alternance « AI Builder » · Month'immo
> Auteur : Freshnel HOUENOU · Durée : 7 jours · **Version 2.0** (remplace la version 1.0)
> Cette version intègre l'analyse du site de Month'immo, détaillée dans `decision-log.md`.

---

## 1. Contexte et objectif

### 1.1 Contexte

Month'immo accompagne des investisseurs de bout en bout à Saint-Étienne : cadrage financier, chasse, financement, achat, **rénovation, ameublement** et mise en location. L'entreprise vise à doubler son chiffre d'affaires sans doubler son équipe grâce à l'IA.

D'après leurs pages publiques, chaque projet sélectionné donne lieu à une **étude de rendement** remise au client, et leurs fiches de réalisation suivent un gabarit fixe (prix d'achat, travaux, ameublement, budget, loyer, rendement, apport).

### 1.2 Objectif

Produire automatiquement un **brouillon d'étude de rendement** à partir d'un message d'agent ou d'une annonce, complété par des notes de visite. Le chasseur relit, corrige et valide ; aucune sortie n'est envoyée sans validation humaine.

### 1.3 Ce que le projet doit démontrer

| Mission de l'offre | Preuve dans le projet |
|---|---|
| Construire automatisations et agents (n8n, API, Claude) | Workflows n8n orchestrant Claude, un service de calcul et Google Workspace |
| Développer des outils internes (Python/JS) | Service FastAPI, grille de prix typée, script d'évaluation, page Next.js |
| Former l'équipe et faire adopter | Validation humaine intégrée, guide d'une page, vidéo côté utilisateur |
| Doubler le CA sans doubler l'équipe | Temps et coût par étude mesurés ; note sur les prochaines automatisations |
| Faire vivre le site | Page vitrine déployée sur Vercel |

---

## 2. Périmètre

### 2.1 Niveau 1 : cœur fonctionnel (obligatoire)

- Entrées : un **texte principal** (message d'agent ou annonce) et des **notes de visite** facultatives.
- Extraction par Claude selon un schéma imposé : bien, occupation, état général, **postes de travaux** (liste fermée) avec extraits sources.
- Chiffrage des travaux, de l'ameublement et du budget total par **code**, à partir d'une grille de prix.
- Calcul de deux rendements bruts et de la durée de chantier estimée.
- Génération de la fiche « Étude de rendement » (Google Docs) et enregistrement dans Google Sheets.

### 2.2 Niveau 2 : qualité de production (obligatoire)

- Validation humaine : statut `À valider` → `Validé` → **brouillon** Gmail, jamais d'envoi automatique.
- Gestion d'erreurs : branche d'erreur n8n, nouvelle tentative avec le message de validation en cas de JSON invalide.
- Observabilité : durée, tokens, coût estimé, version du schéma et statut pour chaque exécution.
- Évaluation chiffrée sur un jeu de 20 cas (section 6).

### 2.3 Niveau 3 : adoption et vision (obligatoire, hors code)

- Page vitrine Vercel avec vidéo et démo rejouée.
- Guide utilisateur d'une page, note « Les 3 prochaines automatisations », workflows exportés en JSON.

### 2.4 Bonus (si le jour 7 le permet)

- Checklist de postes à vérifier proposée à partir de photos de visite (aucun chiffrage).
- Adaptateur Coda en plus de Google Sheets.

### 2.5 Hors périmètre

| Exclusion | Raison |
|---|---|
| Scraping de portails d'annonces | CGU et fragilité technique |
| Estimation du loyer par le modèle | Variable de décision du chasseur ; le modèle ne l'invente pas |
| Prix de travaux inventés | Chaque prix de la grille doit être sourcé |
| Cadrage financier du client (capacité d'emprunt) | Étape réalisée avec des courtiers partenaires ; données personnelles |
| Gestion locative | Confiée à des agences partenaires |
| Calcul fiscal (LMNP, régimes) | Dépend de la situation de l'investisseur |
| Analyse lot par lot d'un immeuble | Signalée comme limite sur la fiche |

---

## 3. Architecture

### 3.1 Vue d'ensemble

```
 Message d'agent / annonce  +  notes de visite (facultatives)  +  loyer estimé (saisi)
                         │
   ┌─────────────────────▼───────────────── Machine locale (docker compose) ───────────────┐
   │  n8n ──► Claude API : extraction (tool use, schéma imposé, contenu traité en DONNÉES) │
   │   │                                                                                   │
   │   ├──► FastAPI /analyze : validation, chiffrage par grille, budget, rendements        │
   │   │          └── pricing/works-grid.yaml (prix sourcés, jamais inventés)              │
   │   ├──► Google Docs  : fiche « Étude de rendement »                                    │
   │   ├──► Google Sheets: suivi des études + journal d'exécution                          │
   │   └──► Gmail        : brouillon après validation humaine                              │
   └───────────────────────────────────────────────────────────────────────────────────────┘

 Vercel (statique) : page vitrine + vidéo + démo rejouée (résultats pré-calculés)
```

### 3.2 Principe directeur : le LLM extrait, le code calcule

| Composant | Responsabilité | Ce qu'il ne fait jamais |
|---|---|---|
| Claude | Lire un texte non structuré, lister les postes de travaux, citer ses sources | Fixer un prix, estimer un loyer, additionner des montants |
| FastAPI | Valider, chiffrer avec la grille, calculer budget et rendements | Deviner une donnée absente |
| n8n | Orchestrer, gérer les erreurs, brancher Google Workspace | Calculer |
| Chasseur | Saisir le loyer estimé, relire, valider | — |

### 3.3 Choix techniques

| Décision | Choix | Alternative écartée | Justification |
|---|---|---|---|
| Extraction | Claude en tool use, schéma généré depuis Pydantic | Prompt « réponds en JSON » | Sortie contrainte ; une seule source de vérité |
| Appel depuis n8n | Nœud HTTP Request | Nœud Anthropic natif | Contrôle de `tools`, `tool_choice` et du champ `usage` |
| Modèles | `claude-haiku-4-5-20251001` par défaut, `claude-sonnet-5-5` en repli | Un seul modèle | Coût et latence ; repli si la validation échoue. Identifiants à vérifier dans la [documentation](https://docs.claude.com/en/api/overview) |
| Calculs | Service FastAPI | Nœud Code n8n | Tests unitaires, réutilisé par l'évaluation |
| Grille de prix | Fichier YAML typé et validé au chargement | Prix codés en dur | Éditable par un non-développeur ; règle « pas de prix sans source » |
| Base de suivi | Google Sheets | Coda | Limites de l'API Coda gratuite non vérifiées ([tarifs](https://coda.io/pricing)) |
| Hébergement n8n | Docker en local | n8n Cloud | Gratuit, sans limite d'essai |
| Page web | Next.js statique sur Vercel | Page connectée au poste local | Pas d'exposition de la machine locale |

### 3.4 Workflows n8n

| Workflow | Déclencheur | Étapes |
|---|---|---|
| `wf-ingest-listing` | Gmail Trigger (libellé dédié) ou formulaire n8n (`listingText`, `visitNotes`, `expectedMonthlyRent`) | Claude → `/analyze` → fiche Google Docs → ligne Sheets `À valider` → journal |
| `wf-approve-and-draft` | Changement de statut `Validé` dans Sheets | Lecture de la ligne → brouillon Gmail avec lien vers la fiche → statut `Brouillon prêt` → journal |
| `wf-error-handler` | Error Trigger | Journalisation et signalement dans Sheets |

---

## 4. Modèle de données et formules

### 4.1 Schéma d'extraction (sortie de Claude)

Règle absolue : **un champ absent du texte vaut `null`**. Aucune valeur n'est devinée ni calculée. Tous les champs sont obligatoires mais peuvent être nuls ; un oubli devient donc visible.

| Champ | Type | Remarque |
|---|---|---|
| `listingTitle`, `city`, `district` | texte \| null | Pas d'adresse exacte |
| `propertyType` | studio, apartment, house, building, office, commercial, other | `building` = immeuble vendu en bloc |
| `livingAreaSqm`, `roomCount`, `floorNumber`, `hasElevator`, `lotCount` | nombre / booléen \| null | `lotCount` : lots inclus dans la vente |
| `askingPrice` | nombre \| null | « 28k » devient 28000 ; prix global pour un immeuble |
| `agencyFeesIncluded` | booléen \| null | « net vendeur » est ambigu : `null` |
| `occupancyStatus` | vacant, rented, ownerOccupied, mixed \| null | `mixed` : lots libres et loués |
| `currentMonthlyRent`, `rentIncludesCharges`, `leaseEndDate` | \| null | Plusieurs loyers : `null`, jamais additionnés |
| `annualCondoFees`, `annualPropertyTax` | nombre \| null | Mensuel converti en annuel |
| `energyClass` | A à G \| null | |
| `overallCondition` | good, refresh, renovation, heavyRenovation \| null | Uniquement sur déclaration explicite portant sur tout le bien |
| `worksItems[]` | liste | Catégorie (liste fermée de 14), quantité et unité si écrites, extrait textuel, source |
| `riskFlags[]` | liste de textes | Points à vérifier |
| `sourceExcerpts[]` | liste | Un extrait textuel par champ non nul, hors titre |

### 4.2 Hypothèses de l'étude

| Paramètre | Valeur | Origine |
|---|---|---|
| `notaryFeeRate` | À fixer (ordre de grandeur courant dans l'ancien : 7 à 8 %) | À sourcer (notaires.fr) |
| `expectedMonthlyRent` | Saisi par le chasseur | Décision humaine |
| `furnitureBudget` | Saisi, sinon valeur de la grille par typologie | Grille |
| `otherCosts` | 0 par défaut | Honoraires et divers, non publiés |
| `vacancyRate` | 1/12 | Hypothèse prudente |
| `primaryYieldBase` | `acquisitionAndWorks` | Hypothèse H1, à valider |
| `financing.downPaymentRate` | 10 % | FAQ Month'immo (achat + travaux) |
| `financing.loanRate`, `insuranceRate` | À fixer au moment du projet | À sourcer (courtier) |

### 4.3 Formules (implémentées dans `finance.py`, jour 3)

```
notaryFees      = askingPrice × notaryFeeRate
worksCost       = Σ quantité × prix de la grille            (mode itemized, si TOUS les postes sont chiffrables)
                = surface × prix au m² selon l'état général  (mode perSqmFallback, sinon)
                = null                                       (mode none, avec liste des postes non chiffrés)
furnitureCost   = furnitureBudget saisi, sinon grille[propertyType]
acquisitionAndWorksBase = askingPrice + notaryFees + worksCost + furnitureCost
totalBudget     = acquisitionAndWorksBase + otherCosts
annualRent      = expectedMonthlyRent × 12
grossYieldOnAcquisitionAndWorks = annualRent / acquisitionAndWorksBase
grossYieldOnTotalBudget         = annualRent / totalBudget
estimatedWorksDurationMonths    = worksCost / 10 000 × durée de la grille
```

Financement, si renseigné :

```
downPayment    = downPaymentRate × (askingPrice + worksCost)
loanAmount     = totalBudget − downPayment
monthlyPayment = loanAmount × r / (1 − (1 + r)^(−n)),  r = loanRate / 12,  n = loanDurationMonths
monthlyCashFlow = expectedMonthlyRent × (1 − vacancyRate) × (1 − managementFeeRate)
                  − monthlyPayment − monthlyInsurance
                  − (annualCondoFees + annualPropertyTax + annualLandlordInsurance) / 12
```

Les charges de copropriété sont comptées en totalité (hypothèse prudente, signalée sur la fiche).

### 4.4 Règles de validation

| Règle | Action |
|---|---|
| Prix, surface ou typologie absents | Statut `incomplete`, section « Données manquantes » |
| Poste de travaux sans prix dans la grille | Poste listé comme non chiffré ; repli au m² si possible, sinon pas de total |
| Prix au m² hors de 300 à 15 000 € | Drapeau, sans rejet |
| Rendement brut supérieur à 20 % | Drapeau « vérifier les données » |
| `occupancyStatus = mixed` ou `building` | Pas de loyer automatique ; limite « analyse par lot non supportée » |
| Extrait source absent du texte | Champ rejeté (vérification par le code) |

### 4.5 Test de recoupement avec leur cas publié

| Entrée | Valeur |
|---|---|
| Studio, 32 m², état « renovation » | travaux = 656,25 × 32 = 21 000 € (repli au m²) |
| Prix d'achat / ameublement / notaire à 7 % | 24 000 € / 4 000 € / 1 680 € |
| Loyer estimé | 570 € par mois |
| **Base acquisition + travaux + ameublement** | **50 680 €** |
| **Rendement attendu** | **13,50 %** (13,43 % avec un notaire à 8 %) ; critère : écart ≤ 0,2 point avec les 13,5 % publiés |

Limite : le prix au m² de repli est calibré sur ce même cas ; le test valide la **formule**, pas une estimation indépendante.

---

## 5. Grille de prix et fiche

### 5.1 Grille (`pricing/works-grid.example.yaml`)

- Chaque prix non nul a une **source** ; sinon le chargement échoue.
- Toutes les catégories, états et typologies sont présents ; un prix `null` signifie « inconnu ».
- Statut `illustrative` : seules deux valeurs publiques sont renseignées (656,25 €/m² en repli pour « renovation », 4 000 € d'ameublement pour un studio) ainsi que l'ordre de grandeur de durée (1 mois par 10 000 €).
- La fiche affiche le statut de la grille. Une grille `illustrative` n'est jamais présentée comme un barème.

### 5.2 Fiche « Étude de rendement » (`docs/report-template.md`)

Rubriques : en-tête, budget clé en main, rendement (deux définitions), financement, travaux repérés avec extraits, points de vigilance, données manquantes, hypothèses, traçabilité.

---

## 6. Stratégie d'évaluation

### 6.1 Jeu de test (20 cas)

| Catégorie | Nombre | Contenu |
|---|---|---|
| `portal` | 8 | Annonces de portail, certaines incomplètes |
| `agentMessage` | 8 | Messages informels d'agents, avec ou sans notes de visite |
| `trap` | 3 | Immeuble multi-lots, plusieurs loyers, prix ambigu |
| `crossCheck` | 1 | Cas reconstitué à partir de leur page publique |

Quatre cas sont déjà fournis (`eval/dataset`). Les 16 autres sont à rédiger et à annoter en suivant `eval/README.md`. Les annonces sont fictives ou anonymisées.

### 6.2 Métriques

| Métrique | Définition | Cible |
|---|---|---|
| Précision par champ | Valeur extraite = vérité (±1 % sur les nombres, accents ignorés) | ≥ 90 % |
| **Taux d'hallucination** | Valeur non nulle alors que la vérité est `null` | **0 % sur prix, surface, typologie, occupation, loyer, état général** |
| Extraits textuels | Part des extraits retrouvés mot pour mot dans le texte source | **100 %** (vérification automatique) |
| Postes de travaux | Précision et rappel sur les catégories ; quantité exacte quand elle est écrite | Mesurés ; **0 % de quantité inventée** |
| Cas pièges | Loyers non additionnés, statut `mixed`, « net vendeur » nul | 3 sur 3 |
| JSON valide au 1er essai | Sortie conforme sans nouvelle tentative | ≥ 95 % |
| Recoupement | Section 4.5 | Écart ≤ 0,2 point |
| Latence et coût | p50 / p95 ; coût par étude | Mesurés, comparés au temps humain (hypothèse explicite) |

Comparaison Haiku et Sonnet dans `eval/report.md`.

---

## 7. Livrables

### 7.1 Dépôt GitHub

```
ai-deal-analyzer/
├── README.md              # vidéo, captures, résultats d'évaluation, hypothèses à valider
├── docker-compose.yml
├── api/                   # FastAPI : schemas, tool_schema, pricing, finance (jour 3), tests
├── pricing/               # works-grid.example.yaml
├── schemas/               # schéma d'extraction généré
├── n8n/workflows/         # workflows exportés
├── eval/                  # dataset, ground_truth, manifest, run_eval.py, report.md
├── web/                   # page Next.js
└── docs/                  # cahier des charges, journal de décision, gabarit de fiche, guide, note stratégique
```

### 7.2 Page vitrine (Vercel)

| Section | Contenu |
|---|---|
| Accroche | « Du message d'agent à l'étude de rendement » + vidéo |
| Le problème | Temps d'une étude manuelle (hypothèse affichée) contre temps mesuré |
| Comment ça marche | Schéma, principe « le LLM extrait, le code calcule » |
| Démo rejouée | 4 cas : message informel, annonce de portail, immeuble multi-lots, studio reconstitué |
| Fiabilité | Métriques réelles de `eval/report.md` |
| Recoupement | Résultat du test de la section 4.5 |
| Hypothèses | Liste de la section 9, « à valider ensemble » |
| Contact | CV, GitHub, LinkedIn. Mention : projet de candidature, sans lien avec Month'immo |

Page statique, aucune clé côté client, responsive.

### 7.3 Vidéo (2 à 3 minutes)

1. Le problème en une phrase.
2. Un message d'agent et des notes de visite arrivent par email.
3. La fiche apparaît : budget, postes de travaux avec extraits, rendement.
4. Le chasseur corrige le loyer, valide ; le brouillon de mail est créé.
5. Coulisses : workflow, grille, métriques, coût par étude.
6. « Voici ce que je ferais ensuite chez vous. »

### 7.4 Documents d'adoption

- `user-guide.md` : une page, sans jargon, avec « que faire si… ».
- `next-automations.md` : trois automatisations tirées de leurs étapes (suivi de chantier et comparaison de devis, mise en correspondance biens et profils investisseurs, brouillons de suivi client), chacune avec problème, solution et logique de gain.

---

## 8. Planning et critères de « terminé »

| Jour | Tâches | Critère de « terminé » |
|---|---|---|
| **J1** (en cours) | Infrastructure Docker, **schéma v2, grille, gabarit de fiche, 4 cas annotés** (fait) ; clés API et OAuth Google, annotation des cas suivants (à faire) | `docker compose up` fonctionne, 57 tests verts, ≥ 10 cas annotés |
| **J2** | Prompt, premier appel réel à Claude, `wf-ingest-listing` jusqu'à l'extraction validée | 5 cas passent du texte au JSON validé |
| **J3** | `finance.py`, chargement de la grille, `/analyze`, modèle Google Docs | Tests des formules verts ; recoupement 4.5 réussi ; fiche générée |
| **J4** | `wf-approve-and-draft`, `wf-error-handler`, nouvelle tentative, journal | Validation → brouillon Gmail ; erreur provoquée journalisée |
| **J5** | `run_eval.py`, itérations de prompt, comparaison de modèles, `report.md` | Cibles de 6.2 atteintes ou écarts expliqués |
| **J6** | Page Next.js, export de la démo rejouée, déploiement, vidéo | Page en ligne, vidéo intégrée |
| **J7** | README, guide, note stratégique, relecture, envoi | Candidature envoyée |

**Règle de priorité** si le planning dérape : le bonus saute en premier, puis la comparaison de modèles. La validation humaine, l'évaluation et la vidéo ne sont jamais coupées.

---

## 9. Hypothèses à valider avec Month'immo

À publier dans le README sous « Hypothèses sur votre fonctionnement, à valider ensemble ».

| # | Hypothèse | Certitude |
|---|---|---|
| H1 | Leur rendement = loyer annuel / (achat + travaux + ameublement + notaire) | ~60 % |
| H2 | L'écart entre budget annoncé et somme des postes correspond à des honoraires et frais | ~50 % |
| H3 | Les biens arrivent par messages d'agents et visites | ~80 % |
| H4 | L'étude de rendement est encore largement manuelle (pages de 2023) | ~60 % |
| H5 | Le loyer estimé est fixé par le chasseur | ~70 % |
| H6 | Ils disposent d'une grille de prix interne | ~60 % |

---

## 10. Risques

| Risque | Probabilité | Impact | Parade |
|---|---|---|---|
| Hypothèse H1 ou H3 fausse | Moyenne | Moyen | Paramètres explicites, deux rendements, section d'hypothèses |
| L'outil existe déjà chez eux | Moyenne | Moyen | Formuler comme proposition d'amélioration ; ouvrir sur les prochaines automatisations |
| Hallucination sur un champ critique | Moyenne | Élevé | `null` imposé, extraits vérifiés par le code, validation humaine, mesure en évaluation |
| Injection d'instructions dans un message transféré | Faible | Moyen | Messages traités comme données délimitées ; sortie contrainte par le schéma ; aucune action autonome |
| Grille de prix perçue comme un barème | Moyenne | Moyen | Statut `illustrative` affiché sur chaque fiche ; sources obligatoires |
| Données de clients réels dans la démo | Faible | Élevé | Cas fictifs ; seul cas réel utilisé : leur page publique, cité comme tel |
| Fuite de secrets dans le dépôt | Faible | Élevé | `.env` ignoré, `.env.example`, vérification avant chaque push |
| Planning dépassé | Moyenne | Élevé | Règle de priorité de la section 8 |
