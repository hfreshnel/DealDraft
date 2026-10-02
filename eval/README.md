# Evaluation dataset

## File conventions

| File | Content | Required |
|---|---|---|
| `dataset/listing-XXX.txt` | Listing or agent message, as received | yes |
| `dataset/listing-XXX.visit.txt` | Visit notes (typed or dictated) | no |
| `ground_truth/listing-XXX.json` | Hand-annotated expected extraction, same contract as the API | yes |
| `manifest.csv` | One line per listing: id, category, source, notes | yes |

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
7. Anonymize: no exact address, name or phone number. Real listings stay in `eval/raw/` (git-ignored) until anonymized.

The tests check the contract, the verbatim excerpts and the presence of required excerpts on every file.
