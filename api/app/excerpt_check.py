from app.schemas import EXCERPT_REQUIRED_FIELDS, ListingExtraction, TextSource


def normalizeSpaces(value: str) -> str:
    return " ".join(value.split())


def findExcerptProblems(extraction: ListingExtraction, listingText: str, visitNotes: str) -> list[dict]:
    sources = {
        TextSource.LISTING: normalizeSpaces(listingText),
        TextSource.VISIT_NOTES: normalizeSpaces(visitNotes),
    }
    problems: list[dict] = []

    def addProblem(location: list[str], message: str, errorType: str) -> None:
        problems.append({"location": location, "message": message, "type": errorType})

    def checkVerbatim(location: list[str], excerpt: str, source: TextSource) -> None:
        if normalizeSpaces(excerpt) not in sources[source]:
            addProblem(location, f"Excerpt is not found verbatim in the {source.value} text: {excerpt!r}", "excerptNotVerbatim")

    excerptFields = set()
    for index, item in enumerate(extraction.sourceExcerpts):
        excerptFields.add(item.field)
        checkVerbatim(["extraction", "sourceExcerpts", str(index), "excerpt"], item.excerpt, item.source)
    for index, work in enumerate(extraction.worksItems):
        checkVerbatim(["extraction", "worksItems", str(index), "excerpt"], work.excerpt, work.source)

    for field in EXCERPT_REQUIRED_FIELDS:
        isSet = getattr(extraction, field.value) is not None
        if isSet and field not in excerptFields:
            addProblem(["extraction", field.value], f"Field {field.value} is set but has no source excerpt", "excerptMissing")
        if not isSet and field in excerptFields:
            addProblem(["extraction", field.value], f"Field {field.value} is null but has a source excerpt", "excerptOnNullField")
    return problems
