import type { CSSProperties, ReactNode } from "react";
import {
    REPORT_ASSUMPTION_ROWS,
    REPORT_BUDGET_ROWS,
    REPORT_META,
    REPORT_PROPERTY_ROWS,
    REPORT_TRACE_ROWS,
    REPORT_YIELD_ROWS,
    SUMMARY_ROWS,
} from "../data/demo";
import { DOC } from "../layout";
import { EASE_OUT_EXPO } from "../lib/easing";
import { ramp } from "../lib/motion";
import { COLORS, FONTS } from "../theme";

// The study as it lands in Google Drive: same sections and wording as the real report, Arial like the Google Doc.

const TEXT = "#202124";
const MUTED = "#5f6368";
const NOT_FOUND = "#b3261e";
const GRID = "#c9ced6";

export type ReportTiming = { buildStart: number; passes: number[] };

type Block = { key: string; height: number; render: (frame: number, timing: ReportTiming) => ReactNode };

const cell: CSSProperties = { boxSizing: "border-box", borderRight: `1px solid ${GRID}`, padding: "0 10px", display: "flex", alignItems: "center", overflow: "hidden", whiteSpace: "nowrap" };

function sweep(frame: number, start: number): string | undefined {
    const amount = ramp(frame, start, 12, EASE_OUT_EXPO);
    if (amount <= 0) {
        return undefined;
    }
    return `linear-gradient(${COLORS.marker}, ${COLORS.marker}) no-repeat left center / ${amount * 100}% 72%`;
}

function Table({ rows, columns, rowHeight, fontSize = 15 }: { rows: ReactNode[][]; columns: number[]; rowHeight: number; fontSize?: number }) {
    return (
        <div style={{ border: `1px solid ${GRID}`, borderBottom: "none", fontSize }}>
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} style={{ display: "flex", boxSizing: "border-box", height: rowHeight, borderBottom: `1px solid ${GRID}` }}>
                    {row.map((content, columnIndex) => (
                        <div key={columnIndex} style={{ ...cell, width: `${columns[columnIndex] * 100}%`, borderRight: columnIndex === row.length - 1 ? "none" : cell.borderRight }}>
                            {content}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

function Heading({ text }: { text: string }) {
    return <div style={{ fontSize: 21, fontWeight: 700, paddingTop: 12 }}>{text}</div>;
}

function Note({ text }: { text: string }) {
    return <div style={{ fontSize: 14, lineHeight: 1.45, color: MUTED, paddingTop: 6 }}>{text}</div>;
}

function NotFound() {
    return <i style={{ color: NOT_FOUND }}>non trouvé</i>;
}

function quote(excerpt: string, frame: number, start: number) {
    return (
        <span style={{ background: sweep(frame, start), padding: "1px 2px" }}>
            « {excerpt} » <i style={{ color: MUTED }}>(Annonce)</i>
        </span>
    );
}

const BLOCKS: Block[] = [
    {
        key: "banner",
        height: 96,
        render: () => (
            <div style={{ background: COLORS.draftBanner, padding: "10px 14px", fontSize: 15, lineHeight: 1.45, height: 84 }}>
                <b>BROUILLON À VALIDER PAR LE CHASSEUR.</b> Aucun envoi sans validation humaine. Grille de prix au statut « illustrative » : les montants de travaux et
                d'ameublement sont des valeurs d'exemple, pas un barème.
            </div>
        ),
    },
    { key: "title", height: 50, render: () => <div style={{ fontSize: 30, fontWeight: 700, lineHeight: "50px" }}>Étude de rendement</div> },
    {
        key: "subtitle",
        height: 66,
        render: () => (
            <div style={{ lineHeight: 1.5 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{REPORT_META.listingTitle}</div>
                <div style={{ fontSize: 14, color: MUTED }}>
                    Référence {REPORT_META.studyId} · révision n° 1 · générée le {REPORT_META.createdAt} · statut : <b style={{ color: TEXT }}>Prêt à relire</b>
                </div>
            </div>
        ),
    },
    { key: "h-summary", height: DOC.synthTop - 260, render: () => <Heading text="Synthèse" /> },
    {
        key: "summary",
        height: DOC.synthRow * 4 + 26,
        render: () => (
            <Table
                rows={SUMMARY_ROWS.map((row) => [<span key="l" style={{ fontSize: 16 }}>{row.label}</span>, <b key="v" style={{ fontSize: DOC.valueFontSize }}>{row.value}</b>])}
                columns={[DOC.valueColumn, 1 - DOC.valueColumn]}
                rowHeight={DOC.synthRow}
            />
        ),
    },
    { key: "h-property", height: 44, render: () => <Heading text="1. Le bien" /> },
    { key: "n-property", height: 46, render: () => <Note text="Chaque valeur provient d'un passage cité mot pour mot. « non trouvé » signifie que l'information n'est pas écrite dans les textes : elle n'a pas été devinée." /> },
    {
        key: "property",
        height: 30 + REPORT_PROPERTY_ROWS.length * 30 + 26,
        render: (frame, timing) => {
            let quoted = 0;
            let missing = 0;
            return (
                <Table
                    rowHeight={30}
                    fontSize={14}
                    columns={[0.33, 0.25, 0.42]}
                    rows={[
                        [<b key="a">Donnée</b>, <b key="b">Valeur</b>, <b key="c">Extrait source</b>],
                        ...REPORT_PROPERTY_ROWS.map((row) => {
                            if (row.value === null) {
                                const flashAt = timing.passes[0] + 18 + missing * 3;
                                missing += 1;
                                const flash = frame >= flashAt ? Math.max(0, 1 - (frame - flashAt) / 30) : 0;
                                return [
                                    <span key="l">{row.label}</span>,
                                    <span key="v" style={{ background: `rgba(179, 38, 30, ${0.14 * flash})`, padding: "1px 3px" }}><NotFound /></span>,
                                    <span key="e" />,
                                ];
                            }
                            const start = timing.passes[0] + quoted * 3;
                            quoted += 1;
                            return [<span key="l">{row.label}</span>, <span key="v">{row.value}</span>, row.excerpt ? quote(row.excerpt, frame, start) : <span key="e" />];
                        }),
                    ]}
                />
            );
        },
    },
    { key: "h-budget", height: 44, render: () => <Heading text="2. Budget clé en main" /> },
    {
        key: "budget",
        height: REPORT_BUDGET_ROWS.length * 32 + 10,
        render: (frame, timing) => (
            <Table
                rowHeight={32}
                columns={[0.66, 0.34]}
                rows={REPORT_BUDGET_ROWS.map((row, index) => [
                    <span key="l" style={{ fontWeight: row.strong ? 700 : 400 }}>{row.label}</span>,
                    <span key="v" style={{ fontWeight: row.strong ? 700 : 400, background: index === REPORT_BUDGET_ROWS.length - 1 ? sweep(frame, timing.passes[1]) : undefined, padding: "1px 3px" }}>
                        {row.value}
                    </span>,
                ])}
            />
        ),
    },
    { key: "n-budget", height: 44, render: () => <Note text={`Travaux estimés au m² d'après l'état général : les postes listés ne sont pas chiffrés un par un. Durée de chantier estimée : environ 2,1 mois (ordre de grandeur).`} /> },
    { key: "h-yield", height: 44, render: () => <Heading text="3. Rendement" /> },
    {
        key: "yield",
        height: REPORT_YIELD_ROWS.length * 32 + 10,
        render: (frame, timing) => (
            <Table
                rowHeight={32}
                columns={[0.66, 0.34]}
                rows={REPORT_YIELD_ROWS.map((row, index) => [
                    <span key="l">{row.label}</span>,
                    <span key="v" style={{ fontWeight: row.strong ? 700 : 400, background: index === 2 ? sweep(frame, timing.passes[2]) : undefined, padding: "1px 3px" }}>
                        {row.value}
                    </span>,
                ])}
            />
        ),
    },
    { key: "n-yield", height: 44, render: () => <Note text="Deux bases sont affichées car la définition du rendement retenue n'est pas confirmée. Rendement mis en avant dans la synthèse : loyer annuel / achat + notaire + travaux + ameublement." /> },
    { key: "h-financing", height: 44, render: () => <Heading text="4. Financement" /> },
    { key: "financing", height: 34, render: () => <div style={{ fontSize: 15, paddingTop: 6 }}>Non calculé : taux de crédit et d'assurance emprunteur non renseignés.</div> },
    { key: "h-works", height: 44, render: () => <Heading text="5. Travaux repérés" /> },
    {
        key: "works",
        height: 30 + REPORT_META.works.length * 30 + 8,
        render: () => (
            <Table
                rowHeight={30}
                fontSize={14}
                columns={[0.2, 0.18, 0.12, 0.5]}
                rows={[
                    [<b key="a">Poste</b>, <b key="b">Quantité</b>, <b key="c">Chiffré</b>, <b key="d">Extrait source</b>],
                    ...REPORT_META.works.map((work) => [<span key="a">{work.label}</span>, <span key="b">non précisée</span>, <span key="c">non</span>, <span key="d">« {work.excerpt} »</span>]),
                ]}
            />
        ),
    },
    { key: "n-works", height: 40, render: () => <div style={{ fontSize: 15, paddingTop: 8 }}>Postes non chiffrés (prix absent de la grille ou quantité non écrite) : {REPORT_META.works.map((work) => work.label).join(", ")}.</div> },
    { key: "h-watch", height: 44, render: () => <Heading text="6. Points de vigilance" /> },
    {
        key: "watch",
        height: 196,
        render: (frame, timing) => (
            <div style={{ fontSize: 15, lineHeight: 1.5, paddingTop: 6 }}>
                <b>Relevés dans les textes</b>
                {REPORT_META.riskFlags.map((flag) => (
                    <div key={flag} style={{ paddingLeft: 18 }}>
                        • <span style={{ background: sweep(frame, timing.passes[3]), padding: "1px 2px" }}>{flag}</span>
                    </div>
                ))}
                <div style={{ height: 6 }} />
                <b>Contrôles automatiques</b>
                {REPORT_META.warnings.map((warning) => (
                    <div key={warning} style={{ paddingLeft: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        • {warning}
                    </div>
                ))}
            </div>
        ),
    },
    { key: "h-missing", height: 44, render: () => <Heading text="7. Données critiques manquantes" /> },
    { key: "missing", height: 36, render: () => <div style={{ fontSize: 15, paddingTop: 6 }}>Aucune.</div> },
    { key: "h-assumptions", height: 44, render: () => <Heading text="8. Hypothèses utilisées" /> },
    {
        key: "assumptions",
        height: REPORT_ASSUMPTION_ROWS.length * 30 + 16,
        render: () => <Table rowHeight={30} fontSize={14} columns={[0.4, 0.6]} rows={REPORT_ASSUMPTION_ROWS.map((row) => [<span key="l">{row.label}</span>, <span key="v">{row.value}</span>])} />,
    },
    { key: "h-trace", height: 44, render: () => <Heading text="9. Traçabilité" /> },
    {
        key: "trace",
        height: REPORT_TRACE_ROWS.length * 30 + 12,
        render: (frame, timing) => (
            <Table
                rowHeight={30}
                fontSize={14}
                columns={[0.4, 0.6]}
                rows={REPORT_TRACE_ROWS.map((row, index) => [
                    <span key="l">{row.label}</span>,
                    <span key="v" style={{ background: index === 1 || index === 2 ? sweep(frame, timing.passes[4] + index * 4) : undefined, padding: "1px 3px" }}>
                        {row.value}
                    </span>,
                ])}
            />
        ),
    },
    { key: "footer", height: 40, render: () => <div style={{ fontSize: 13, color: MUTED, paddingTop: 10 }}>Document généré automatiquement à partir de textes fictifs.</div> },
];

const PAD_TOP = 48;

export const REPORT_OFFSETS: Record<string, number> = (() => {
    const offsets: Record<string, number> = {};
    let top = PAD_TOP;
    for (const block of BLOCKS) {
        offsets[block.key] = top;
        top += block.height;
    }
    offsets.end = top + 44;
    return offsets;
})();

export const REPORT_HEIGHT = REPORT_OFFSETS.end;

// The summary must start exactly where the scene-6 handoff expects it.
if (REPORT_OFFSETS.summary !== DOC.synthTop) {
    throw new Error(`Report summary table at ${REPORT_OFFSETS.summary}, expected ${DOC.synthTop}`);
}

export function ReportPage({ frame, timing, yieldOnly = false }: { frame: number; timing: ReportTiming; yieldOnly?: boolean }) {
    return (
        <div
            style={{
                position: "absolute",
                left: DOC.x,
                top: DOC.y,
                width: DOC.width,
                height: REPORT_HEIGHT,
                fontFamily: FONTS.doc,
                color: TEXT,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: COLORS.paper,
                    boxShadow: "0 2px 6px rgba(20, 32, 51, 0.08), 0 30px 90px rgba(20, 32, 51, 0.16)",
                    opacity: yieldOnly ? 0 : ramp(frame, timing.buildStart, 20),
                }}
            />
            {BLOCKS.map((block, index) => {
                const appear = ramp(frame, timing.buildStart + 4 + index * 2.2, 22, EASE_OUT_EXPO);
                const isSummary = block.key === "summary";
                if (yieldOnly && !isSummary) {
                    return null;
                }
                return (
                    <div
                        key={block.key}
                        style={{
                            position: "absolute",
                            left: DOC.padX,
                            width: DOC.width - DOC.padX * 2,
                            top: REPORT_OFFSETS[block.key],
                            height: block.height,
                            opacity: isSummary ? 1 : appear,
                            transform: isSummary ? undefined : `translateY(${(1 - appear) * 16}px)`,
                        }}
                    >
                        {isSummary ? <SummaryBlock frame={frame} timing={timing} render={block.render} yieldOnly={yieldOnly} /> : block.render(frame, timing)}
                    </div>
                );
            })}
        </div>
    );
}

// The summary keeps its yield value visible from the first frame; borders and other cells build around it.
function SummaryBlock({ frame, timing, render, yieldOnly }: { frame: number; timing: ReportTiming; render: Block["render"]; yieldOnly: boolean }) {
    const appear = yieldOnly ? 0 : ramp(frame, timing.buildStart, 24, EASE_OUT_EXPO);
    const contentWidth = DOC.width - DOC.padX * 2;
    const valueLeft = contentWidth * DOC.valueColumn + 10;
    return (
        <>
            <div style={{ opacity: appear }}>{render(frame, timing)}</div>
            <div style={{ position: "absolute", left: 0, top: DOC.synthRow * 2, width: contentWidth, height: DOC.synthRow, opacity: 1 - appear }}>
                <b style={{ position: "absolute", left: valueLeft, top: 0, height: DOC.synthRow, display: "flex", alignItems: "center", fontSize: DOC.valueFontSize, whiteSpace: "nowrap" }}>
                    {SUMMARY_ROWS[2].value}
                </b>
            </div>
        </>
    );
}
