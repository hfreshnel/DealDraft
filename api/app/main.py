import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.schemas import AnalysisRequest, AnalysisResult, HealthResponse
from app.tool_schema import buildToolDefinition, computeSchemaVersion

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("deal-analyzer-api")

app = FastAPI(title="AI Deal Analyzer API", version="0.1.0")

try:
    SCHEMA_VERSION = computeSchemaVersion()
except Exception:
    logger.exception("Failed to build extraction schema at startup")
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
        return {"schemaVersion": SCHEMA_VERSION, "tool": buildToolDefinition()}
    except Exception:
        logger.exception("Failed to build tool definition")
        raise


@app.post("/analyze", response_model=AnalysisResult, status_code=status.HTTP_200_OK)
def postAnalyze(request: AnalysisRequest) -> JSONResponse:
    # Validation already runs on the request body; financial computation lands on day 3.
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"error": "notImplemented", "message": "Financial analysis is implemented on day 3"},
    )
