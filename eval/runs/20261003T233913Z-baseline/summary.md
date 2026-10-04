# Evaluation run 20261003T233913Z-baseline

Prompt ed3244f17fd1 · schema db8e2c8248a1 · 3 run(s) per case

| Metric | gpt-4o-2024-08-06 | gpt-4o-mini-2024-07-18 |
|---|---|---|
| Calls failed (transport, not scored) | 0 | 0 |
| Valid JSON, 1st attempt | 100.0 % (42/42) | 45.2 % (19/42) |
| Field accuracy, all fields | 98.4 % (785/798) | 92.6 % (739/798) |
| Field accuracy, non-null truth | 98.2 % (492/501) | 91.2 % (457/501) |
| Hallucinations on critical fields | 3 | 6 |
| Verbatim excerpts | 100.0 % (585/585) | 99.2 % (612/617) |
| Works precision | 94.4 % (102/108) | 87.9 % (80/91) |
| Works recall | 94.4 % (102/108) | 74.1 % (80/108) |
| Quantities correct | 100.0 % (30/30) | 96.7 % (29/30) |
| Invented quantities | 0 | 1 |
| Traps passed | 88.9 % (8/9) | 100.0 % (9/9) |
| Stable fields across runs | 277/280 | 277/280 |
| Budget changed by extraction | 0/42 | 0/33 |
| Yield changed by extraction | 0/42 | 0/33 |
| Latency p50 / p95 (ms) | 3049 / 4567 | 4298 / 5187 |
| Cost per study (USD) | 0.0080 | 0.0005 |

## gpt-4o-2024-08-06: accuracy by split

| Split | Field accuracy (non-null truth) | Critical hallucinations | Valid 1st attempt |
|---|---|---|---|
| dev | 98.2 % (492/501) | 3 | 100.0 % (42/42) |

## gpt-4o-2024-08-06: errors by field

| Field | Correct | Hallucination | Omission | Wrong value |
|---|---|---|---|---|
| listingTitle | 41 | 1 | 0 | 0 |
| city | 39 | 0 | 0 | 3 |
| district | 39 | 0 | 3 | 0 |
| currentMonthlyRent | 41 | 1 | 0 | 0 |
| annualCondoFees | 39 | 0 | 0 | 3 |
| overallCondition | 40 | 2 | 0 | 0 |

## gpt-4o-mini-2024-07-18: accuracy by split

| Split | Field accuracy (non-null truth) | Critical hallucinations | Valid 1st attempt |
|---|---|---|---|
| dev | 91.2 % (457/501) | 6 | 45.2 % (19/42) |

## gpt-4o-mini-2024-07-18: errors by field

| Field | Correct | Hallucination | Omission | Wrong value |
|---|---|---|---|---|
| listingTitle | 39 | 3 | 0 | 0 |
| city | 39 | 0 | 0 | 3 |
| district | 31 | 0 | 5 | 6 |
| roomCount | 39 | 3 | 0 | 0 |
| lotCount | 39 | 3 | 0 | 0 |
| agencyFeesIncluded | 21 | 0 | 21 | 0 |
| rentIncludesCharges | 39 | 0 | 3 | 0 |
| annualCondoFees | 39 | 0 | 0 | 3 |
| overallCondition | 33 | 6 | 0 | 3 |
