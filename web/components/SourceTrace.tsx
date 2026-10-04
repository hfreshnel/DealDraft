"use client";

import { useMemo, useState } from "react";
import demo from "../data/demo.json";
import { formatEuro, formatPercent } from "../data/format";

type RowKind = "excerpt" | "input" | "computed" | "missing";

type TraceRow = {
    key: string;
    label: string;
    value: string;
    kind: RowKind;
    fields: string[];
    note?: string;
};

type Segment = {
    text: string;
    fields: string[];
};

const KIND_NOTES: Record<Exclude<RowKind, "excerpt">, string> = {
    input: "Saisi par vous dans le formulaire : l'IA n'estime jamais un loyer.",
    computed: "Calculé par le code, sans IA.",
    missing: "Absent du message : laissé vide plutôt que deviné, et listé comme donnée à demander.",
};

const { extraction, analysis, assumptions, listingText } = demo;

const ROWS: TraceRow[] = [
    { key: "type", label: "Bien", value: "Studio, 1 pièce", kind: "excerpt", fields: ["propertyType", "roomCount"] },
    { key: "area", label: "Surface", value: `${extraction.livingAreaSqm} m²`, kind: "excerpt", fields: ["livingAreaSqm"] },
    { key: "city", label: "Ville", value: extraction.city ?? "", kind: "excerpt", fields: ["city"] },
    { key: "price", label: "Prix demandé", value: formatEuro(analysis.purchasePrice), kind: "excerpt", fields: ["askingPrice"] },
    { key: "occupancy", label: "Occupation", value: "Libre", kind: "excerpt", fields: ["occupancyStatus"] },
    { key: "condition", label: "État général", value: "À rénover", kind: "excerpt", fields: ["overallCondition"] },
    {
        key: "works",
        label: "Travaux repérés",
        value: `${extraction.worksItems.length} postes`,
        kind: "excerpt",
        fields: extraction.worksItems.map((item) => `works:${item.category}`),
    },
    { key: "missing", label: "DPE, charges, taxe foncière", value: "Non renseignés", kind: "missing", fields: [] },
    { key: "rent", label: "Loyer après travaux", value: `${formatEuro(assumptions.expectedMonthlyRent)} / mois`, kind: "input", fields: [] },
    {
        key: "budget",
        label: "Budget tout compris",
        value: formatEuro(analysis.totalBudget),
        kind: "computed",
        fields: [],
        note: "Calculé par le code : prix, notaire, travaux selon la grille, ameublement.",
    },
    {
        key: "yield",
        label: "Rendement brut",
        value: formatPercent(analysis.primaryYield),
        kind: "computed",
        fields: [],
        note: "Calculé par le code : loyer annuel divisé par le budget.",
    },
];

function buildSegments(text: string): Segment[] {
    const excerpts = [
        ...extraction.sourceExcerpts.map((item) => ({ field: item.field, excerpt: item.excerpt })),
        ...extraction.worksItems.map((item) => ({ field: `works:${item.category}`, excerpt: item.excerpt })),
    ];
    const ranges: { start: number; end: number; fields: string[] }[] = [];
    for (const { field, excerpt } of excerpts) {
        const start = text.indexOf(excerpt);
        if (start < 0) {
            continue;
        }
        const end = start + excerpt.length;
        const same = ranges.find((range) => range.start === start && range.end === end);
        if (same) {
            same.fields.push(field);
        } else {
            ranges.push({ start, end, fields: [field] });
        }
    }
    ranges.sort((left, right) => left.start - right.start);

    // Overlapping excerpts are folded into the earlier range so each character is painted once.
    const merged: typeof ranges = [];
    for (const range of ranges) {
        const previous = merged[merged.length - 1];
        if (previous && range.start < previous.end) {
            previous.end = Math.max(previous.end, range.end);
            previous.fields.push(...range.fields);
        } else {
            merged.push({ ...range, fields: [...range.fields] });
        }
    }

    const segments: Segment[] = [];
    let cursor = 0;
    for (const range of merged) {
        if (range.start > cursor) {
            segments.push({ text: text.slice(cursor, range.start), fields: [] });
        }
        segments.push({ text: text.slice(range.start, range.end), fields: range.fields });
        cursor = range.end;
    }
    if (cursor < text.length) {
        segments.push({ text: text.slice(cursor), fields: [] });
    }
    return segments;
}

export function SourceTrace() {
    const [activeKey, setActiveKey] = useState<string | null>("price");
    const segments = useMemo(() => buildSegments(listingText), []);
    const activeRow = ROWS.find((row) => row.key === activeKey) ?? null;
    const activeFields = new Set(activeRow?.fields ?? []);
    const rowByField = new Map(ROWS.flatMap((row) => row.fields.map((field) => [field, row.key] as const)));

    return (
        <div className="trace">
            <figure className="trace-message">
                <figcaption>Message reçu d'un agent immobilier</figcaption>
                <p className="message-body">
                    {segments.map((segment, index) => {
                        if (segment.fields.length === 0) {
                            return <span key={index}>{segment.text}</span>;
                        }
                        const isActive = segment.fields.some((field) => activeFields.has(field));
                        return (
                            <mark
                                key={index}
                                className={isActive ? "excerpt active" : "excerpt"}
                                onMouseEnter={() => setActiveKey(rowByField.get(segment.fields[0]) ?? null)}
                            >
                                {segment.text}
                            </mark>
                        );
                    })}
                </p>
            </figure>

            <div className="trace-sheet" aria-label="Brouillon d'étude">
                <div className="sheet-head">
                    <strong>Étude de rendement</strong>
                    <span className="draft-tag">Brouillon à valider</span>
                </div>
                <ul className="sheet-rows">
                    {ROWS.map((row) => (
                        <li key={row.key}>
                            <button
                                type="button"
                                className={`sheet-row ${row.kind}${row.key === activeKey ? " active" : ""}`}
                                onMouseEnter={() => setActiveKey(row.key)}
                                onFocus={() => setActiveKey(row.key)}
                                onClick={() => setActiveKey(row.key)}
                                aria-pressed={row.key === activeKey}
                            >
                                <span className="sheet-label">{row.label}</span>
                                <span className="sheet-value">{row.value}</span>
                            </button>
                        </li>
                    ))}
                </ul>
                <p className="sheet-origin" aria-live="polite">
                    {activeRow === null
                        ? "Survolez une ligne pour voir d'où vient la valeur."
                        : activeRow.kind === "excerpt"
                          ? "Cité mot pour mot : le passage est surligné dans le message."
                          : (activeRow.note ?? KIND_NOTES[activeRow.kind])}
                </p>
            </div>
        </div>
    );
}
