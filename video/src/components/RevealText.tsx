import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { EASE_IN_CUBIC, EASE_OUT_EXPO } from "../lib/easing";
import { lerp, ramp } from "../lib/motion";
import { COLORS, FONTS } from "../theme";

export type TextMark = {
    words: number[];
    start: number;
    duration?: number;
    color?: string;
    ink?: string;
};

type RevealTextProps = {
    text: string;
    start: number;
    exit?: number;
    size: number;
    weight?: number;
    color?: string;
    lineHeight?: number;
    letterSpacing?: string;
    stagger?: number;
    duration?: number;
    exitStagger?: number;
    exitDuration?: number;
    align?: "left" | "center" | "right";
    font?: "sans" | "mono";
    tilt?: number;
    marks?: TextMark[];
    accent?: { words: number[]; color: string };
    weightFrom?: number;
    style?: CSSProperties;
    frame?: number;
};

const PAD_TOP = 0.24;
const PAD_BOTTOM = 0.22;

// Words rise out of individual masks; marks sweep a highlighter behind chosen words (indexes count across lines).
export function RevealText({
    text,
    start,
    exit,
    size,
    weight = 700,
    color = COLORS.ink,
    lineHeight = 1.04,
    letterSpacing = "-0.03em",
    stagger = 3,
    duration = 26,
    exitStagger = 2,
    exitDuration = 16,
    align = "left",
    font = "sans",
    tilt = 0,
    marks = [],
    accent,
    weightFrom,
    style,
    frame: frameOverride,
}: RevealTextProps) {
    const currentFrame = useCurrentFrame();
    const frame = frameOverride ?? currentFrame;
    const lines = text.split("\n").map((line) => line.split(" ").filter((word) => word.length > 0));
    const lineBox = size * lineHeight;
    const padTop = size * PAD_TOP;
    const padBottom = size * PAD_BOTTOM;
    const space = size * 0.27;
    let wordIndex = 0;

    return (
        <div
            style={{
                fontFamily: font === "mono" ? FONTS.mono : FONTS.sans,
                fontSize: size,
                fontWeight: weight,
                letterSpacing,
                color,
                ...style,
            }}
        >
            {lines.map((words, lineIndex) => (
                <div
                    key={lineIndex}
                    style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
                        height: lineBox,
                    }}
                >
                    {words.map((word, indexInLine) => {
                        const index = wordIndex;
                        wordIndex += 1;
                        const isLast = indexInLine === words.length - 1;
                        const enter = ramp(frame, start + index * stagger, duration, EASE_OUT_EXPO);
                        const leave = exit === undefined ? 0 : ramp(frame, exit + index * exitStagger, exitDuration, EASE_IN_CUBIC);
                        const rise = (1 - enter) * 140 - leave * 140;
                        const mark = marks.find((item) => item.words.includes(index));
                        const markOrder = mark ? mark.words.indexOf(index) : 0;
                        const markDuration = mark?.duration ?? 9;
                        const markProgress = mark ? ramp(frame, mark.start + markOrder * markDuration * 0.75, markDuration, EASE_OUT_EXPO) : 0;
                        const continuesMark = mark !== undefined && mark.words.includes(index + 1) && !isLast;
                        const accentColor = accent?.words.includes(index) ? accent.color : undefined;
                        const wordColor = mark && markProgress > 0.45 ? (mark.ink ?? COLORS.ink) : accentColor ?? color;
                        return (
                            <span
                                key={indexInLine}
                                style={{
                                    position: "relative",
                                    display: "block",
                                    overflow: "hidden",
                                    height: lineBox + padTop + padBottom,
                                    marginTop: -padTop,
                                    paddingTop: padTop,
                                    paddingLeft: size * 0.04,
                                    paddingRight: continuesMark ? space + size * 0.04 : size * 0.04,
                                    marginLeft: -size * 0.04,
                                    marginRight: continuesMark || isLast ? -size * 0.04 : space - size * 0.04,
                                }}
                            >
                                <span
                                    style={{
                                        position: "relative",
                                        display: "block",
                                        transform: `translateY(${rise}%) rotate(${tilt * (1 - enter)}deg)`,
                                        transformOrigin: "left bottom",
                                    }}
                                >
                                    {markProgress > 0 ? (
                                        <span
                                            style={{
                                                position: "absolute",
                                                left: -size * 0.03,
                                                right: continuesMark ? -space : -size * 0.03,
                                                top: lineBox * 0.1,
                                                height: lineBox * 0.86,
                                                background: mark?.color ?? COLORS.marker,
                                                transform: `scaleX(${markProgress})`,
                                                transformOrigin: "left center",
                                                borderRadius: size * 0.04,
                                            }}
                                        />
                                    ) : null}
                                    <span
                                        style={{
                                            position: "relative",
                                            display: "block",
                                            lineHeight: `${lineBox}px`,
                                            whiteSpace: "pre",
                                            color: wordColor,
                                            fontVariationSettings: weightFrom === undefined ? undefined : `"wght" ${lerp(weightFrom, weight, enter)}`,
                                        }}
                                    >
                                        {word}
                                    </span>
                                </span>
                            </span>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
