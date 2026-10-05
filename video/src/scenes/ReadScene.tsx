import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Marker } from "../components/Marker";
import { ReadingPanel, ROW_FRAMES, type RowState } from "../components/ReadingPanel";
import { RevealText } from "../components/RevealText";
import { ShutterBlur } from "../components/ShutterBlur";
import { Thread } from "../components/Thread";
import { World } from "../components/World";
import { LISTING_TEXT, MARKS, WRAP_KEEP, type MarkKey } from "../data/demo";
import { CHECK_POSE, READ_LAYOUT, READ_PUNCH_POSE } from "../layout";
import { EASE_IN_OUT_CUBIC, EASE_IN_OUT_QUART, EASE_OUT_CUBIC, EASE_OUT_EXPO } from "../lib/easing";
import { clamp01, lerp, poseAt, ramp } from "../lib/motion";
import { layoutMessage, locateExcerpt } from "../lib/text-layout";
import { READ } from "../timeline";
import { COLORS, FONTS } from "../theme";

const TEXT_STYLE = { fontSize: READ_LAYOUT.fontSize, fontWeight: 400 };
const TEXT_X = READ_LAYOUT.card.x + READ_LAYOUT.cardPadX;
const WORKS: MarkKey[] = ["windows", "painting", "flooring", "bathroom"];

const MARK_ROWS: Record<MarkKey, string[]> = {
    type: ["type"],
    area: ["area"],
    city: ["city"],
    price: ["price"],
    occupancy: ["occupancy"],
    condition: ["condition"],
    risk: ["risk"],
    windows: ["works"],
    painting: ["works"],
    flooring: ["works"],
    bathroom: ["works"],
};

const EMPTY_ROWS = ["energy", "condo", "tax"];
const LANDING = 18;

export function readRowStates(): Record<string, RowState> {
    const states: Record<string, RowState> = {};
    for (const mark of READ.marks) {
        const key = mark.key as MarkKey;
        MARK_ROWS[key].forEach((rowKey, order) => {
            if (rowKey === "works") {
                return;
            }
            const at = mark.frame + LANDING + order * 6;
            states[rowKey] = { valueAt: at, flashAt: at, portAt: at };
        });
    }
    // The first reading filled the room count without quoting a source: no thread, no port, the check catches it.
    const roomsAt = (READ.marks.find((mark) => mark.key === "type")?.frame ?? 0) + LANDING + 6;
    states.rooms = { valueAt: roomsAt, flashAt: roomsAt };
    const worksFrames = WORKS.map((key) => (READ.marks.find((mark) => mark.key === key)?.frame ?? 0) + LANDING);
    states.works = { chipsAt: worksFrames, flashAt: worksFrames[0], portAt: worksFrames[0] };
    EMPTY_ROWS.forEach((key, index) => {
        states[key] = { emptyAt: READ.empties[index] };
    });
    return states;
}

function rowPort(rowKey: string): { x: number; y: number } {
    const row = ROW_FRAMES[rowKey];
    return { x: READ_LAYOUT.panel.x + 12, y: row.top + Math.min(row.height, READ_LAYOUT.rowHeight) / 2 };
}

function ReadContent() {
    const frame = useCurrentFrame();
    const lines = useMemo(() => layoutMessage(LISTING_TEXT, [...Object.values(MARKS), ...WRAP_KEEP], READ_LAYOUT.card.width - READ_LAYOUT.cardPadX * 2, TEXT_STYLE, 600), []);
    const boxes = useMemo(
        () => Object.fromEntries((Object.keys(MARKS) as MarkKey[]).map((key) => [key, locateExcerpt(LISTING_TEXT, lines, MARKS[key], TEXT_STYLE)])) as Record<MarkKey, ReturnType<typeof locateExcerpt>>,
        [lines],
    );
    const cardHeight = READ_LAYOUT.textTop - READ_LAYOUT.card.y + lines.length * READ_LAYOUT.lineHeight + 34;
    const lineTop = (line: number) => READ_LAYOUT.textTop + line * READ_LAYOUT.lineHeight;

    const pose = poseAt(frame, [
        { frame: 0, pose: { x: 2000 } },
        { frame: READ.arriveEnd, pose: { x: 0 }, easing: EASE_OUT_CUBIC },
        { frame: READ.headlineOut, pose: {} },
        { frame: READ.headlineOut + 40, pose: READ_PUNCH_POSE, easing: EASE_IN_OUT_CUBIC },
        { frame: READ.zoomStart, pose: {} },
        { frame: READ.zoomEnd, pose: CHECK_POSE, easing: EASE_IN_OUT_QUART },
    ]);
    const cardFade = 1 - ramp(frame, READ.headlineOut, 34, EASE_IN_OUT_CUBIC);
    const threadsFade = 1 - ramp(frame, READ.headlineOut - 6, 24);
    const inkOverlay = ramp(frame, READ.zoomStart + 40, 76, EASE_IN_OUT_CUBIC);
    const headerOpacity = 1 - ramp(frame, READ.zoomStart + 10, 40);
    const scan = ramp(frame, READ.scanStart, READ.scanEnd - READ.scanStart, EASE_IN_OUT_CUBIC);
    const scanVisible = frame >= READ.scanStart && frame <= READ.scanEnd + 8;
    const textBottom = lineTop(lines.length);

    return (
        <AbsoluteFill style={{ background: COLORS.wash }}>
            <AbsoluteFill style={{ background: COLORS.ink, opacity: inkOverlay }} />
            <World pose={pose}>
                <div
                    style={{
                        position: "absolute",
                        left: READ_LAYOUT.card.x,
                        top: READ_LAYOUT.card.y,
                        width: READ_LAYOUT.card.width,
                        height: cardHeight,
                        background: COLORS.paper,
                        borderRadius: "24px 24px 24px 6px",
                        boxShadow: "0 2px 4px rgba(20, 32, 51, 0.05), 0 22px 60px rgba(20, 32, 51, 0.10)",
                        opacity: cardFade,
                    }}
                />
                <div style={{ opacity: cardFade }}>
                    <div style={{ position: "absolute", left: TEXT_X, top: 280, fontFamily: FONTS.sans, fontSize: 22, color: COLORS.slate }}>Message reçu d'un agent immobilier</div>
                    {READ.marks.map((mark, index) => {
                        const key = mark.key as MarkKey;
                        const box = boxes[key];
                        return (
                            <Marker
                                key={key}
                                x={TEXT_X + box.x - 3}
                                y={lineTop(box.line) + 6}
                                width={box.width + 6}
                                height={33}
                                seed={index + 11}
                                progress={ramp(frame, mark.frame, 11, EASE_OUT_EXPO)}
                                color={key === "risk" ? COLORS.watchSoft : COLORS.marker}
                            />
                        );
                    })}
                    {lines.map((line, index) => (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                left: TEXT_X,
                                top: lineTop(index),
                                height: READ_LAYOUT.lineHeight,
                                lineHeight: `${READ_LAYOUT.lineHeight}px`,
                                fontFamily: FONTS.sans,
                                fontSize: READ_LAYOUT.fontSize,
                                fontWeight: line.weight,
                                color: COLORS.ink,
                                whiteSpace: "pre",
                            }}
                        >
                            {line.text}
                        </div>
                    ))}
                    {scanVisible ? (
                        <>
                            <div
                                style={{
                                    position: "absolute",
                                    left: READ_LAYOUT.card.x + 18,
                                    width: READ_LAYOUT.card.width - 36,
                                    top: lerp(READ_LAYOUT.textTop - 70, textBottom, scan) - 70,
                                    height: 70,
                                    background: "linear-gradient(180deg, rgba(31, 79, 176, 0), rgba(31, 79, 176, 0.10))",
                                    opacity: 1 - clamp01((frame - READ.scanEnd) / 8),
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: READ_LAYOUT.card.x + 18,
                                    width: READ_LAYOUT.card.width - 36,
                                    top: lerp(READ_LAYOUT.textTop - 70, textBottom, scan),
                                    height: 3,
                                    borderRadius: 2,
                                    background: COLORS.plan,
                                    boxShadow: "0 0 18px 4px rgba(31, 79, 176, 0.45)",
                                    opacity: 1 - clamp01((frame - READ.scanEnd) / 8),
                                }}
                            />
                        </>
                    ) : null}
                </div>

                <ReadingPanel frame={frame} rows={readRowStates()} headerOpacity={headerOpacity} appear={ramp(frame, READ.panelIn, 30, EASE_OUT_EXPO)} />

                {READ.marks.flatMap((mark) => {
                    const key = mark.key as MarkKey;
                    const box = boxes[key];
                    const from = { x: TEXT_X + box.x + box.width + 4, y: lineTop(box.line) + 22 };
                    return MARK_ROWS[key].map((rowKey, order) => {
                        const start = mark.frame + 4 + order * 6;
                        const progress = ramp(frame, start, 14, EASE_IN_OUT_CUBIC);
                        const settle = 1 - 0.75 * ramp(frame, start + 30, 24);
                        return (
                            <Thread
                                key={`${key}-${rowKey}`}
                                from={from}
                                to={rowPort(rowKey)}
                                progress={progress}
                                landed={ramp(frame, start + 14, 10)}
                                color={key === "risk" ? COLORS.watch : COLORS.markerDeep}
                                opacity={settle * threadsFade}
                            />
                        );
                    });
                })}
            </World>

            <RevealText text="Chaque valeur relevée dans le texte." start={READ.headlineIn} exit={READ.headlineOut} size={56} style={{ position: "absolute", left: 90, top: 146 }} frame={frame} />
            <RevealText
                text={"Pas écrit ?\nPas deviné."}
                start={READ.punchIn[0]}
                exit={READ.zoomStart - 20}
                size={128}
                weight={800}
                lineHeight={1.02}
                letterSpacing="-0.045em"
                stagger={10}
                duration={30}
                marks={[{ words: [3], start: READ.punchMark, duration: 12 }]}
                style={{ position: "absolute", left: 90, top: 330 }}
                frame={frame}
            />
        </AbsoluteFill>
    );
}

export function ReadScene() {
    const frame = useCurrentFrame();
    if (frame <= READ.arriveEnd) {
        return (
            <ShutterBlur samples={14} shutterAngle={300}>
                <ReadContent />
            </ShutterBlur>
        );
    }
    return <ReadContent />;
}
