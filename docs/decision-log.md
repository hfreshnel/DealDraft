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

### Fournisseur LLM : OpenAI `gpt-4o` au lieu de Claude (2 octobre 2026)

| Point | Détail |
|---|---|
| Raison | Contrainte de budget : crédits OpenAI disponibles, pas de crédits API Anthropic |
| Mécanisme | `response_format` de type `json_schema` en mode `strict` sur `/v1/chat/completions`, appelé par un nœud HTTP Request de n8n |
| Schéma | Généré depuis Pydantic (`buildOpenAiResponseFormat`). Les mots-clés de contrainte (`pattern`, `minLength`, `minimum`...) sont retirés du schéma envoyé et vérifiés ensuite par Pydantic (422, nouvelle tentative) |
| Conservé | Le format outil Claude reste généré (`buildToolDefinition`) pour un retour éventuel à Claude |
| Inchangé | Les invariants : le LLM extrait, le code calcule, `null` si absent |
| Non vérifié | Acceptation du schéma par le mode strict (`anyOf` avec `null`, objets imbriqués) : à tester au premier appel réel. Support de `gpt-4o` en mode strict à confirmer dans la documentation OpenAI |
| Comparaison J5 | `gpt-4o-mini` contre `gpt-4o` remplace Haiku contre Sonnet |

### Jour 4 : fiche, validation humaine et brouillon (3 octobre 2026)

**Fiche « Étude de rendement »**

| Choix | Alternative écartée | Justification |
|---|---|---|
| La fiche est produite en HTML par l'API (`POST /report`, gabarit `api/app/templates/report.html.j2`), puis Google Drive la convertit en Google Doc | Modèle Google Docs copié, puis balises remplacées par n8n | Le gabarit est versionné dans git et testable sans Google. Les tableaux de longueur variable (travaux, extraits) sont impossibles avec un simple remplacement de balises. Aucun modèle à créer à la main dans le Drive. Limite : l'import Google ne garde qu'une partie du style (couleurs, gras, tableaux) |
| `/report` recalcule l'analyse au lieu de recevoir celle de `/analyze` | Passer le résultat de `/analyze` au rendu | La fiche ne peut pas afficher des chiffres différents de ceux calculés : une seule source |
| Synthèse en tête (budget, loyer, rendement, nombre de points de vigilance) | Ordre du gabarit publié (prix, travaux, ameublement...) | Le chasseur décide en quelques secondes s'il lit la suite. Le détail suit l'ordre du gabarit publié |
| Chaque donnée du bien est affichée avec son extrait mot pour mot et sa source (annonce ou notes) | Extraits en annexe | La relecture se fait ligne par ligne, sans revenir au texte d'origine. C'est la preuve visible que le LLM n'a rien inventé (invariants 1 et 2) |
| Valeur absente affichée « non trouvé », en rouge | Ligne masquée | Un trou doit se voir. Seuls les champs propres aux biens loués ou aux immeubles (lots, loyer en place, bail) sont masqués s'ils sont vides |
| Bandeau « brouillon à valider » et statut de la grille en haut de page | Mention en pied de page | Invariants 4 et 5 : impossible de prendre la fiche pour un document final |
| Coût de l'analyse remplacé par le nombre de jetons | Coût en euros (prévu au gabarit) | Le prix des jetons OpenAI n'est pas sourcé ici. Le coût sera calculé au J5 avec le tarif publié |
| Financement affiché « non calculé » | Section masquée | Les taux de crédit et d'assurance ne sont pas sourcés (aucune valeur par défaut) ; le dire est plus honnête que de masquer |

**Suivi, validation et brouillon**

| Choix | Alternative écartée | Justification |
|---|---|---|
| Validation par un formulaire n8n distinct (`wf-approve-and-draft`), ouvert par un lien pré-rempli stocké dans le Suivi | Déclencheur sur changement de statut dans Sheets | Choix de l'utilisateur. Réaction immédiate, sans scrutation périodique, et plus simple à montrer en vidéo |
| Le formulaire refuse une étude introuvable, déjà traitée ou incomplète | Laisser tout passer | Un seul brouillon par étude (pas de doublon en cas de double clic). Une étude sans prix ou sans surface ne doit pas partir chez un client avec des chiffres partiels. Le rejet reste toujours possible |
| Brouillon Gmail uniquement, destinataire fictif `investisseur.demo@example.com` | Envoi direct ; vraie adresse | Invariant 5 : le chasseur envoie lui-même. `example.com` est réservé à la documentation (RFC 2606) : aucun risque d'envoi à un tiers (invariant 8) |
| La fiche n'est pas partagée automatiquement avec le destinataire | Partage automatique par l'API Drive | Le partage d'un document est un geste à conséquence : il reste humain. Le formulaire le rappelle |
| Écriture dans Sheets en mode `RAW` | `USER_ENTERED` (mode par défaut) | Un titre d'annonce commençant par `=` serait exécuté comme une formule (injection par texte transféré, invariant 7). Les formats € et % sont posés une fois sur les colonnes à la création |
| En-têtes de colonnes en camelCase, statuts en français (`À valider`, `Brouillon prêt`, `Rejeté`) | Tout en français | Les en-têtes sont un contrat machine (correspondance automatique des colonnes par n8n). Les statuts sont lus par le chasseur |
| Référence d'étude `ER-AAAAMMJJ-HHmm-xxxx` | Identifiant d'exécution n8n | Lisible, triable par date, indépendante de n8n |
| Correction du loyer et du taux de notaire : troisième choix « Corriger les hypothèses » dans le formulaire de validation. La fiche est recalculée sans nouvel appel au LLM et remplacée au même lien ; le statut reste « À valider » | (A) Relancer une analyse complète ; (B) champ « loyer corrigé » appliqué au moment de valider | (A) relance l'extraction, qui peut changer d'autres valeurs (instabilité constatée au J2). (B) ferait valider des chiffres que personne n'a relus. Avec C, le chasseur corrige, relit, puis valide, ce qui suit le scénario du cahier des charges. Choix validé par l'utilisateur |
| L'extraction validée est conservée dans la colonne `extractionJson` du Suivi | Nouvel appel au LLM ; stockage hors Sheets | Recalcul déterministe et sans coût. Taille de 3 à 5 000 caractères, sous la limite de 50 000 par cellule. Si le schéma change entre-temps, `/report` rejette l'extraction (422) et l'erreur part au Journal |
| La fiche affiche le numéro de révision et un bandeau « Hypothèses corrigées par le chasseur : loyer 520 € → 570 € » | Remplacement silencieux | Le lecteur sait que la fiche a été modifiée, et ce qui a changé |
| Des valeurs corrigées saisies avec « Valider » ou « Rejeter » sont refusées | Les ignorer | Un champ rempli puis ignoré en silence ferait croire au chasseur que sa correction est prise en compte |
| La validation est refusée si le loyer n'est pas saisi | Brouillon avec « rendement à préciser » | Le rendement est l'objet du mail ; le formulaire renvoie vers « Corriger les hypothèses » |
| Champs numériques optionnels des formulaires (loyer, valeurs corrigées) en texte, analysés par le code (vide = `null`, « 1 200,50 » accepté) | Champ numérique n8n | **Constaté en test** : n8n transforme un champ numérique vide en `0`. Un taux de notaire vide devenait 0 % lors d'une révision, et un loyer vide faisait échouer l'analyse (422). Le taux de notaire de l'ingestion reste numérique car obligatoire |

**Robustesse**

| Choix | Alternative écartée | Justification |
|---|---|---|
| Nouvelle tentative : au plus 2 corrections (3 appels), uniquement si le validateur rejette la sortie (422 `validationFailed`) | Réessayer toute erreur | Une erreur de service (API arrêtée, quota) ne se corrige pas en relançant le modèle. Le prompt correctif contient la dernière sortie et les erreurs, balisées comme données ; le contexte ne grossit pas d'une tentative à l'autre |
| Boucle n8n qui lit `$('Nœud').first()` | Faire transiter tout l'état dans chaque nœud | Vérifié par un test : dans une boucle, `$('Nœud')` lit la dernière exécution du nœud |
| Erreurs prévues (OpenAI, validation) gérées dans le flux et journalisées ; erreurs imprévues (API, Google) font échouer l'exécution, puis `wf-error-handler` les écrit dans le Journal | Tout capturer avec « continuer en cas d'erreur » | Aucun échec silencieux : une erreur imprévue apparaît comme exécution en échec dans n8n et comme ligne `workflowError` dans le Journal. Limites : le gestionnaire ne se déclenche pas sur les exécutions manuelles (comportement de n8n), et ne peut rien journaliser si Sheets est indisponible (il reste les journaux de n8n) |
| Identifiants Google (Sheet, dossier) hors git : jetons `__CONFIG_x__` dans les workflows, valeurs dans `n8n/config.local.json` (ignoré), script `n8n/render-workflows.mjs` à l'import | Identifiants en dur dans les workflows commités | Le dépôt reste public sans référence au compte Google ; un seul endroit à modifier |
| Sheet et dossier Drive créés par un workflow (`wf-setup-google`) | Création à la main | Reproductible : colonnes, formats et onglets identiques à chaque installation |

### Jour 5 : évaluation (4 octobre 2026)

| Choix | Alternative écartée | Justification |
|---|---|---|
| La requête envoyée au modèle est construite par l'API (`POST /extraction-request`), appelée par n8n et par `run_eval.py` | Reconstruire la requête en Python dans le script | L'évaluation teste exactement ce qui tourne en production. Vérifié : la requête de l'API est identique, octet pour octet, à celle que construisait n8n |
| Modèles épinglés à une version datée (`gpt-4o-2024-08-06`, `gpt-4o-mini-2024-07-18`), en production comme en évaluation | Alias `gpt-4o` | Un alias peut pointer vers un nouveau modèle et changer les résultats sans prévenir |
| 14 cas de mise au point, 6 cas de test tirés au sort par catégorie (graine 20261004) : 001, 004, 006, 014, 015, 019 | Ajuster et noter sur les 20 cas | Le prompt, les textes et les annotations viennent du même auteur : noter sur les cas qui ont servi à ajuster le prompt donnerait un score flatteur. Le tirage évite de choisir des cas faciles |
| Précision donnée deux fois : sur tous les champs, et sur les seuls champs non nuls de la vérité | Un seul taux | Environ 40 % des champs attendus sont nuls : un modèle qui répond souvent `null` aurait une bonne précision globale sans rien extraire |
| Erreurs classées en hallucination, omission, mauvaise valeur | Un seul taux d'erreur | Une hallucination (valeur inventée) viole l'invariant 2 ; une omission est seulement un manque. Elles n'ont pas le même coût |
| Points de vigilance non notés automatiquement | Comparaison mot à mot, ou modèle juge | Texte libre : la comparaison mot à mot est fausse, un modèle juge ajoute une source d'erreur et un coût. Ils sont relus à la main sur un échantillon |
| Impact métier : l'extraction prédite et la vérité passent dans le même calcul (`analyze`, notaire 7 %, loyer 500 €), puis on compte les budgets et rendements qui changent | Précision par champ seule | Une erreur sur l'étage ne change rien, une erreur sur le prix change la décision |
| Seul le 1er essai est noté | Noter après les nouvelles tentatives | Correspond à la métrique « JSON valide au 1er essai » ; la nouvelle tentative a été testée au J4 |
| Service Docker `eval` séparé, seul à recevoir `OPENAI_API_KEY` | Clé donnée à l'API | L'API qui tourne en permanence n'a pas besoin de la clé |
| Prix : tarif des alias (`gpt-4o` 2,50 $ / 10 $, `gpt-4o-mini` 0,15 $ / 0,60 $ par million de jetons) | Tarif affiché pour les versions datées (3,75 $ / 15 $ pour `gpt-4o-2024-08-06`) | La page de tarifs semble montrer pour les versions datées le prix des modèles fine-tunés. Certitude d'environ 80 %, signalée dans le rapport |

**Résultat de l'évaluation et modèle retenu (4 octobre 2026)**

| Choix | Alternative écartée | Justification |
|---|---|---|
| `gpt-4o-2024-08-06` retenu pour l'extraction | `gpt-4o-mini-2024-07-18` | 9 hallucinations sur champs critiques sur 60 extractions (0 pour `gpt-4o`) et 7 quantités inventées. Ces erreurs ont une forme valide : la nouvelle tentative ne les voit pas. Le coût n'est pas décisif (0,0081 $ contre 0,0005 $ par étude). Détail dans `eval/report.md` |
| Six corrections générales du prompt, appliquées après la mesure de référence | Corriger aussi les travaux de structure après le test | Les cas de test avaient été vus : toute correction suivante ne pourrait plus être mesurée honnêtement. Limite écrite dans le rapport |
| Annotations discutables conservées (« St Etienne », « centre-ville », lots du cas 003) | Les modifier après les résultats | Les modifier après avoir vu les sorties introduirait un biais. Les erreurs sont comptées et expliquées |

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
