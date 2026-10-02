import copy
import hashlib
import json
from typing import Any

from app.schemas import ListingExtraction

TOOL_NAME = "record_listing_extraction"
TOOL_DESCRIPTION = (
    "Record the structured data extracted from a French real estate listing. "
    "Every field is required: set it to null when the listing does not explicitly state the information. "
    "Never infer, estimate or compute a value that is not written in the listing."
)
RESPONSE_FORMAT_NAME = "listing_extraction"
STRICT_UNSUPPORTED_KEYWORDS = frozenset(
    {
        "default",
        "pattern",
        "minLength",
        "maxLength",
        "minimum",
        "maximum",
        "exclusiveMinimum",
        "exclusiveMaximum",
        "multipleOf",
        "minItems",
        "maxItems",
        "uniqueItems",
    }
)


def inlineRefs(node: Any, defs: dict[str, Any], depth: int = 0) -> Any:
    # Pydantic emits $ref/$defs for enums and nested models; inlining them keeps the
    # tool schema self-contained and avoids relying on $ref support on the API side.
    if depth > 20:
        raise ValueError("Schema nesting too deep, possible circular reference")
    if isinstance(node, dict):
        if "$ref" in node:
            refName = node["$ref"].split("/")[-1]
            if refName not in defs:
                raise KeyError(f"Unresolved schema reference: {refName}")
            merged = {**copy.deepcopy(defs[refName]), **{k: v for k, v in node.items() if k != "$ref"}}
            return inlineRefs(merged, defs, depth + 1)
        return {
            key: inlineRefs(value, defs, depth + 1)
            for key, value in node.items()
            if key not in ("$defs", "title")
        }
    if isinstance(node, list):
        return [inlineRefs(item, defs, depth + 1) for item in node]
    return node


def buildInputSchema() -> dict[str, Any]:
    rawSchema = ListingExtraction.model_json_schema()
    defs = rawSchema.get("$defs", {})
    return inlineRefs(rawSchema, defs)


def buildToolDefinition() -> dict[str, Any]:
    return {
        "name": TOOL_NAME,
        "description": TOOL_DESCRIPTION,
        "input_schema": buildInputSchema(),
    }


def stripUnsupportedKeywords(node: Any, parentKey: str = "") -> Any:
    # Strict mode support for value constraints is partial and version dependent, so they are dropped
    # here and enforced afterwards by Pydantic (a violation becomes a 422 and a corrective retry).
    if isinstance(node, dict):
        if parentKey == "properties":
            return {key: stripUnsupportedKeywords(value, key) for key, value in node.items()}
        return {
            key: stripUnsupportedKeywords(value, key)
            for key, value in node.items()
            if key not in STRICT_UNSUPPORTED_KEYWORDS
        }
    if isinstance(node, list):
        return [stripUnsupportedKeywords(item, parentKey) for item in node]
    return node


def buildOpenAiResponseFormat() -> dict[str, Any]:
    return {
        "type": "json_schema",
        "json_schema": {
            "name": RESPONSE_FORMAT_NAME,
            "strict": True,
            "schema": stripUnsupportedKeywords(buildInputSchema()),
        },
    }


def computeSchemaVersion() -> str:
    serialized = json.dumps(buildOpenAiResponseFormat(), sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:12]
