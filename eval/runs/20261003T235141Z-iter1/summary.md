# Evaluation run 20261003T235141Z-iter1

Prompt df0c52c9b4fb · schema db8e2c8248a1 · 3 run(s) per case

| Metric | gpt-4o-2024-08-06 | gpt-4o-mini-2024-07-18 |
|---|---|---|
| Calls failed (transport, not scored) | 0 | 0 |
| Valid JSON, 1st attempt | 95.2 % (40/42) | 35.7 % (15/42) |
| Field accuracy, all fields | 99.2 % (792/798) | 92.7 % (740/798) |
| Field accuracy, non-null truth | 98.8 % (495/501) | 91.6 % (459/501) |
| Hallucinations on critical fields | 0 | 6 |
| Verbatim excerpts | 100.0 % (577/577) | 98.9 % (614/621) |
| Works precision | 100.0 % (105/105) | 83.0 % (83/100) |
| Works recall | 97.2 % (105/108) | 76.9 % (83/108) |
| Quantities correct | 100.0 % (30/30) | 90.0 % (27/30) |
| Invented quantities | 0 | 6 |
| Traps passed | 100.0 % (9/9) | 100.0 % (9/9) |
| Stable fields across runs | 280/280 | 272/280 |
| Budget changed by extraction | 0/42 | 0/27 |
| Yield changed by extraction | 0/42 | 0/27 |
| Latency p50 / p95 (ms) | 2858 / 4176 | 4366 / 5622 |
| Cost per study (USD) | 0.0082 | 0.0005 |

## gpt-4o-2024-08-06: accuracy by split

| Split | Field accuracy (non-null truth) | Critical hallucinations | Valid 1st attempt |
|---|---|---|---|
| dev | 98.8 % (495/501) | 0 | 95.2 % (40/42) |

## gpt-4o-2024-08-06: errors by field

| Field | Correct | Hallucination | Omission | Wrong value |
|---|---|---|---|---|
| city | 39 | 0 | 0 | 3 |
| district | 39 | 0 | 3 | 0 |

## gpt-4o-mini-2024-07-18: accuracy by split

| Split | Field accuracy (non-null truth) | Critical hallucinations | Valid 1st attempt |
|---|---|---|---|
| dev | 91.6 % (459/501) | 6 | 35.7 % (15/42) |

## gpt-4o-mini-2024-07-18: errors by field

| Field | Correct | Hallucination | Omission | Wrong value |
|---|---|---|---|---|
| listingTitle | 39 | 3 | 0 | 0 |
| city | 39 | 0 | 0 | 3 |
| district | 34 | 0 | 2 | 6 |
| roomCount | 39 | 3 | 0 | 0 |
| lotCount | 39 | 3 | 0 | 0 |
| agencyFeesIncluded | 22 | 0 | 20 | 0 |
| rentIncludesCharges | 38 | 1 | 3 | 0 |
| leaseEndDate | 39 | 0 | 0 | 3 |
| annualCondoFees | 39 | 0 | 0 | 3 |
| overallCondition | 34 | 6 | 0 | 2 |
