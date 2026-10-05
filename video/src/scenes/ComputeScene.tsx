import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Marker } from "../components/Marker";
import { Odometer, odometerWidth } from "../components/Odometer";
import { RevealText } from "../components/RevealText";
import { LEDGER, MARKS } from "../data/demo";
import { HANDOFF_FONT_SIZE } from "../layout";
import { EASE_IN_CUBIC, EASE_IN_OUT_CUBIC, EASE_IN_OUT_EXPO, EASE_OUT_EXPO } from "../lib/easing";
import { clamp01, lerp, mixColor, pop, ramp, SPRING_POP, typed } from "../lib/motion";
import { COMPUTE } from "../timeline";
import { COLORS, FONTS, NBSP } from "../theme";

type Origin = "cited" | "input" | "grid";

const ORIGIN_LABELS: Record<Origin, string> = { cited: "cité", input: "saisi par vous", grid: "grille de prix · exemple" };

const ROWS: { key: string; label: string; origin: Origin; formula: string; value: string; at: number }[] = [
    { key: "price", label: "Prix d'achat", origin: "cited", formula: `« ${MARKS.price} »`, value: LEDGER.price, at: COMPUTE.rows[0] },
    { key: "notary", label: "Frais de notaire", origin: "input", formula: `${LEDGER.notaryRate} du prix`, value: LEDGER.notary, at: COMPUTE.rows[1] },
    { key: "works", label: "Travaux", origin: "grid", formula: LEDGER.worksFormula, value: LEDGER.works, at: COMPUTE.rows[2] },
    { key: "furniture", label: "Ameublement", origin: "grid", formula: "studio", value: LEDGER.furniture, at: COMPUTE.rows[3] },
];

const LEDGER_LEFT = 90;
const LEDGER_RIGHT = 1090;
const ROW_TOP = 330;
const ROW_STEP = 96;
const SUM_Y = ROW_TOP + ROW_STEP * 4 - 6;
const TOTAL_Y = SUM_Y + 22;
const RENT_Y = TOTAL_Y + 104;
const BIG_SIZE = 280;

function OriginChip({ origin, appear }: { origin: Origin; appear: number }) {
    const styles: Record<Origin, { background: string; border: string; color: string }> = {
        cited: { background: COLORS.markerSoft, border: "#efcf3a", color: COLORS.ink },
        input: { background: COLORS.paper, border: COLORS.plan, color: COLORS.plan },
        grid: { background: COLORS.wash, border: COLORS.rule, color: COLORS.slate },
    };
    const style = styles[origin];
    return (
        <span
            style={{
                display: "inline-block",
                padding: "3px 12px",
                borderRadius: 8,
                border: `1.5px solid ${style.border}`,
                background: style.background,
                color: style.color,
                fontFamily: FONTS.sans,
                fontSize: 20,
                fontWeight: 600,
                opacity: appear,
                transform: `translateY(${(1 - appear) * 10}px)`,
                whiteSpace: "nowrap",
            }}
        >
            {ORIGIN_LABELS[origin]}
        </span>
    );
}

function LedgerRow({ frame, y, label, origin, formula, value, at, valueSize = 40, labelSize = 30, weight = 700, highlight }: { frame: number; y: number; label: string; origin?: Origin; formula?: string; value: string; at: number; valueSize?: number; labelSize?: number; weight?: number; highlight?: number }) {
    const appear = ramp(frame, at, 24, EASE_OUT_EXPO);
    const valueWidth = odometerWidth(value, valueSize, weight, "-0.02em");
    return (
        <div style={{ position: "absolute", left: 0, top: y, width: 1920, height: 90 }}>
            <div style={{ position: "absolute", left: LEDGER_LEFT, top: 0, fontFamily: FONTS.sans, fontSize: labelSize, fontWeight: 650, color: COLORS.ink, opacity: appear, transform: `translateX(${(1 - appear) * -24}px)`, letterSpacing: "-0.01em" }}>
                {label}
            </div>
            {origin ? (
                <div style={{ position: "absolute", left: LEDGER_LEFT, top: labelSize + 14 }}>
                    <OriginChip origin={origin} appear={ramp(frame, at + 8, 18, EASE_OUT_EXPO)} />
                </div>
            ) : null}
            {formula ? (
                <div style={{ position: "absolute", left: 450, top: 4, fontFamily: FONTS.sans, fontSize: 26, color: COLORS.slate, opacity: ramp(frame, at + 4, 18), whiteSpace: "pre" }}>{formula}</div>
            ) : null}
            {highlight !== undefined && highlight > 0 ? (
                <Marker x={LEDGER_RIGHT - valueWidth - 6} y={valueSize * 0.12} width={valueWidth + 12} height={valueSize * 1.02} progress={highlight} seed={y} />
            ) : null}
            <div style={{ position: "absolute", right: 1920 - LEDGER_RIGHT, top: 0 }}>
                <Odometer value={value} start={at + 2} duration={34} size={valueSize} weight={weight} frame={frame} stagger={2} />
            </div>
        </div>
    );
}

type Segment = { text: string; tone: "name" | "op" | "num" | "unit" };

const CODE_LINES: { at: number; segments: Segment[] }[] = [
    { at: COMPUTE.rows[0] + 6, segments: [{ text: "budget", tone: "name" }, { text: "  = ", tone: "op" }, { text: LEDGER.price.replace(`${NBSP}€`, ""), tone: "num" }] },
    { at: COMPUTE.rows[1] + 6, segments: [{ text: "        + ", tone: "op" }, { text: LEDGER.notary.replace(`${NBSP}€`, ""), tone: "num" }] },
    { at: COMPUTE.rows[2] + 6, segments: [{ text: "        + ", tone: "op" }, { text: LEDGER.works.replace(`${NBSP}€`, ""), tone: "num" }] },
    { at: COMPUTE.rows[3] + 6, segments: [{ text: "        + ", tone: "op" }, { text: LEDGER.furniture.replace(`${NBSP}€`, ""), tone: "num" }] },
    { at: COMPUTE.totalRoll[0], segments: [{ text: "        = ", tone: "op" }, { text: LEDGER.total, tone: "num" }] },
    { at: COMPUTE.rentRow + 6, segments: [{ text: "loyer", tone: "name" }, { text: "   = ", tone: "op" }, { text: `${LEDGER.rent.replace(`${NBSP}€`, "")} × 12`, tone: "num" }] },
    { at: COMPUTE.rentRow + 26, segments: [{ text: "        = ", tone: "op" }, { text: LEDGER.annualRent, tone: "num" }, { text: " par an", tone: "unit" }] },
    { at: COMPUTE.fraction[0], segments: [{ text: "rendement", tone: "name" }, { text: " = ", tone: "op" }, { text: "loyer / budget", tone: "num" }] },
];

const TONE_COLORS: Record<Segment["tone"], string> = { name: COLORS.nightPlan, op: COLORS.nightSlate, num: COLORS.nightInk, unit: COLORS.nightSlate };

function CodePanel({ frame }: { frame: number }) {
    const appear = ramp(frame, COMPUTE.rows[0] - 10, 30, EASE_OUT_EXPO);
    return (
        <div
            style={{
                position: "absolute",
                left: 1190,
                top: 330,
                width: 640,
                height: 520,
                borderRadius: 18,
                background: COLORS.ink,
                boxShadow: "0 30px 80px rgba(20, 32, 51, 0.25)",
                opacity: appear,
                transform: `translateY(${(1 - appear) * 30}px)`,
                padding: "30px 36px",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 20, color: COLORS.nightSlate }}>finance.py</span>
                <span style={{ fontFamily: FONTS.sans, fontSize: 20, fontWeight: 600, color: COLORS.nightMet }}>sans IA</span>
            </div>
            {CODE_LINES.map((line, index) => {
                const full = line.segments.map((segment) => segment.text).join("");
                const shown = typed(full, frame, line.at, 0.7).length;
                let cursor = 0;
                return (
                    <div key={index} style={{ height: 52, display: "flex", alignItems: "center", fontFamily: FONTS.mono, fontSize: 26, whiteSpace: "pre" }}>
                        {line.segments.map((segment, segmentIndex) => {
                            const visible = segment.text.slice(0, Math.max(0, shown - cursor));
                            cursor += segment.text.length;
                            return (
                                <span key={segmentIndex} style={{ color: TONE_COLORS[segment.tone], fontWeight: segment.tone === "name" ? 600 : 400 }}>
                                    {visible}
                                </span>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function Board({ frame, children }: { frame: number; children: ReactNode }) {
    const leave = ramp(frame, COMPUTE.drop - 14, 22, EASE_IN_CUBIC);
    if (leave >= 1) {
        return null;
    }
    return <AbsoluteFill style={{ opacity: 1 - leave, transform: `scale(${1 - leave * 0.06})`, filter: leave > 0 ? `blur(${leave * 8}px)` : undefined }}>{children}</AbsoluteFill>;
}

function BigYield({ frame }: { frame: number }) {
    if (frame < COMPUTE.drop - 2) {
        return null;
    }
    const exit = ramp(frame, COMPUTE.exitStart, COMPUTE.exitEnd - COMPUTE.exitStart, EASE_IN_OUT_EXPO);
    const crossfade = clamp01((frame - (COMPUTE.exitEnd - 16)) / 14);
    const scale = lerp(1, HANDOFF_FONT_SIZE / BIG_SIZE, exit);
    const sideFade = 1 - ramp(frame, COMPUTE.exitStart - 22, 20, EASE_IN_CUBIC);
    const width = odometerWidth(LEDGER.yield, BIG_SIZE, 800, "-0.04em");
    const impact = pop(frame, COMPUTE.drop, SPRING_POP);

    return (
        <AbsoluteFill>
            <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: FONTS.sans, fontSize: 40, fontWeight: 600, color: COLORS.slate, opacity: ramp(frame, COMPUTE.drop + 6, 20) * sideFade, letterSpacing: "-0.01em" }}>
                Rendement brut
            </div>
            <div style={{ position: "absolute", left: 960, top: 540, transform: `translate(-50%, -50%) scale(${scale * lerp(1.25, 1, impact)})` }}>
                {sideFade > 0 ? (
                    <div style={{ position: "absolute", left: -10, top: BIG_SIZE * 0.55, opacity: sideFade }}>
                        <Marker x={0} y={0} width={width + 20} height={BIG_SIZE * 0.22} progress={ramp(frame, COMPUTE.yieldMark, 14, EASE_OUT_EXPO)} seed={7} />
                    </div>
                ) : null}
                <div style={{ position: "relative", opacity: 1 - crossfade }}>
                    <Odometer value={LEDGER.yield} start={COMPUTE.yieldRoll[0]} duration={COMPUTE.yieldRoll[1] - COMPUTE.yieldRoll[0]} size={BIG_SIZE} weight={800} letterSpacing="-0.04em" frame={frame} stagger={3} />
                </div>
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        fontFamily: FONTS.doc,
                        fontWeight: 700,
                        fontSize: BIG_SIZE,
                        color: "#202124",
                        whiteSpace: "pre",
                        opacity: crossfade,
                    }}
                >
                    {LEDGER.yield}
                </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center", gap: 18, opacity: sideFade }}>
                {[`Chantier estimé${NBSP}: ${LEDGER.duration}`, `${LEDGER.vigilance} points de vigilance`].map((label, index) => {
                    const shown = pop(frame, COMPUTE.chips[index], SPRING_POP);
                    return (
                        <div
                            key={label}
                            style={{
                                padding: "10px 22px",
                                borderRadius: 999,
                                border: `2px solid ${index === 0 ? COLORS.rule : COLORS.watch}`,
                                color: index === 0 ? COLORS.ink : COLORS.watch,
                                fontFamily: FONTS.sans,
                                fontSize: 28,
                                fontWeight: 600,
                                opacity: Math.min(1, shown * 1.4),
                                transform: `translateY(${(1 - shown) * 18}px) scale(${0.85 + 0.15 * shown})`,
                                background: COLORS.paper,
                            }}
                        >
                            {label}
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
}

export function ComputeScene() {
    const frame = useCurrentFrame();
    const sumDraw = ramp(frame, COMPUTE.sumRule, 22, EASE_IN_OUT_CUBIC);
    const fractionMark = ramp(frame, COMPUTE.fraction[0] + 20, 14, EASE_OUT_EXPO);

    return (
        <AbsoluteFill style={{ background: mixColor(COLORS.paper, COLORS.wash, ramp(frame, COMPUTE.exitStart, COMPUTE.exitEnd - COMPUTE.exitStart, EASE_IN_OUT_CUBIC)) }}>
            <Board frame={frame}>
                <RevealText
                    text={"Le code calcule.\nL'IA ne calcule rien."}
                    start={COMPUTE.headlineIn}
                    size={64}
                    marks={[{ words: [6], start: COMPUTE.headlineIn + 46, duration: 10 }]}
                    style={{ position: "absolute", left: LEDGER_LEFT, top: 128 }}
                    frame={frame}
                />
                {ROWS.map((row, index) => (
                    <LedgerRow key={row.key} frame={frame} y={ROW_TOP + index * ROW_STEP} label={row.label} origin={row.origin} formula={row.formula} value={row.value} at={row.at} />
                ))}
                <div style={{ position: "absolute", left: LEDGER_LEFT, top: SUM_Y, width: (LEDGER_RIGHT - LEDGER_LEFT) * sumDraw, height: 3, background: COLORS.ink }} />
                <LedgerRow frame={frame} y={TOTAL_Y} label="Budget tout compris" value={LEDGER.total} at={COMPUTE.totalRoll[0]} valueSize={54} labelSize={34} weight={800} highlight={fractionMark} />
                <LedgerRow frame={frame} y={RENT_Y} label="Loyer après travaux" origin="input" formula={`${LEDGER.rent} × 12 mois`} value={LEDGER.annualRent} at={COMPUTE.rentRow} highlight={fractionMark} />
                <CodePanel frame={frame} />
            </Board>
            <BigYield frame={frame} />
        </AbsoluteFill>
    );
}
