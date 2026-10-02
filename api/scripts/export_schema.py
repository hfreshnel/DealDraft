import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.tool_schema import buildToolDefinition, computeSchemaVersion  # noqa: E402

OUTPUT_DIR = Path(os.environ.get("SCHEMA_OUTPUT_DIR", "/schemas"))
OUTPUT_FILE = "listing-extraction.schema.json"


def main() -> int:
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        payload = {"schemaVersion": computeSchemaVersion(), "tool": buildToolDefinition()}
        outputPath = OUTPUT_DIR / OUTPUT_FILE
        outputPath.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Schema {payload['schemaVersion']} written to {outputPath}")
        return 0
    except Exception as exc:
        print(f"Schema export failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
