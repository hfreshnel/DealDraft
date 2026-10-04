import logging
import os
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.excerpt_check import findExcerptProblems
from app.extraction_prompt import EXTRACTION_SYSTEM_PROMPT, buildExtractionRequest, computePromptVersion
from app.finance import analyze
from app.pricing import loadWorksPriceGrid
from app.report import renderReport
from app.schemas import (
    AnalysisRequest,
    AnalysisResult,
    ExtractionCheckRequest,
    ExtractionRequestInput,
    HealthResponse,
    ReportRequest,
    ReportResponse,
)
from app.tool_schema import buildOpenAiResponseFormat, buildToolDefinition, computeSchemaVersion

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("deal-analyzer-api")

PRICING_DIR = Path(os.environ.get("PRICING_DIR", Path(__file__).resolve().parents[2] / "pricing"))
PRICING_GRID_FILE = os.environ.get("PRICING_GRID_FILE", "works-grid.example.yaml")

app = FastAPI(title="AI Deal Analyzer API", version="0.1.0")

try:
    SCHEMA_VERSION = computeSchemaVersion()
except Exception:
    logger.exception("Failed to build extraction schema at startup")
    raise

try:
    PRICING_GRID = loadWorksPriceGrid(PRICING_DIR / PRICING_GRID_FILE)
except Exception:
    logger.exception("Failed to load the pricing grid at startup")
    raise


@app.exception_handler(RequestValidationError)
async def handleValidationError(request: Request, exc: RequestValidationError) -> JSONResponse:
    # n8n reads this payload to decide whether to retry the extraction with a corrective prompt.
    logger.warning("Validation failed on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={"error": "validationFailed", "details": jsonSafeErrors(exc.errors())},
    )


@app.exception_handler(Exception)
async def handleUnexpectedError(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "internalError", "message": type(exc).__name__},
    )


def jsonSafeErrors(errors: list[dict]) -> list[dict]:
    safeErrors = []
    for error in errors:
        try:
            safeErrors.append(
                {
                    "location": [str(part) for part in error.get("loc", [])],
                    "message": str(error.get("msg", "")),
                    "type": str(error.get("type", "")),
                }
            )
        except Exception:
            safeErrors.append({"location": [], "message": "unserializableError", "type": "unknown"})
    return safeErrors


@app.get("/health", response_model=HealthResponse)
def getHealth() -> HealthResponse:
    return HealthResponse(status="ok", schemaVersion=SCHEMA_VERSION)


@app.get("/extraction-tool")
def getExtractionTool() -> dict:
    try:
        return {
            "schemaVersion": SCHEMA_VERSION,
            "promptVersion": computePromptVersion(),
            "systemPrompt": EXTRACTION_SYSTEM_PROMPT,
            "responseFormat": buildOpenAiResponseFormat(),
            "tool": buildToolDefinition(),
        }
    except Exception:
        logger.exception("Failed to build extraction schema")
        raise


@app.post("/extraction-request")
def postExtractionRequest(request: ExtractionRequestInput) -> dict:
    # Single builder of the OpenAI request, shared by n8n and the evaluation script.
    try:
        return {
            "requestBody": buildExtractionRequest(request.listingText, request.visitNotes, request.model),
            "schemaVersion": SCHEMA_VERSION,
            "promptVersion": computePromptVersion(),
        }
    except Exception:
        logger.exception("Failed to build the extraction request")
        raise


@app.post("/validate-extraction")
def postValidateExtraction(request: ExtractionCheckRequest) -> JSONResponse:
    # Schema errors are rejected before this point by the 422 handler; here the excerpts are checked against the texts.
    try:
        problems = findExcerptProblems(request.extraction, request.listingText, request.visitNotes)
    except Exception:
        logger.exception("Excerpt check failed")
        raise
    if problems:
        logger.warning("Excerpt check failed: %s", problems)
        return JSONResponse(status_code=422, content={"error": "validationFailed", "details": problems})
    return JSONResponse(content={"status": "valid", "schemaVersion": SCHEMA_VERSION})


@app.post("/analyze", response_model=AnalysisResult, status_code=status.HTTP_200_OK)
def postAnalyze(request: AnalysisRequest) -> AnalysisResult:
    try:
        return analyze(request, PRICING_GRID)
    except Exception:
        logger.exception("Analysis failed")
        raise


@app.post("/report", response_model=ReportResponse, status_code=status.HTTP_200_OK)
def postReport(request: ReportRequest) -> ReportResponse:
    # The analysis is recomputed here so the document can never disagree with the figures it shows.
    try:
        analysis = analyze(AnalysisRequest(extraction=request.extraction, assumptions=request.assumptions), PRICING_GRID)
        title, html = renderReport(request, analysis)
        return ReportResponse(title=title, html=html, analysis=analysis)
    except Exception:
        logger.exception("Report failed")
        raise
