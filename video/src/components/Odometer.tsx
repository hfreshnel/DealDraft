import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { EASE_OUT_QUART, LINEAR } from "../lib/easing";
import { ramp } from "../lib/motion";
import { textWidth } from "../lib/text-layout";
import { COLORS, FONTS } from "../theme";

export const BLUR_LEVELS = 8;

// Vertical-only Gaussian blurs, referenced by spinning digits to fake a shutter.
export function MotionBlurDefs() {
    return (
        <svg width={0} height={0} style={{ position: "absolute" }}>
            <defs>
                {Array.from({ length: BLUR_LEVELS }, (_, index) => (
                    <filter key={index} id={`vblur${index + 1}`} x="-10%" y="-50%" width="120%" height="200%">
                        <feGaussianBlur stdDeviation={`0 ${(index + 1) * 1.6}`} />
                    </filter>
                ))}
            </defs>
        </svg>
    );
}

type OdometerProps = {
    value: string;
    start: number;
    duration?: number;
    size: number;
    weight?: number;
    color?: string;
    stagger?: number;
    letterSpacing?: string;
    style?: CSSProperties;
    frame?: number;
};

function positionAt(frame: number, start: number, duration: number, steps: number): number {
    return steps * ramp(frame, start, duration, EASE_OUT_QUART);
}

// Layout width of a counter at rest: tabular digits, proportional punctuation.
export function odometerWidth(value: string, size: number, weight: number, letterSpacing: string): number {
    const cell = textWidth("0", { fontSize: size, fontWeight: weight, letterSpacing, fontVariantNumeric: "tabular-nums" });
    return Array.from(value).reduce((sum, char) => sum + (/\d/.test(char) ? cell : textWidth(char, { fontSize: size, fontWeight: weight, letterSpacing })), 0);
}

// Each digit spins on its own drum; digits further right spin more, like a mechanical counter.
export function Odometer({ value, start, duration = 48, size, weight = 700, color = COLORS.ink, stagger = 3, letterSpacing = "-0.02em", style, frame: frameOverride }: OdometerProps) {
    const currentFrame = useCurrentFrame();
    const frame = frameOverride ?? currentFrame;
    const chars = Array.from(value);
    const digitIndexes = chars.map((char, index) => (/\d/.test(char) ? index : -1)).filter((index) => index >= 0);
    const cell = textWidth("0", { fontSize: size, fontWeight: weight, letterSpacing, fontVariantNumeric: "tabular-nums" });
    const staticIn = ramp(frame, start, duration * 0.45);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                fontFamily: FONTS.sans,
                fontSize: size,
                fontWeight: weight,
                letterSpacing,
                color,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                opacity: ramp(frame, start - 1, 6, LINEAR),
                ...style,
            }}
        >
            {chars.map((char, index) => {
                if (!/\d/.test(char)) {
                    return (
                        <span
                            key={index}
                            style={{
                                display: "block",
                                height: "1.08em",
                                lineHeight: "1.08em",
                                whiteSpace: "pre",
                                fontVariantNumeric: "normal",
                                opacity: staticIn,
                                transform: `translateY(${(1 - staticIn) * 0.4}em)`,
                            }}
                        >
                            {char}
                        </span>
                    );
                }
                const order = digitIndexes.indexOf(index);
                const steps = Number(char) + 10 * (order + 1);
                const digitStart = start + order * stagger;
                const position = positionAt(frame, digitStart, duration, steps);
                const speed = Math.abs(position - positionAt(frame - 1, digitStart, duration, steps)) * size;
                const blurLevel = Math.min(BLUR_LEVELS, Math.round(speed / 9));
                // Tabular figures give every drum the same width, so the counter at rest lays out like plain text.
                return (
                    <span key={index} style={{ display: "block", position: "relative", width: cell, height: "1.08em", overflow: "hidden" }}>
                        <span
                            style={{
                                display: "block",
                                transform: `translateY(${-position * 1.08}em)`,
                                filter: blurLevel > 0 ? `url(#vblur${blurLevel})` : undefined,
                            }}
                        >
                            {Array.from({ length: steps + 1 }, (_, step) => (
                                <span key={step} style={{ display: "block", height: "1.08em", lineHeight: "1.08em", textAlign: "center" }}>
                                    {step % 10}
                                </span>
                            ))}
                        </span>
                    </span>
                );
            })}
        </div>
    );
}
