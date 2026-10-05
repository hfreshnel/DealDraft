import { evolvePath } from "@remotion/paths";
import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CheckIcon } from "../components/Icons";
import { Marker } from "../components/Marker";
import { Odometer, odometerWidth } from "../components/Odometer";
import { RevealText } from "../components/RevealText";
import { Vignette } from "../components/Grain";
import { INJECTION_SNIPPET, PROOF_STATS } from "../data/demo";
import { END_MARK, wordmarkLayout } from "../layout";
import { EASE_IN_CUBIC, EASE_IN_OUT_CUBIC, EASE_IN_OUT_EXPO, EASE_OUT_EXPO } from "../lib/easing";
import { lerp, ramp } from "../lib/motion";
import { PROOF } from "../timeline";
import { COLORS, FONTS } from "../theme";

const CARD = { width: 840, height: 300 };
const POSITIONS = [
    { x: 90, y: 236 },
    { x: 990, y: 236 },
    { x: 90, y: 576 },
    { x: 990, y: 576 },
];
const NUMBER = { size: 150, top: 26, left: 40 };
const ZERO_PATH = "M 50 8 A 42 62 0 0 1 50 132 A 42 62 0 0 1 50 8";
const RING = { cx: 724, cy: 150, r: 80, stroke: 16 };
const RING_LENGTH = 2 * Math.PI * RING.r;

function Card({ index, frame, children }: { index: number; frame: number; children: ReactNode }) {
    const appear = ramp(frame, PROOF.cards[index], 28, EASE_OUT_EXPO);
    const leave = ramp(frame, PROOF.exitStart + index * 3, 18, EASE_IN_CUBIC);
    if (appear <= 0 || leave >= 1) {
        return null;
    }
    const { x, y } = POSITIONS[index];
    return (
        <div
            style={{
                position: "absolute",
                left: x,
                top: y,
                width: CARD.width,
                height: CARD.height,
                borderRadius: 22,
                background: COLORS.nightPaper,
                border: `1.5px solid ${COLORS.nightRule}`,
                boxSizing: "border-box",
                overflow: "hidden",
                clipPath: `inset(${(1 - appear) * 100}% 0 0 0 round 22px)`,
                opacity: 1 - leave,
                transform: `translateY(${(1 - appear) * 30}px) scale(${1 - leave * 0.06})`,
            }}
        >
            {children}
        </div>
    );
}

function Label({ text, sub, color = COLORS.nightInk }: { text: string; sub?: string; color?: string }) {
    return (
        <div style={{ position: "absolute", left: 44, top: 192 }}>
            <div style={{ fontFamily: FONTS.sans, fontSize: 36, fontWeight: 600, color, letterSpacing: "-0.01em" }}>{text}</div>
            {sub ? <div style={{ fontFamily: FONTS.sans, fontSize: 24, color: COLORS.nightSlate, marginTop: 4 }}>{sub}</div> : null}
        </div>
    );
}

function Figure({ value, frame, start }: { value: string; frame: number; start: number }) {
    return (
        <div style={{ position: "absolute", left: NUMBER.left, top: NUMBER.top }}>
            <Odometer value={value} start={start + 4} duration={40} size={NUMBER.size} weight={800} color={COLORS.nightInk} letterSpacing="-0.04em" frame={frame} stagger={3} />
        </div>
    );
}

function costMarkerRect(): { x: number; y: number; width: number; height: number } {
    const width = odometerWidth(PROOF_STATS.cost, NUMBER.size, 800, "-0.04em");
    // An underline below the digits: a highlight across light figures would not read on the dark set.
    return { x: POSITIONS[3].x + NUMBER.left - 6, y: POSITIONS[3].y + NUMBER.top + NUMBER.size * 0.94, width: width + 12, height: NUMBER.size * 0.13 };
}

export function ProofScene() {
    const frame = useCurrentFrame();
    const accuracy = Number(PROOF_STATS.accuracy.test.replace(",", ".").replace(/[^\d.]/g, "")) / 100;
    const bar = ramp(frame, PROOF.cards[0] + 10, 50, EASE_IN_OUT_CUBIC) * accuracy;
    const zero = ramp(frame, PROOF.cards[1] + 8, 36, EASE_IN_OUT_CUBIC);
    const zeroPath = evolvePath(Math.max(0.001, zero), ZERO_PATH);
    const lock = ramp(frame, PROOF.lockFrame, 24, EASE_IN_OUT_CUBIC);
    const lockFrame = `M 14 2 H 356 A 12 12 0 0 1 368 14 V 176 A 12 12 0 0 1 356 188 H 14 A 12 12 0 0 1 2 176 V 14 A 12 12 0 0 1 14 2 Z`;
    const lockPath = evolvePath(Math.max(0.001, lock), lockFrame);
    const traps = PROOF_STATS.traps.test.replace(/\s*sur\s*/, "/");

    const markRect = costMarkerRect();
    const endLayout = wordmarkLayout(END_MARK.fontSize, END_MARK.glyphHeight, 960, END_MARK.centerY);
    const target = endLayout.barAt(endLayout.centeredGlyphLeft);
    const travel = ramp(frame, PROOF.exitStart, 36, EASE_IN_OUT_EXPO);
    const iris = ramp(frame, PROOF.exitStart + 10, PROOF.exitEnd - PROOF.exitStart - 10, EASE_IN_OUT_EXPO);
    const travelling = frame >= PROOF.exitStart;

    return (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 80% at 50% 45%, ${COLORS.nightPaper} 0%, ${COLORS.night} 75%)` }}>
            <Vignette opacity={0.7} />
            <RevealText text="Mesuré, pas promis." start={PROOF.headlineIn} exit={PROOF.exitStart} size={64} color={COLORS.nightInk} style={{ position: "absolute", left: 90, top: 96 }} frame={frame} />

            <Card index={0} frame={frame}>
                <Figure value={PROOF_STATS.accuracy.test} frame={frame} start={PROOF.cards[0]} />
                <Label text="de valeurs justes" sub={PROOF_STATS.accuracy.detail} />
                <svg width={CARD.width} height={CARD.height} style={{ position: "absolute", left: 0, top: 0 }}>
                    <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke={COLORS.nightRule} strokeWidth={RING.stroke} />
                    <circle
                        cx={RING.cx}
                        cy={RING.cy}
                        r={RING.r}
                        fill="none"
                        stroke={COLORS.nightMet}
                        strokeWidth={RING.stroke}
                        strokeLinecap="round"
                        strokeDasharray={RING_LENGTH}
                        strokeDashoffset={RING_LENGTH * (1 - bar)}
                        transform={`rotate(-90 ${RING.cx} ${RING.cy})`}
                    />
                </svg>
                <div style={{ position: "absolute", left: RING.cx - 30, top: RING.cy - 30 }}>
                    <CheckIcon size={60} color={COLORS.nightMet} progress={ramp(frame, PROOF.cards[0] + 58, 14)} strokeWidth={3} />
                </div>
            </Card>

            <Card index={1} frame={frame}>
                <svg width={100 * (NUMBER.size / 140)} height={NUMBER.size} viewBox="0 0 100 140" style={{ position: "absolute", left: NUMBER.left + 6, top: NUMBER.top + 8, overflow: "visible" }}>
                    <path d={ZERO_PATH} fill="none" stroke={COLORS.nightInk} strokeWidth={19} strokeLinecap="round" strokeDasharray={zeroPath.strokeDasharray} strokeDashoffset={zeroPath.strokeDashoffset} />
                </svg>
                <Label text="valeur inventée" sub="sur le prix, la surface ou le loyer" />
            </Card>

            <Card index={2} frame={frame}>
                <Figure value={traps} frame={frame} start={PROOF.cards[2]} />
                <Label text="pièges déjoués" sub="dont une consigne cachée" />
                <div style={{ position: "absolute", left: 430, top: 36, width: 370, height: 190 }}>
                    <svg width={370} height={190} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                        <path d={lockFrame} fill={lock > 0 ? `rgba(240, 184, 96, ${0.08 * lock})` : "none"} stroke={COLORS.nightWatch} strokeWidth={2.5} strokeDasharray={lock >= 1 ? "9 7" : lockPath.strokeDasharray} strokeDashoffset={lock >= 1 ? 0 : lockPath.strokeDashoffset} />
                    </svg>
                    <div style={{ position: "absolute", left: 22, top: 22, right: 22, fontFamily: FONTS.mono, fontSize: 21, lineHeight: 1.45, color: COLORS.nightSlate, opacity: ramp(frame, PROOF.cards[2] + 14, 20) }}>
                        « {INJECTION_SNIPPET} »
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            left: 22,
                            bottom: 18,
                            padding: "5px 14px",
                            borderRadius: 999,
                            background: "rgba(240, 184, 96, 0.16)",
                            color: COLORS.nightWatch,
                            fontFamily: FONTS.sans,
                            fontSize: 20,
                            fontWeight: 700,
                            opacity: ramp(frame, PROOF.lockFrame + 18, 14),
                            transform: `translateY(${(1 - ramp(frame, PROOF.lockFrame + 18, 18, EASE_OUT_EXPO)) * 10}px)`,
                        }}
                    >
                        lue comme une donnée
                    </div>
                </div>
            </Card>

            <Card index={3} frame={frame}>
                {!travelling ? (
                    <Marker
                        x={markRect.x - POSITIONS[3].x}
                        y={markRect.y - POSITIONS[3].y}
                        width={markRect.width}
                        height={markRect.height}
                        progress={ramp(frame, PROOF.finalMark, 14, EASE_OUT_EXPO)}
                        seed={31}
                        color={COLORS.marker}
                    />
                ) : null}
                <Figure value={PROOF_STATS.cost} frame={frame} start={PROOF.cards[3]} />
                <Label text="par étude" sub="en coût d'IA" />
            </Card>

            <div style={{ position: "absolute", left: 90, top: 940, fontFamily: FONTS.sans, fontSize: 24, color: COLORS.nightSlate, opacity: ramp(frame, PROOF.finePrintIn, 20) * (1 - ramp(frame, PROOF.exitStart, 16)) }}>
                {PROOF_STATS.finePrint}
            </div>

            {iris > 0 ? (
                <AbsoluteFill
                    style={{
                        background: COLORS.paper,
                        clipPath: `circle(${lerp(0, 2300, iris)}px at ${target.x + target.width / 2}px ${target.y + target.height / 2}px)`,
                    }}
                />
            ) : null}
            {travelling ? (
                <div
                    style={{
                        position: "absolute",
                        left: lerp(markRect.x, target.x, travel),
                        top: lerp(markRect.y, target.y, travel),
                        width: lerp(markRect.width, target.width, travel),
                        height: lerp(markRect.height, target.height, travel),
                        background: COLORS.marker,
                        borderRadius: lerp(6, 0, travel),
                    }}
                />
            ) : null}
        </AbsoluteFill>
    );
}
