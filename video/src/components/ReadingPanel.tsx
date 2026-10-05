import { READ_ROWS } from "../data/demo";
import { READ_LAYOUT, readRowFrames } from "../layout";
import { EASE_OUT_EXPO } from "../lib/easing";
import { clamp01, pop, ramp, SPRING_POP, typed } from "../lib/motion";
import { COLORS, FONTS } from "../theme";
import { CheckIcon, CrossIcon } from "./Icons";

export type RowState = {
    valueAt?: number;
    flashAt?: number;
    portAt?: number;
    chipsAt?: number[];
    emptyAt?: number;
    status?: { at: number; ok: boolean; clearAt?: number };
    error?: { at: number; text: string; clearAt?: number };
    citation?: { at: number; text: string };
    blink?: { from: number; to: number };
};

type ReadingPanelProps = {
    frame: number;
    rows: Record<string, RowState>;
    headerOpacity?: number;
    appear?: number;
    panelShadow?: boolean;
    buildAt?: number;
};

const { panel, labelX, valueX, statusX } = READ_LAYOUT;
export const ROW_FRAMES = readRowFrames(READ_ROWS);

export function ReadingPanel({ frame, rows, headerOpacity = 1, appear = 1, panelShadow = true, buildAt = 18 }: ReadingPanelProps) {
    return (
        <>
            <div
                style={{
                    position: "absolute",
                    left: panel.x,
                    top: panel.y,
                    width: panel.width,
                    height: panel.height,
                    borderRadius: 18,
                    background: COLORS.ink,
                    boxShadow: panelShadow ? "0 30px 80px rgba(20, 32, 51, 0.28)" : undefined,
                    opacity: appear,
                    transform: `translateY(${(1 - appear) * 40}px)`,
                }}
            />
            <div style={{ position: "absolute", left: labelX, top: 276, opacity: headerOpacity * appear, fontFamily: FONTS.sans, fontSize: 27, fontWeight: 600, color: COLORS.nightInk }}>
                Lecture structurée
            </div>
            <div
                style={{
                    position: "absolute",
                    right: 1920 - (panel.x + panel.width - 36),
                    top: 278,
                    opacity: headerOpacity * appear,
                    padding: "4px 12px",
                    borderRadius: 8,
                    border: `1.5px solid ${COLORS.nightRule}`,
                    fontFamily: FONTS.mono,
                    fontSize: 19,
                    color: COLORS.nightSlate,
                    whiteSpace: "nowrap",
                }}
            >
                gpt-4o · JSON strict
            </div>
            <div style={{ position: "absolute", left: labelX, top: 334, width: panel.width - 80, height: 1.5, background: COLORS.nightRule, opacity: headerOpacity * appear }} />

            {READ_ROWS.map((row, index) => {
                const { top, height } = ROW_FRAMES[row.key];
                const state = rows[row.key] ?? {};
                const rowIn = ramp(frame, buildAt + index * 2, 20, EASE_OUT_EXPO) * appear;
                const flash = state.flashAt !== undefined && frame >= state.flashAt ? 1 - clamp01((frame - state.flashAt) / 26) : 0;
                const blinking = state.blink !== undefined && frame >= state.blink.from && frame < state.blink.to && Math.floor((frame - state.blink.from) / 6) % 2 === 0;
                const statusAmount = state.status ? ramp(frame, state.status.at, 12) * (state.status.clearAt !== undefined ? 1 - ramp(frame, state.status.clearAt, 8) : 1) : 0;
                const errorAmount = state.error ? ramp(frame, state.error.at, 10) * (state.error.clearAt !== undefined ? 1 - ramp(frame, state.error.clearAt, 8) : 1) : 0;
                const citationAmount = state.citation ? ramp(frame, state.citation.at, 16) : 0;
                const valueText = state.valueAt !== undefined ? typed(row.value, frame, state.valueAt, 1.3) : "";
                return (
                    <div key={row.key} style={{ position: "absolute", left: panel.x, top, width: panel.width, height, opacity: rowIn }}>
                        <div
                            style={{
                                position: "absolute",
                                left: 16,
                                right: 16,
                                top: 3,
                                bottom: 3,
                                borderRadius: 10,
                                background: blinking ? "rgba(255, 138, 122, 0.22)" : `rgba(255, 227, 90, ${0.16 * flash})`,
                            }}
                        />
                        <div style={{ position: "absolute", left: labelX - panel.x, top: 0, height: Math.min(height, READ_LAYOUT.rowHeight), display: "flex", alignItems: "center", fontFamily: FONTS.sans, fontSize: 24, fontWeight: 500, color: COLORS.nightSlate }}>
                            {row.label}
                        </div>
                        {state.portAt !== undefined && frame >= state.portAt ? (
                            <div
                                style={{
                                    position: "absolute",
                                    left: 6,
                                    top: Math.min(height, READ_LAYOUT.rowHeight) / 2 - 6,
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    background: row.tone === "watch" ? COLORS.nightWatch : COLORS.marker,
                                    transform: `scale(${pop(frame, state.portAt, SPRING_POP)})`,
                                }}
                            />
                        ) : null}
                        {row.chips ? (
                            <div style={{ position: "absolute", left: valueX - panel.x, top: 8, width: 470, display: "flex", flexWrap: "wrap", gap: "10px 10px" }}>
                                {row.chips.map((chip, chipIndex) => {
                                    const at = state.chipsAt?.[chipIndex];
                                    const shown = at !== undefined ? pop(frame, at, SPRING_POP) : 0;
                                    return (
                                        <span
                                            key={chip.mark}
                                            style={{
                                                padding: "3px 12px",
                                                borderRadius: 8,
                                                border: `1.5px solid ${COLORS.nightRule}`,
                                                background: COLORS.nightPaper,
                                                fontFamily: FONTS.mono,
                                                fontSize: 21,
                                                color: COLORS.nightInk,
                                                opacity: Math.min(1, shown * 1.5),
                                                transform: `scale(${0.6 + 0.4 * shown})`,
                                                transformOrigin: "left center",
                                            }}
                                        >
                                            {chip.label}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : null}
                        {row.empty && state.emptyAt !== undefined && frame >= state.emptyAt ? (
                            <div style={{ position: "absolute", left: valueX - panel.x, top: 8, height: 34, display: "flex", alignItems: "center", gap: 16 }}>
                                <div
                                    style={{
                                        height: 34,
                                        width: 104,
                                        borderRadius: 8,
                                        border: `2px dashed ${COLORS.nightSlate}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontFamily: FONTS.mono,
                                        fontSize: 20,
                                        color: COLORS.nightSlate,
                                        opacity: ramp(frame, state.emptyAt, 10),
                                        transform: `scale(${0.7 + 0.3 * pop(frame, state.emptyAt, SPRING_POP)})`,
                                    }}
                                >
                                    vide
                                </div>
                                <div
                                    style={{
                                        fontFamily: FONTS.sans,
                                        fontSize: 21,
                                        fontWeight: 600,
                                        color: COLORS.nightWatch,
                                        opacity: ramp(frame, state.emptyAt + 8, 12),
                                        transform: `translateX(${(1 - ramp(frame, state.emptyAt + 8, 16)) * -14}px)`,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    à demander à l'agent
                                </div>
                            </div>
                        ) : null}
                        {!row.chips && !row.empty ? (
                            <div
                                style={{
                                    position: "absolute",
                                    left: valueX - panel.x,
                                    top: 0,
                                    height,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 18,
                                    fontFamily: FONTS.mono,
                                    fontSize: 24,
                                    color: row.tone === "watch" ? COLORS.nightWatch : COLORS.nightInk,
                                    whiteSpace: "pre",
                                }}
                            >
                                <span>{valueText}</span>
                                {errorAmount > 0 && state.error ? (
                                    <span
                                        style={{
                                            padding: "3px 12px",
                                            borderRadius: 8,
                                            border: `1.5px solid ${COLORS.nightRefused}`,
                                            color: COLORS.nightRefused,
                                            fontSize: 19,
                                            opacity: errorAmount,
                                        }}
                                    >
                                        {typed(state.error.text, frame, state.error.at, 1.1)}
                                    </span>
                                ) : null}
                                {citationAmount > 0 && state.citation ? (
                                    <span style={{ color: COLORS.nightMarker, fontSize: 19, opacity: citationAmount, transform: `translateX(${(1 - citationAmount) * -12}px)` }}>
                                        « {state.citation.text} »
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                        {statusAmount > 0 && state.status ? (
                            <div style={{ position: "absolute", left: statusX - panel.x - 15, top: Math.min(height, READ_LAYOUT.rowHeight) / 2 - 15, opacity: Math.min(1, statusAmount * 2) }}>
                                {state.status.ok ? (
                                    <CheckIcon size={30} color={COLORS.nightMet} progress={statusAmount} strokeWidth={3.2} />
                                ) : (
                                    <CrossIcon size={30} color={COLORS.nightRefused} progress={statusAmount} strokeWidth={3.2} />
                                )}
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </>
    );
}
