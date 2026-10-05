import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { FontGate } from "./components/FontGate";
import { Grain } from "./components/Grain";
import { Marker } from "./components/Marker";
import { SheetGlyph } from "./components/SheetGlyph";
import { LEDGER, LISTING_TEXT, MARKS, REPO_LABEL, REPORT_META, SITE } from "./data/demo";
import { textWidth, type TextStyle } from "./lib/text-layout";
import { COLORS, FONTS, NBSP } from "./theme";

// Video thumbnail: the listing goes in, the study comes out. The center stays clear for the page's play button.

const LEFT = 104;
const HEADLINE_LINES: { plain: string; marked?: string }[] = [
    { plain: "Collez une" },
    { plain: "annonce." },
    { plain: "Recevez ", marked: "l'étude" },
    { plain: "", marked: "de rendement." },
];
const HEADLINE_MAX_WIDTH = 740;
const HEADLINE_TOP = 262;
const HEADLINE_LINE_HEIGHT = 1.0;

const CARD = { x: 1000, y: 84, width: 600, rotate: -4.5 };
const SHEET = { x: 1148, y: 340, width: 680, height: 900, rotate: 3 };

const DOC_TEXT = "#202124";
const DOC_MUTED = "#5f6368";
const DOC_GRID = "#c9ced6";

function headlineStyle(fontSize: number): TextStyle {
    return { fontSize, fontWeight: 700, letterSpacing: "-0.035em" };
}

function headlineSize(): number {
    const widest = Math.max(...HEADLINE_LINES.map((line) => textWidth(line.plain + (line.marked ?? ""), headlineStyle(100))));
    return Math.min(108, Math.floor((100 * HEADLINE_MAX_WIDTH) / widest));
}

function highlighted(text: string, excerpts: string[]): ReactNode[] {
    const ranges = excerpts
        .map((excerpt) => {
            const start = text.indexOf(excerpt);
            if (start < 0) {
                throw new Error(`Poster excerpt not found in the listing: "${excerpt}"`);
            }
            return [start, start + excerpt.length] as const;
        })
        .sort((a, b) => a[0] - b[0]);
    const nodes: ReactNode[] = [];
    let cursor = 0;
    for (const [start, end] of ranges) {
        if (start < cursor) {
            continue;
        }
        nodes.push(text.slice(cursor, start));
        nodes.push(
            <span
                key={start}
                style={{
                    color: COLORS.nightMarker,
                    background: "rgba(243, 216, 76, 0.16)",
                    borderBottom: `3px solid ${COLORS.nightMarker}`,
                    borderRadius: "4px 4px 0 0",
                    padding: "0 4px",
                    margin: "0 -2px",
                    boxDecorationBreak: "clone",
                    WebkitBoxDecorationBreak: "clone",
                }}
            >
                {text.slice(start, end)}
            </span>,
        );
        cursor = end;
    }
    nodes.push(text.slice(cursor));
    return nodes;
}

function Backdrop() {
    const gridLine = "rgba(132, 169, 247, 0.08)";
    const gridMask = "radial-gradient(ellipse 70% 90% at 78% 55%, #000 30%, transparent 85%)";
    return (
        <>
            <AbsoluteFill style={{ background: COLORS.ink }} />
            <AbsoluteFill
                style={{
                    backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                    backgroundPosition: "-1px -1px",
                    maskImage: gridMask,
                    WebkitMaskImage: gridMask,
                }}
            />
            <AbsoluteFill style={{ background: "radial-gradient(ellipse 46% 60% at 80% 62%, rgba(31, 79, 176, 0.55), rgba(31, 79, 176, 0) 70%)" }} />
            <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 70% at 12% 50%, rgba(7, 11, 18, 0.55), rgba(7, 11, 18, 0) 70%)" }} />
        </>
    );
}

function Brand() {
    return (
        <div style={{ position: "absolute", left: LEFT, top: 92, display: "flex", alignItems: "center", gap: 18 }}>
            <SheetGlyph height={60} stroke={COLORS.nightInk} barColor={COLORS.nightMarker} />
            <div style={{ fontFamily: FONTS.sans, fontSize: 50, fontWeight: 700, letterSpacing: "-0.035em", color: COLORS.nightInk, lineHeight: 1 }}>{SITE.name}</div>
        </div>
    );
}

// One hand-drawn stroke per line, so a mark spanning several words has no seam.
function Headline() {
    const size = headlineSize();
    const style = headlineStyle(size);
    const lineBox = size * HEADLINE_LINE_HEIGHT;
    return (
        <>
            {HEADLINE_LINES.map((line, index) => {
                const top = HEADLINE_TOP + index * lineBox;
                const markLeft = textWidth(line.plain, style);
                const markWidth = line.marked ? textWidth(line.marked, style) : 0;
                return (
                    <div key={index}>
                        {line.marked ? <Marker x={LEFT + markLeft - size * 0.04} y={top + lineBox * 0.17} width={markWidth + size * 0.1} height={lineBox * 0.74} progress={1} seed={21 + index} color={COLORS.nightMarker} /> : null}
                        <div
                            style={{
                                position: "absolute",
                                left: LEFT,
                                top,
                                height: lineBox,
                                lineHeight: `${lineBox}px`,
                                fontFamily: FONTS.sans,
                                fontSize: size,
                                fontWeight: style.fontWeight,
                                letterSpacing: style.letterSpacing,
                                color: COLORS.nightInk,
                                whiteSpace: "pre",
                            }}
                        >
                            {line.plain}
                            {line.marked ? <span style={{ color: COLORS.ink }}>{line.marked}</span> : null}
                        </div>
                    </div>
                );
            })}
        </>
    );
}

function Pledges() {
    const item: CSSProperties = { display: "flex", alignItems: "center", gap: 16 };
    const dot: CSSProperties = { width: 12, height: 12, borderRadius: 3, background: COLORS.nightMarker, flex: "none" };
    return (
        <div
            style={{
                position: "absolute",
                left: LEFT,
                top: 742,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                fontFamily: FONTS.sans,
                fontSize: 31,
                fontWeight: 500,
                color: COLORS.nightSlate,
                lineHeight: 1.25,
            }}
        >
            <div style={item}>
                <span style={dot} />
                Chaque valeur citée mot pour mot
            </div>
            <div style={item}>
                <span style={dot} />
                Vous relisez, vous validez
            </div>
        </div>
    );
}

function Repo() {
    return (
        <div style={{ position: "absolute", left: LEFT, bottom: 84, fontFamily: FONTS.mono, fontSize: 27, fontWeight: 500, color: COLORS.nightPlan, letterSpacing: "-0.01em" }}>
            {REPO_LABEL}
        </div>
    );
}

function ListingCard() {
    const paragraphs = LISTING_TEXT.split("\n").filter((line) => line.trim().length > 0);
    const title = paragraphs[0];
    const price = paragraphs.find((line) => line.includes(MARKS.price)) ?? "";
    const occupancy = `${MARKS.occupancy}.`;
    if (!LISTING_TEXT.includes(occupancy)) {
        throw new Error(`Poster occupancy line not found in the listing: "${occupancy}"`);
    }
    return (
        <div
            style={{
                position: "absolute",
                left: CARD.x,
                top: CARD.y,
                width: CARD.width,
                transform: `rotate(${CARD.rotate}deg)`,
                transformOrigin: "50% 50%",
                background: COLORS.nightWash,
                border: `1.5px solid ${COLORS.nightRule}`,
                borderRadius: "28px 28px 28px 8px",
                padding: "24px 32px 30px",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
                fontFamily: FONTS.sans,
                color: COLORS.nightInk,
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 20, fontWeight: 600, color: COLORS.nightPlan, marginBottom: 12 }}>
                <span>Agent immobilier</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 17, fontWeight: 500, color: COLORS.nightSlate }}>message transféré</span>
            </div>
            <div style={{ fontSize: 25, lineHeight: 1.55 }}>
                <div style={{ fontWeight: 600 }}>{highlighted(title, [MARKS.type, MARKS.area, MARKS.city])}</div>
                <div>{highlighted(price, [MARKS.price])}</div>
                <div>{highlighted(occupancy, [MARKS.occupancy])}</div>
            </div>
        </div>
    );
}

function Thread() {
    // Hand-drawn connector from the message to the study, in the marker color.
    return (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d="M 1046 392 C 1004 480, 1020 590, 1112 636" fill="none" stroke={COLORS.nightMarker} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 12" />
            <path d="M 1090 618 L 1118 640 L 1084 650" fill="none" stroke={COLORS.nightMarker} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: 52,
                borderTop: `1px solid ${DOC_GRID}`,
                borderBottom: last ? `1px solid ${DOC_GRID}` : undefined,
                fontSize: 20,
            }}
        >
            <span>{label}</span>
            <b style={{ fontSize: 22 }}>{value}</b>
        </div>
    );
}

function StudySheet() {
    const yieldStyle = { fontSize: 150, fontWeight: 800, letterSpacing: "-0.045em" };
    const yieldWidth = textWidth(LEDGER.yield, yieldStyle);
    return (
        <div
            style={{
                position: "absolute",
                left: SHEET.x,
                top: SHEET.y,
                width: SHEET.width,
                height: SHEET.height,
                transform: `rotate(${SHEET.rotate}deg)`,
                transformOrigin: "50% 30%",
                background: COLORS.paper,
                boxShadow: "0 3px 8px rgba(0, 0, 0, 0.25), 0 40px 110px rgba(0, 0, 0, 0.55)",
                fontFamily: FONTS.doc,
                color: DOC_TEXT,
                padding: "40px 48px",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "inline-block", background: COLORS.draftBanner, padding: "9px 14px", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>BROUILLON À VALIDER</div>
            <div style={{ fontSize: 36, fontWeight: 700, marginTop: 22 }}>Étude de rendement</div>
            <div style={{ fontSize: 18, color: DOC_MUTED, marginTop: 6 }}>{REPORT_META.listingTitle}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: DOC_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 36 }}>Rendement brut</div>
            <div style={{ position: "relative", height: 166, marginTop: 4 }}>
                <Marker x={4} y={44} width={yieldWidth - 8} height={92} progress={1} seed={11} />
                <div style={{ position: "absolute", left: 0, top: 0, lineHeight: "166px", fontFamily: FONTS.sans, color: COLORS.ink, whiteSpace: "nowrap", ...yieldStyle }}>{LEDGER.yield}</div>
            </div>
            <div style={{ fontSize: 17, color: DOC_MUTED, marginTop: 2, marginBottom: 30 }}>loyer annuel / achat + notaire + travaux + ameublement</div>
            <SummaryRow label="Budget total" value={LEDGER.total} />
            <SummaryRow label="Loyer estimé après travaux" value={`${LEDGER.rent}${NBSP}/${NBSP}mois`} />
            <SummaryRow label="Points de vigilance" value={String(LEDGER.vigilance)} last />
        </div>
    );
}

function ReviewStamp() {
    const size = 34;
    const color = COLORS.plan;
    return (
        <div
            style={{
                position: "absolute",
                left: 1700,
                top: 386,
                transform: "translate(-50%, -50%) rotate(-9deg)",
                border: `${size * 0.11}px solid ${color}`,
                outline: `${size * 0.04}px solid ${color}`,
                outlineOffset: -size * 0.26,
                borderRadius: size * 0.24,
                padding: `${size * 0.32}px ${size * 0.55}px`,
                color,
                background: "rgba(255, 255, 255, 0.94)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
                fontFamily: FONTS.sans,
                fontSize: size,
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1,
            }}
        >
            Prêt à relire
        </div>
    );
}

export function Poster() {
    return (
        <FontGate>
            <AbsoluteFill style={{ overflow: "hidden" }}>
                <Backdrop />
                <ListingCard />
                <StudySheet />
                <Thread />
                <ReviewStamp />
                <Brand />
                <Headline />
                <Pledges />
                <Repo />
                <Grain frame={0} opacity={0.35} />
            </AbsoluteFill>
        </FontGate>
    );
}
