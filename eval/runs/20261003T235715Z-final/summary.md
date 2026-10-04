# Evaluation run 20261003T235715Z-final

Prompt df0c52c9b4fb · schema db8e2c8248a1 · 3 run(s) per case

| Metric | gpt-4o-2024-08-06 | gpt-4o-mini-2024-07-18 |
|---|---|---|
| Calls failed (transport, not scored) | 0 | 0 |
| Valid JSON, 1st attempt | 98.3 % (59/60) | 56.7 % (34/60) |
| Field accuracy, all fields | 99.2 % (1131/1140) | 93.2 % (1062/1140) |
| Field accuracy, non-null truth | 98.7 % (693/702) | 91.9 % (645/702) |
| Hallucinations on critical fields | 0 | 9 |
| Verbatim excerpts | 100.0 % (815/815) | 99.3 % (853/859) |
| Works precision | 98.0 % (150/153) | 89.6 % (138/154) |
| Works recall | 90.9 % (150/165) | 83.6 % (138/165) |
| Quantities correct | 100.0 % (33/33) | 90.9 % (30/33) |
| Invented quantities | 0 | 7 |
| Traps passed | 100.0 % (12/12) | 100.0 % (12/12) |
| Stable fields across runs | 400/400 | 395/400 |
| Budget changed by extraction | 0/60 | 0/46 |
| Yield changed by extraction | 0/60 | 0/46 |
| Latency p50 / p95 (ms) | 2964 / 4384 | 4992 / 7424 |
| Cost per study (USD) | 0.0081 | 0.0005 |

## gpt-4o-2024-08-06: accuracy by split

| Split | Field accuracy (non-null truth) | Critical hallucinations | Valid 1st attempt |
|---|---|---|---|
| dev | 98.8 % (495/501) | 0 | 97.6 % (41/42) |
| test | 98.5 % (198/201) | 0 | 100.0 % (18/18) |

## gpt-4o-2024-08-06: errors by field

| Field | Correct | Hallucination | Omission | Wrong value |
|---|---|---|---|---|
| city | 54 | 0 | 0 | 6 |
| district | 57 | 0 | 3 | 0 |

## gpt-4o-mini-2024-07-18: accuracy by split

| Split | Field accuracy (non-null truth) | Critical hallucinations | Valid 1st attempt |
|---|---|---|---|
| dev | 91.0 % (456/501) | 6 | 52.4 % (22/42) |
| test | 94.0 % (189/201) | 3 | 66.7 % (12/18) |

## gpt-4o-mini-2024-07-18: errors by field

| Field | Correct | Hallucination | Omission | Wrong value |
|---|---|---|---|---|
| listingTitle | 57 | 3 | 0 | 0 |
| city | 54 | 0 | 0 | 6 |
| district | 48 | 0 | 3 | 9 |
| roomCount | 57 | 3 | 0 | 0 |
| lotCount | 54 | 6 | 0 | 0 |
| agencyFeesIncluded | 33 | 0 | 27 | 0 |
| rentIncludesCharges | 57 | 0 | 3 | 0 |
| leaseEndDate | 57 | 0 | 0 | 3 |
| annualCondoFees | 57 | 0 | 0 | 3 |
| overallCondition | 48 | 9 | 0 | 3 |
