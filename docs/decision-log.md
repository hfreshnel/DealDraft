# Journal de décision — du cas d'usage générique à l'étude de rendement

> Projet de candidature · Alternance « AI Builder » · Month'immo
> Objet : résumer l'analyse et montrer **comment les pages du site de Month'immo ont modifié la décision finale**.

---

## 1. Résumé en 5 lignes

1. L'offre demande de **construire** des automatisations et agents IA, d'outiller l'équipe et de **faire adopter** ce qui est livré.
2. Premier choix (v1) : un agent d'**analyse d'annonce immobilière**, construit à partir de l'offre seule, sans connaître leur fonctionnement.
3. Lecture du site : Month'immo achète des biens **en mauvais état**, les **rénove**, les **meuble** et les **loue**. Leur livrable de décision est une **étude de rendement**.
4. Décision finale (v2) : générer cette **étude de rendement** (coût clé en main, travaux chiffrés par une grille, rendement), avec validation humaine.
5. Trois options ont été écartées (gestion locative, cadrage financier du client, projet générique), chacune pour une raison tirée du site.

---

## 2. Chronologie de l'analyse

| Étape | Ce qui a été fait | Limite connue à ce stade |
|---|---|---|
| 1. Offre d'emploi | Mise en correspondance des missions et du profil ; trois cas d'usage comparés (analyse d'opportunité, qualification de leads, reporting de chantier) | Aucune information sur leur processus réel |
| 2. Choix v1 | Cas U1 retenu : annonce → extraction → rendement sur loyer en place | Évaluation du lien avec leur chiffre d'affaires non étayée (annoncée à ~80 % de certitude seulement) |
| 3. Premier contrôle | Lecture de la page « Nos prestations » : 8 étapes décrites | Une seule page lue |
| 4. Lecture approfondie | FAQ, Chasse, Cadrage financier, Travaux, Gestion locative, Nos projets, réalisation du studio | Pages datées d'août 2023 ; Stratégie, Financement, Achat, Ameublement et la seconde réalisation non lues |
| 5. Refonte v2 | Schéma, grille de prix, gabarit de fiche et jeu de test redessinés | Plusieurs hypothèses à faire valider (section 6) |

---

## 3. Ce que les pages ont changé

| # | Constat sur le site | Source | Hypothèse v1 touchée | Effet sur la décision |
|---|---|---|---|---|
| 1 | Les clients reçoivent une **étude de rendement** détaillée pour chaque projet sélectionné | [FAQ](https://monthimmo.fr/faq/) | Je cherchais un livrable à inventer | **La cible devient ce livrable existant** |
| 2 | Les fiches projet suivent un gabarit fixe : prix d'achat, travaux, ameublement, budget, loyer, rendement, apport | [Réalisation du studio](https://monthimmo.fr/realisations/studio-meuble-mezzanine-32m/) | Fiche générique | **La fiche générée reprend ce gabarit** |
| 3 | Le studio publié était « en sale état » et a été rénové en totalité (fenêtres, peinture, parquet, salle de bains) | Même page | Biens loués en place (« vendu loué ») | **Le calcul central devient le coût des travaux**, plus le loyer en place |
| 4 | Le bien n'a jamais été publié en ligne : il vient du réseau d'agents | Même page | Entrée = annonce de portail propre | **Le jeu de test inclut des messages d'agents informels** |
| 5 | Ils visitent personnellement chaque bien | [Le Mixeur](https://le-mixeur.org/2023/11/24/monthimmo/) | Pas de notion de visite | **Nouvelle entrée : notes de visite** |
| 6 | Gestion locative confiée à des agences partenaires | [Gestion locative](https://monthimmo.fr/nos-prestations/gestion-locative/) | Option « compte-rendu de gestion » envisagée | **Option abandonnée** |
| 7 | Cadrage financier réalisé avec des courtiers partenaires, à partir de la situation personnelle du client | [Cadrage financier](https://monthimmo.fr/nos-prestations/cadrage-financier/) | Calcul de capacité d'emprunt envisagé | **Hors périmètre** : processus externalisé et données personnelles |
| 8 | Apport recommandé : environ 10 % du montant investi (achat + travaux) | FAQ | Apport libre | **Paramètre par défaut sourcé** |
| 9 | Ordres de grandeur : 10 000 € de travaux ≈ 1 mois de chantier | FAQ | Aucun | **Durée de chantier estimée sur la fiche** |
| 10 | Leur fiche indique aussi les immeubles de rapport, bureaux et locaux commerciaux | [Trustpilot](https://fr.trustpilot.com/review/monthimmo.fr) | Un seul lot par annonce | **Cas piège « immeuble multi-lots »** |

---

## 4. Décision finale et options écartées

### Décision

Construire un **générateur d'étude de rendement** : message d'agent ou annonce + notes de visite → extraction structurée (LLM) → chiffrage par grille et calcul du rendement (code) → fiche au gabarit Month'immo → validation humaine → brouillon de mail.

Le principe reste **« le LLM extrait, le code calcule »**. Claude liste les postes de travaux repérés ; il ne fixe aucun prix et n'estime aucun loyer.

### Options écartées

| Option | Raison de l'abandon |
|---|---|
| Garder la v1 (analyse d'un bien loué en place) | Ne correspond pas à leur modèle (achat, rénovation, ameublement) |
| Compte-rendu de gestion locative | Étape externalisée (constat 6) |
| Capacité d'emprunt du client | Étape externalisée et sensible (constat 7) |
| Qualification de leads | Cas très répandu et non relié à leurs propres pages |

---

## 5. Recoupement chiffré avec leur cas publié

| Donnée publiée | Valeur |
|---|---|
| Prix d'achat | 24 000 € |
| Travaux | 21 000 € |
| Ameublement | 4 000 € |
| Budget annoncé | 55 000 € |
| Loyer | 570 € par mois |
| Rendement annoncé | 13,5 % |

| Calcul | Résultat |
|---|---|
| 570 × 12 / 55 000 | 12,4 % (**ne retrouve pas** 13,5 %) |
| Base nécessaire pour 13,5 % | ≈ 50 700 € |
| 24 000 + 21 000 + 4 000 + notaire à 7 % (1 680 €) = 50 680 € | **13,50 %** |
| Même calcul avec notaire à 8 % (1 920 €) | 13,43 % |
| Écart entre budget annoncé et somme des trois postes | 6 000 € non détaillés |

**Lecture :** une base « achat + travaux + ameublement + notaire » est **compatible** avec leur chiffre (certitude d'environ 60 %). Ce n'est pas une preuve. La fiche affiche donc **deux rendements** (base hors autres frais, base budget total) et le dénominateur est paramétrable.

**Limite :** le coût de travaux utilisé pour le recoupement (21 000 €) provient du même cas ; le test valide la **formule**, pas une estimation indépendante des travaux.

---

## 6. Hypothèses non vérifiées

| # | Hypothèse | Certitude | Comment la lever |
|---|---|---|---|
| H1 | Leur rendement = loyer annuel / (achat + travaux + ameublement + notaire) | ~60 % | Question en entretien ou lecture d'une autre fiche projet |
| H2 | Les 6 000 € d'écart couvrent honoraires et autres frais | ~50 % | Idem |
| H3 | Les biens arrivent par messages d'agents et visites | ~80 % | Site (2023) ; format réel inconnu |
| H4 | L'étude de rendement est encore faite en grande partie à la main | ~60 % | Les pages datent de 2023 ; ils ont pu l'automatiser depuis |
| H5 | Le loyer estimé est fixé par le chasseur | ~70 % | Non publié |
| H6 | Une grille de prix interne existe | ~60 % | Non publiée ; la démo utilise une grille **illustrative** |

Ces hypothèses seront listées dans le README sous le titre « Hypothèses sur votre fonctionnement, à valider ensemble ».

---

## 7. Erreurs de ma première analyse, corrigées

- J'ai attribué la note maximale au lien du cas U1 avec leur chiffre d'affaires sans avoir lu leur parcours.
- J'ai pris comme exemple un bien « vendu loué », alors que leur modèle repose sur des biens à rénover.
- J'avais exclu l'estimation des travaux du périmètre alors que c'est la variable principale de leur rentabilité.
- J'avais prévu des annonces propres alors que leurs biens viennent d'un réseau d'agents.

---

## 8. Ce que cela change dans le projet

| Élément | v1 | v2 |
|---|---|---|
| Cible | Fiche de rentabilité générique | Étude de rendement au gabarit Month'immo |
| Entrées | Annonce | Annonce ou message d'agent + notes de visite |
| Données centrales | Loyer en place | Postes de travaux, état général, loyer estimé |
| Calcul | Rendement sur loyer en place | Budget clé en main, deux rendements, durée de chantier |
| Grille de prix | Aucune | Fichier YAML, aucun prix inventé, chaque prix sourcé |
| Jeu de test | 20 annonces propres | 8 annonces de portail, 8 messages informels, 4 pièges |
| Validation de cohérence | Aucune | Recoupement avec leur cas publié (tolérance ±0,2 point) |

## 9. Sources

- https://monthimmo.fr/nos-prestations/
- https://monthimmo.fr/faq/
- https://monthimmo.fr/nos-prestations/chasse-immobiliere/
- https://monthimmo.fr/nos-prestations/cadrage-financier/
- https://monthimmo.fr/nos-prestations/travaux-et-renovations/
- https://monthimmo.fr/nos-prestations/gestion-locative/
- https://monthimmo.fr/nos-projets/
- https://monthimmo.fr/realisations/studio-meuble-mezzanine-32m/
- https://le-mixeur.org/2023/11/24/monthimmo/
- https://fr.trustpilot.com/review/monthimmo.fr
