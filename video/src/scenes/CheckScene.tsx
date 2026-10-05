import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CheckIcon, CrossIcon, LoopArrowIcon } from "../components/Icons";
import { ReadingPanel, ROW_FRAMES, type RowState } from "../components/ReadingPanel";
import { RevealText } from "../components/RevealText";
import { Stamp } from "../components/Stamp";
import { World } from "../components/World";
import { MARKS, READ_ROWS, REFUSED_ROW } from "../data/demo";
import { CHECK_POSE, READ_LAYOUT } from "../layout";
import { EASE_IN_OUT_CUBIC, EASE_IN_OUT_EXPO, EASE_OUT_EXPO } from "../lib/easing";
import { clamp01, drift, lerp, ramp, REST_POSE, shake } from "../lib/motion";
import { CHECK } from "../timeline";
import { COLORS, FONTS } from "../theme";

const CHECKS = ["Format strict, champ par champ", "Citations retrouvées mot pour mot", "Une valeur, une citation"];
const PANEL_X = 1190;
const STAMP_CENTER = { x: 640, y: 560 };
const FIRST_ROW = READ_LAYOUT.rowTop;
const LAST_ROW = READ_LAYOUT.panel.y + READ_LAYOUT.panel.height - 22;

function passFrame(rowKey: string, scan: number[]): number {
    const { top, height } = ROW_FRAMES[rowKey];
    const middle = top + Math.min(height, READ_LAYOUT.rowHeight) / 2;
    return Math.round(lerp(scan[0], scan[1], (middle - FIRST_ROW) / (LAST_ROW - FIRST_ROW)));
}

function rowStates(): Record<string, RowState> {
    const states: Record<string, RowState> = {};
    for (const row of READ_ROWS) {
        const refused = row.key === REFUSED_ROW;
        const hasSource = !row.empty && !refused;
        const state: RowState = {
            valueAt: -999,
            portAt: hasSource ? -999 : undefined,
            chipsAt: row.chips ? row.chips.map(() => -999) : undefined,
            emptyAt: row.empty ? -999 : undefined,
            status: { at: passFrame(row.key, CHECK.scanOne), ok: !refused, clearAt: CHECK.loopEnd },
        };
        if (refused) {
            state.error = { at: CHECK.errorAt, text: "Valeur sans citation", clearAt: CHECK.loopEnd };
            state.blink = { from: CHECK.errorAt, to: CHECK.errorAt + 36 };
            state.citation = { at: CHECK.flip + 14, text: MARKS.type };
            state.portAt = CHECK.flip + 14;
        }
        states[row.key] = state;
    }
    return states;
}

// The second pass re-checks every row; statuses from the first pass have been cleared by then.
function secondPass(states: Record<string, RowState>, frame: number): Record<string, RowState> {
    if (frame < CHECK.loopEnd + 8) {
        return states;
    }
    const next: Record<string, RowState> = {};
    for (const [key, state] of Object.entries(states)) {
        next[key] = { ...state, status: { at: passFrame(key, CHECK.scanTwo), ok: true } };
    }
    return next;
}

function ScanLine({ frame, window }: { frame: number; window: number[] }) {
    if (frame < window[0] - 4 || frame > window[1] + 10) {
        return null;
    }
    const amount = ramp(frame, window[0], window[1] - window[0], EASE_IN_OUT_CUBIC);
    const y = lerp(FIRST_ROW - 10, LAST_ROW + 10, amount);
    const fade = 1 - clamp01((frame - window[1]) / 10);
    return (
        <>
            <div style={{ position: "absolute", left: READ_LAYOUT.panel.x + 10, width: READ_LAYOUT.panel.width - 20, top: y - 56, height: 56, background: "linear-gradient(180deg, rgba(132, 169, 247, 0), rgba(132, 169, 247, 0.14))", opacity: fade }} />
            <div style={{ position: "absolute", left: READ_LAYOUT.panel.x + 10, width: READ_LAYOUT.panel.width - 20, top: y, height: 3, borderRadius: 2, background: COLORS.nightPlan, boxShadow: "0 0 22px 6px rgba(132, 169, 247, 0.45)", opacity: fade }} />
        </>
    );
}

function Checklist({ frame }: { frame: number }) {
    return (
        <div style={{ position: "absolute", left: PANEL_X, top: 430 }}>
            {CHECKS.map((label, index) => {
                const appear = ramp(frame, CHECK.checksIn[index], 22, EASE_OUT_EXPO);
                const firstAt = CHECK.verdictsOne[index];
                const secondAt = CHECK.verdictsTwo[index];
                const failed = index === 2;
                const first = ramp(frame, firstAt, 12) * (1 - ramp(frame, CHECK.loopEnd, 8));
                const second = ramp(frame, secondAt, 12);
                return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 20, height: 66, opacity: appear, transform: `translateX(${(1 - appear) * 30}px)` }}>
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                border: `2px solid ${second > 0 ? COLORS.nightMet : failed && first > 0 ? COLORS.nightRefused : COLORS.nightRule}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {second > 0 ? (
                                <CheckIcon size={30} color={COLORS.nightMet} progress={second} strokeWidth={3.2} />
                            ) : first > 0 ? (
                                failed ? <CrossIcon size={30} color={COLORS.nightRefused} progress={first} strokeWidth={3.2} /> : <CheckIcon size={30} color={COLORS.nightMet} progress={first} strokeWidth={3.2} />
                            ) : null}
                        </div>
                        <div style={{ fontFamily: FONTS.sans, fontSize: 29, fontWeight: 500, color: COLORS.nightInk, whiteSpace: "nowrap" }}>{label}</div>
                    </div>
                );
            })}
        </div>
    );
}

function AttemptChip({ frame }: { frame: number }) {
    const roll = ramp(frame, CHECK.flip, 18, EASE_OUT_EXPO);
    const appear = ramp(frame, CHECK.chipIn, 20, EASE_OUT_EXPO);
    const loop = ramp(frame, CHECK.loopStart, CHECK.loopEnd - CHECK.loopStart, EASE_IN_OUT_CUBIC);
    const loopVisible = frame >= CHECK.loopStart && frame < CHECK.scanTwo[1];
    const loopFade = 1 - ramp(frame, CHECK.flip + 30, 20);
    return (
        <div style={{ position: "absolute", left: PANEL_X, top: 336, display: "flex", alignItems: "center", gap: 18, opacity: appear }}>
            <div style={{ position: "relative", height: 48, width: 190, borderRadius: 12, border: `1.5px solid ${COLORS.nightRule}`, background: COLORS.nightPaper, overflow: "hidden" }}>
                {["Lecture 1", "Lecture 2"].map((label, index) => (
                    <div
                        key={label}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: FONTS.mono,
                            fontSize: 24,
                            fontWeight: 600,
                            color: COLORS.nightInk,
                            transform: `translateY(${(index === 0 ? -roll : 1 - roll) * 100}%)`,
                        }}
                    >
                        {label}
                    </div>
                ))}
            </div>
            {loopVisible ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: loopFade }}>
                    <LoopArrowIcon size={40} color={COLORS.nightRefused} progress={loop} />
                    <div style={{ fontFamily: FONTS.sans, fontSize: 24, color: COLORS.nightSlate, opacity: ramp(frame, CHECK.loopStart + 10, 16), whiteSpace: "nowrap" }}>renvoyée au modèle avec l'erreur</div>
                </div>
            ) : null}
        </div>
    );
}

export function CheckScene() {
    const frame = useCurrentFrame();
    const hitOne = shake(frame, CHECK.stampOne, 16, 14, "stamp-one");
    const hitTwo = shake(frame, CHECK.stampTwo, 16, 10, "stamp-two");
    const pose = {
        ...REST_POSE,
        ...CHECK_POSE,
        x: CHECK_POSE.x + hitOne.x + hitTwo.x + drift("check-x", frame, 0.004, 6),
        y: CHECK_POSE.y + hitOne.y + hitTwo.y + drift("check-y", frame, 0.004, 5),
    };
    const states = secondPass(rowStates(), frame);
    const iris = ramp(frame, CHECK.irisStart, CHECK.irisEnd - CHECK.irisStart, EASE_IN_OUT_EXPO);

    return (
        <AbsoluteFill style={{ background: COLORS.ink }}>
            <World pose={pose}>
                <ReadingPanel frame={frame} rows={states} headerOpacity={0} buildAt={-999} panelShadow={false} />
                <ScanLine frame={frame} window={CHECK.scanOne} />
                <ScanLine frame={frame} window={CHECK.scanTwo} />
            </World>
            <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 40% 50%, rgba(0, 0, 0, 0) 55%, rgba(5, 8, 14, 0.55) 100%)" }} />

            <RevealText
                text={"Une valeur sans\nsource est refusée."}
                start={CHECK.headlineIn}
                size={56}
                color={COLORS.nightInk}
                lineHeight={1.06}
                style={{ position: "absolute", left: PANEL_X, top: 150 }}
                frame={frame}
            />
            <AttemptChip frame={frame} />
            <Checklist frame={frame} />
            <RevealText
                text={"Nouvelle lecture automatique,\n3 au plus."}
                start={CHECK.footnoteIn}
                size={27}
                weight={500}
                lineHeight={1.3}
                letterSpacing="-0.01em"
                color={COLORS.nightSlate}
                stagger={2}
                style={{ position: "absolute", left: PANEL_X, top: 668 }}
                frame={frame}
            />

            <Stamp text="Lecture 1 refusée" color={COLORS.nightRefused} start={CHECK.stampOne} exit={CHECK.loopStart - 8} frame={frame} x={STAMP_CENTER.x} y={STAMP_CENTER.y} rotate={-8} size={58} background="rgba(20, 32, 51, 0.95)" />
            <Stamp text="Acceptée" color={COLORS.nightMet} start={CHECK.stampTwo} frame={frame} x={STAMP_CENTER.x} y={STAMP_CENTER.y} rotate={-6} size={80} background="rgba(20, 32, 51, 0.95)" />

            {iris > 0 ? (
                <AbsoluteFill style={{ background: COLORS.paper, clipPath: `circle(${lerp(0, 2300, iris)}px at ${STAMP_CENTER.x}px ${STAMP_CENTER.y}px)` }} />
            ) : null}
        </AbsoluteFill>
    );
}
