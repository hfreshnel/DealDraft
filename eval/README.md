# Evaluation dataset

## File conventions

| File | Content | Required |
|---|---|---|
| `dataset/listing-XXX.txt` | Listing or agent message, as received | yes |
| `dataset/listing-XXX.visit.txt` | Visit notes (typed or dictated) | no |
| `ground_truth/listing-XXX.json` | Hand-annotated expected extraction, same contract as the API | yes |
| `manifest.csv` | One line per listing: id, category, source, notes, annotation | yes |

## Dev and test split (`split` column)

6 test cases drawn at random per category (seed 20261004): 2 portal, 2 agent messages, 1 trap, the cross-check case. Prompt changes are tuned on `dev` only; `test` is run once at the end and is the reported score.

## Running the evaluation

```bash
# OPENAI_API_KEY must be set in .env (only the eval service receives it)
docker compose --profile eval run --rm eval python scripts/run_eval.py --split dev --runs 3 --label baseline
docker compose --profile eval run --rm eval python scripts/run_eval.py --split all --runs 3 --label final
```

Each run writes `runs/<id>/calls.jsonl` (every call, raw output and score), `metrics.json` and `summary.md`.

## Annotation provenance (`annotation` column)

| Value | Meaning |
|---|---|
| `claudeDraft` | Text and first annotation drafted by Claude, not yet reviewed |
| `humanReviewed` | Reviewed and corrected by a human, field by field, against the text |
| `toConfirm` | Origin not recorded |

All 20 cases were drafted by Claude (`listing-001` to `listing-004` on day 1, the others on day 4, option C chosen for time). The 6 test cases were reviewed by a human on 2026-10-04 with no correction; the 14 dev cases are still `claudeDraft`. This must be stated in `eval/report.md`, and the scores must be read accordingly. To review a case: read the text first, write down your own answer for the debatable fields, then compare with the JSON, fix it, and set the column to `humanReviewed`.

## Target composition (20 listings)

| Category | Count | Description |
|---|---|---|
| `portal` | 8 | Portal-style listings, some with missing data |
| `agentMessage` | 8 | Informal messages from agents, with or without visit notes |
| `trap` | 3 | Multi-lot buildings, several rents, ambiguous prices |
| `crossCheck` | 1 | Reconstructed from a public case, used to cross-check the formulas |

## Annotation rules

1. If the information is not written in the text, the value is `null`, even if it can be guessed.
2. Never compute: two rents stay `null` (no sum), a monthly charge is only converted to a yearly amount.
3. `overallCondition` only from an explicit statement about the whole property. A partial list of works gives `null`.
4. Every non-null field except `listingTitle` has an excerpt copied verbatim from the text, with its source (`listing` or `visitNotes`).
5. Every work item has its own verbatim excerpt. Quantity and unit only if written in the text.
6. Annotate **before** looking at any model output.
7. A single approximate value is kept ("autour de 50 000" gives 50000, with a risk flag); a range is not a value ("entre 35 000 et 40 000" gives null).
8. Category conventions: roof framework ("charpente") is `roofing`; shopfront ("devanture") is `facade`; water heater ("ballon d'eau chaude") is `plumbing`; structural floor or wall repairs are `other` with a note.
9. A whole-property statement reported from the owner or seller ("pas de travaux d'après le proprio") still sets `overallCondition`, with a risk flag saying it is unverified. "Intérieur à rafraîchir" counts as a whole-property statement.
10. "HT" on a rent is about VAT, not charges: `rentIncludesCharges` stays null.
11. Anonymize: no exact address, name or phone number. Real listings stay in `eval/raw/` (git-ignored) until anonymized.

The tests check the contract, the verbatim excerpts and the presence of required excerpts on every file.
