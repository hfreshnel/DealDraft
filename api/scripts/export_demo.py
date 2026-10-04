import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.excerpt_check import findExcerptProblems  # noqa: E402
from app.extraction_prompt import buildExtractionRequest, computePromptVersion  # noqa: E402
from app.finance import analyze  # noqa: E402
from app.pricing import loadWorksPriceGrid  # noqa: E402
from app.report import renderReport  # noqa: E402
from app.schemas import AnalysisAssumptions, AnalysisRequest, ListingExtraction, ReportMeta, ReportRequest  # noqa: E402
from app.tool_schema import computeSchemaVersion  # noqa: E402

logger = logging.getLogger("export_demo")
EVAL_DIR = Path(os.environ.get("EVAL_DIR", Path(__file__).resolve().parents[2] / "eval"))
PRICING_DIR = Path(os.environ.get("PRICING_DIR", Path(__file__).resolve().parents[2] / "pricing"))
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-2024-08-06"
CASE_ID = "listing-004"
MAX_ATTEMPTS = 3
# Hunter-side assumptions of the public reference case (rent and furniture as published, notary rate to source).
ASSUMPTIONS = {"notaryFeeRate": 0.07, "expectedMonthlyRent": 570, "furnitureBudget": 4000, "financing": None}


def extractWithRetries(client: httpx.Client, listingText: str, visitNotes: str) -> tuple[dict, list[dict], dict]:
    attempts: list[dict] = []
    usageTotal = {"prompt_tokens": 0, "completion_tokens": 0}
    body = buildExtractionRequest(listingText, visitNotes, MODEL)
    for attempt in range(1, MAX_ATTEMPTS + 1):
        response = client.post(OPENAI_URL, json=body)
        response.raise_for_status()
        payload = response.json()
        usage = payload.get("usage") or {}
        usageTotal["prompt_tokens"] += usage.get("prompt_tokens", 0)
        usageTotal["completion_tokens"] += usage.get("completion_tokens", 0)
        content = payload["choices"][0]["message"].get("content") or ""
        try:
            extraction = ListingExtraction.model_validate_json(content)
            problems = findExcerptProblems(extraction, listingText, visitNotes)
        except Exception as exc:
            extraction, problems = None, [str(exc)[:500]]
        attempts.append({"attempt": attempt, "problems": problems})
        if not problems and extraction is not None:
            return extraction.model_dump(mode="json"), attempts, usageTotal
        logger.warning("Attempt %d rejected: %s", attempt, problems)
    raise RuntimeError(f"No valid extraction after {MAX_ATTEMPTS} attempts")


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    try:
        listingText = (EVAL_DIR / "dataset" / f"{CASE_ID}.txt").read_text(encoding="utf-8")
        visitPath = EVAL_DIR / "dataset" / f"{CASE_ID}.visit.txt"
        visitNotes = visitPath.read_text(encoding="utf-8") if visitPath.exists() else ""
        headers = {"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"}
        with httpx.Client(headers=headers, timeout=120) as client:
            extraction, attempts, usage = extractWithRetries(client, listingText, visitNotes)

        assumptions = AnalysisAssumptions(**ASSUMPTIONS)
        grid = loadWorksPriceGrid(PRICING_DIR / "works-grid.example.yaml")
        analysis = analyze(AnalysisRequest(extraction=ListingExtraction(**extraction), assumptions=assumptions), grid)
        meta = ReportMeta(
            studyId="demo-001",
            createdAt=datetime.now(timezone.utc),
            revision=1,
            revisionNote=None,
            model=MODEL,
            schemaVersion=computeSchemaVersion(),
            promptVersion=computePromptVersion(),
            attempts=len(attempts),
            promptTokens=usage["prompt_tokens"],
            completionTokens=usage["completion_tokens"],
        )
        title, html = renderReport(
            ReportRequest(extraction=ListingExtraction(**extraction), assumptions=assumptions, meta=meta), analysis
        )
        outDir = EVAL_DIR / "demo"
        outDir.mkdir(exist_ok=True)
        demo = {
            "caseId": CASE_ID,
            "listingText": listingText,
            "visitNotes": visitNotes,
            "assumptions": ASSUMPTIONS,
            "extraction": extraction,
            "attempts": attempts,
            "analysis": json.loads(analysis.model_dump_json()),
            "meta": json.loads(meta.model_dump_json()),
            "reportTitle": title,
        }
        (outDir / "demo.json").write_text(json.dumps(demo, ensure_ascii=False, indent=2), encoding="utf-8")
        (outDir / "report.html").write_text(html, encoding="utf-8")
        logger.info("Exported %s: yield %s, attempts %d", title, analysis.primaryYield, len(attempts))
    except Exception:
        logger.exception("Demo export failed")
        raise


if __name__ == "__main__":
    main()
