# Rapport d'évaluation de l'extraction

> Projet de candidature, sans lien avec Month'immo. Annonces fictives. Mesures du 3 et 4 octobre 2026, calculées par `api/scripts/run_eval.py` (données brutes dans `eval/runs/`).

## 1. Résumé

1. **Verdict : `gpt-4o` atteint les 7 cibles mesurables du cahier des charges** (tableau du chapitre 3), sur 20 annonces fictives annotées. `gpt-4o-mini` ne les atteint pas.
2. **Modèle retenu : `gpt-4o-2024-08-06`.** `gpt-4o-mini` coûte 16 fois moins (0,0005 $ contre 0,0081 $ par étude) mais invente des valeurs sur des champs critiques (9 fois sur 60 extractions) : ce n'est pas un défaut de forme que la nouvelle tentative corrige.
3. **L'évaluation a servi** : le premier essai donnait 3 hallucinations sur champs critiques. Six corrections générales du prompt les ont ramenées à 0, confirmé sur 6 cas de test non utilisés pour ajuster le prompt.
4. **Ce que ce rapport ne prouve pas :** les annotations ont été rédigées par l'IA qui a aussi écrit les textes et le prompt, et aucune n'a encore été relue par un humain. Les 6 cas de test sont un petit échantillon. Les scores mesurent un accord avec ces annotations, pas une vérité indépendante.
5. **Limite connue non corrigée :** les travaux de structure (plancher effondré, fissure sur mur porteur) sont mal listés (chapitre 6).

## 2. Méthode

| Point | Choix |
|---|---|
| Jeu de test | 20 annonces fictives : 8 de portail, 8 messages d'agents (dont 4 avec notes de visite), 3 pièges (immeuble multi-lots, injection de prompt, loyer annuel), 1 cas de recoupement tiré de la fiche publique |
| Annotations | Rédigées par Claude, **non relues par un humain** (colonne `annotation` du manifeste : `claudeDraft`). Les conventions ont été fixées par l'utilisateur avant le premier appel au modèle. Aucune annotation n'a été modifiée après avoir vu un résultat |
| Découpage | 14 cas de mise au point (`dev`), 6 cas de test (`test`) tirés au sort par catégorie avec la graine 20261004 : 001, 004, 006, 014, 015, 019. Le prompt a été ajusté sur `dev` uniquement ; `test` n'a été exécuté qu'une fois, à la fin |
| Modèles | `gpt-4o-2024-08-06` et `gpt-4o-mini-2024-07-18`, versions datées, `temperature: 0`, mode `json_schema` strict |
| Exécutions | 3 par cas et par modèle. Seul le 1er essai est noté (pas de nouvelle tentative) |
| Requête | Construite par l'API (`POST /extraction-request`), la même que celle de la production : l'évaluation teste ce qui tourne réellement |
| Notation | Nombres à ±1 %, textes sans accents ni casse ; erreurs classées en hallucination (valeur inventée), omission (`null` à tort), mauvaise valeur. Extraits contrôlés par le validateur de production |
| Prompt | Version `ed3244f17fd1` (référence) puis `df0c52c9b4fb` (après les six corrections) |

## 3. Résultats par cible du cahier des charges

`gpt-4o-2024-08-06`, prompt `df0c52c9b4fb`. Nombres bruts : un cas de plus ou de moins déplace un taux de plusieurs points.

| Cible | Résultat sur les 6 cas de test | Résultat sur les 20 cas | Atteinte |
|---|---|---|---|
| Précision par champ ≥ 90 % (champs non nuls) | **98,5 %** (198/201) | 98,7 % (693/702) | Oui |
| Hallucination 0 % sur prix, surface, type, occupation, loyer, état général | **0** | 0 | Oui |
| Extraits mot pour mot : 100 % | 100 % (237/237) | 100 % (815/815) | Oui |
| Postes de travaux : quantité inventée 0 | 0 | 0 | Oui |
| Postes de travaux : précision et rappel (mesurés) | 94 % (45/48) et **79 %** (45/57) | 98 % (150/153) et 91 % (150/165) | Mesuré, rappel faible sur le test |
| Cas pièges | 3/3 | 12/12 (4 contrôles × 3 exécutions) | Oui |
| JSON valide au 1er essai ≥ 95 % | 100 % (18/18) | 98,3 % (59/60) | Oui |
| Recoupement ≤ 0,2 point | | 13,50 % contre 13,5 % publié (test `test_finance`) | Oui |
| Stabilité entre exécutions | | 400/400 champs identiques sur 3 exécutions | Mesurée |
| Latence | p50 3,1 s, p95 3,7 s | p50 3,0 s, p95 4,4 s (appel du modèle seul) | Mesurée |
| Coût par étude | 0,0080 $ | 0,0081 $ | Mesuré (voir limites) |

**Impact sur le calcul :** en passant l'extraction du modèle et la vérité dans le même calcul (notaire 7 %, loyer 500 €), le budget et le rendement ne diffèrent **dans aucun des 60 cas** (`gpt-4o`). Les erreurs restantes ne changent pas le chiffre présenté. Précision : quand la vérité elle-même n'a pas de budget (prix absent), « aucune différence » signifie que les deux sont inconnus.

## 4. Comparaison `gpt-4o` et `gpt-4o-mini`

Sur les 20 cas, 3 exécutions, mêmes données.

| | `gpt-4o` | `gpt-4o-mini` |
|---|---|---|
| JSON valide au 1er essai | 98,3 % (59/60) | **56,7 %** (34/60) |
| Précision, champs non nuls | 98,7 % | 91,9 % |
| Hallucinations sur champs critiques | **0** | **9** |
| Quantités inventées | 0 | 7 |
| Rappel des postes de travaux | 90,9 % | 83,6 % |
| Pièges | 12/12 | 12/12 |
| Latence p50 / p95 | 3,0 s / 4,4 s | 5,0 s / 7,4 s |
| Coût par étude | 0,0081 $ | 0,0005 $ |

Pourquoi `gpt-4o-mini` n'est pas retenu :
- **Des erreurs de forme**, que la nouvelle tentative corrige : extraits vides, extraits sur des champs `null`, `agencyFeesIncluded` omis 27 fois sur 60.
- **Des erreurs de fond**, que le validateur ne voit pas : `overallCondition` inventé 9 fois, `lotCount` inventé 6 fois, 7 quantités inventées. Un résultat faux mais bien formé passe la validation : c'est le risque que l'outil doit éviter (invariants 1 et 2).
- **Le coût n'est pas décisif** : 0,008 $ par étude reste négligeable devant la valeur d'un dossier. Même avec 2 nouvelles tentatives, `gpt-4o-mini` coûterait environ 0,0015 $, mais cela ne corrige pas les erreurs de fond.

## 5. Ce que l'évaluation a trouvé

Run de référence sur les 14 cas de mise au point, puis après les corrections du prompt (même cas, `gpt-4o`, 3 exécutions) :

| | Référence | Après correction |
|---|---|---|
| Hallucinations sur champs critiques | 3 | **0** |
| Pièges | 8/9 | 9/9 |
| Précision des postes de travaux | 94,4 % | 100 % |
| Champs stables entre exécutions | 277/280 | 280/280 |
| JSON valide au 1er essai | 100 % (42/42) | 95,2 % (40/42), 97,6 % (41/42) au run final |

| Erreur trouvée | Correction (règle générale, sans citer d'annonce) |
|---|---|
| `annualCondoFees` 4 800 au lieu de 400 : « 400/an » multiplié par 12 (3 exécutions sur 3) | Un montant déjà annuel ne se multiplie pas |
| Loyer de 500 € calculé à partir d'un loyer annuel de 6 000 € | Un loyer annuel reste `null`, jamais divisé |
| État général « à rafraîchir » déduit d'une liste de travaux | Une liste de travaux seule ne dit rien sur l'état du bien |
| Titre inventé à partir de la 1re phrase d'un message informel | Un message informel n'a pas de titre |
| « Toiture refaite il y a 10 ans » comptée comme un travail à faire | Seuls les travaux restant à faire sont listés |
| Ballon d'eau chaude classé `other` | Convention : `plumbing` |

Deux observations :
- **L'instabilité du J2** (400 puis 4 800) était en réalité une erreur constante : le modèle se trompait chaque fois. Le prompt corrigé la supprime.
- **Le découpage protège le score de test**, il ne protège pas contre tout : l'auteur du prompt connaissait les cas de mise au point. Seul le test, rejoué une fois, donne une mesure sur des cas non vus.

## 6. Erreurs restantes et limites

| Point | Détail |
|---|---|
| « St Etienne » contre « Saint-Étienne » | 6 erreurs sur 702 champs (cas 014 et 018). Le modèle recopie le texte, l'annotation normalise. Annotation conservée volontairement : la modifier après avoir vu les résultats aurait introduit un biais |
| « centre-ville » non extrait comme quartier (cas 020) | 3 omissions. Annotation discutable |
| Lots à rénover non listés (cas 003) | Le modèle ne liste que la toiture |
| **Travaux de structure** | Sur les cas de test, rappel de 79 % : dans le cas 006, le plancher effondré est classé `flooring` et la charpente et la toiture sont fusionnées ; dans le cas 015, la fissure sur mur porteur et le plancher affaissé ne sont pas listés. Non corrigé car les cas de test ont été vus : une correction ici fausserait le score. Piste : règle de prompt sur les travaux de structure, à évaluer sur de nouveaux cas |
| Échantillon | 6 cas de test, 201 champs non nuls. Les 3 exécutions d'un même cas sont corrélées (`temperature: 0`) : l'échantillon effectif est de 6 cas |
| Annotations | Faites par l'IA, non relues par un humain. Le score mesure un accord avec elles |
| Points de vigilance | Texte libre, non noté automatiquement. Non évalués dans ce rapport |
| Tarif | Calculé d'après les prix des alias publiés le 4 octobre ([page de tarifs](https://developers.openai.com/api/docs/pricing)), non vérifié sur la facture. La page affiche aussi des prix plus élevés pour les versions datées, probablement ceux du fine-tuning (certitude d'environ 80 %). Coût total des mesures : environ 1,5 $ estimé |
| Temps humain | **Non mesuré.** Aucune valeur n'est avancée. Seule observation : une ingestion complète (extraction, fiche Google Doc, ligne de suivi) a pris environ 12 secondes lors d'un essai. La comparaison avec le temps d'un chasseur reste à faire avec lui |

## 7. Reproduire

```bash
# OPENAI_API_KEY dans .env (seul le service eval la reçoit)
docker compose --profile eval run --rm eval python scripts/run_eval.py --split dev --runs 3 --label iteration
docker compose --profile eval run --rm eval python scripts/run_eval.py --split all --runs 3 --label final
```

Chaque run écrit `calls.jsonl` (toutes les sorties et leur notation), `metrics.json` et `summary.md` dans `eval/runs/<identifiant>/`. Les runs de ce rapport : `20261003T233913Z-baseline`, `20261003T235141Z-iter1`, `20261003T235715Z-final` (identifiants en UTC).
