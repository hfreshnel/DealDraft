import { AbsoluteFill, useCurrentFrame } from "remotion";
import { NoiseCard } from "../components/NoiseCard";
import { RevealText } from "../components/RevealText";
import { World } from "../components/World";
import { NOISE_FRAGMENTS, NOISE_ITEMS } from "../data/demo";
import { EASE_IN_OUT_CUBIC, EASE_IN_OUT_QUART } from "../lib/easing";
import { clamp01, drift, lerp, pop, ramp, shake, SPRING_POP } from "../lib/motion";
import { mulberry32, NOISE, NOISE_BUBBLES } from "../timeline";
import { COLORS, FONTS } from "../theme";

const PERSPECTIVE = 1400;
const LAYERS = [
    { z: 0, opacity: 1, blur: 0 },
    { z: -560, opacity: 0.7, blur: 1.4 },
    { z: -1250, opacity: 0.42, blur: 3 },
];

const TITLES = ["Un message\nd'agent.", "Des notes\nde visite.", "Des chiffres\népars.", "Une étude\nde rendement\nà chiffrer."];
const TITLE_SIZE = 116;

const FRAGMENT_SPOTS = (() => {
    const random = mulberry32(42);
    return NOISE_FRAGMENTS.map((text, index) => ({
        text,
        x: 980 + random() * 640,
        y: 150 + index * 130 + random() * 40,
        spin: (random() - 0.5) * 14,
    }));
})();

function planeCoordinate(screen: number, center: number, z: number): number {
    return center + (screen - center) * ((PERSPECTIVE - z) / PERSPECTIVE);
}

function Bubbles({ frame, settled, layerIndex }: { frame: number; settled: number; layerIndex: number }) {
    const layer = LAYERS[layerIndex];
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                transform: `translateZ(${layer.z}px)`,
                opacity: layer.opacity,
                filter: layer.blur > 0 ? `blur(${layer.blur}px)` : undefined,
            }}
        >
            {NOISE_BUBBLES.filter((bubble) => bubble.layer === layerIndex && frame >= bubble.frame).map((bubble) => {
                const item = NOISE_ITEMS[bubble.index % NOISE_ITEMS.length];
                const appear = pop(frame, bubble.frame, SPRING_POP);
                const x = planeCoordinate(bubble.x, 960, layer.z) + drift(`bx${bubble.index}`, settled, 0.012, 10);
                const y = planeCoordinate(bubble.y, 540, layer.z) + drift(`by${bubble.index}`, settled, 0.012, 12);
                const ping = clamp01((frame - bubble.frame) / 22);
                return (
                    <div
                        key={bubble.index}
                        style={{
                            position: "absolute",
                            left: x,
                            top: y,
                            transform: `translate(-50%, -50%) translateY(${(1 - appear) * 34}px) scale(${lerp(0.72, 1, appear)}) rotate(${drift(`br${bubble.index}`, settled, 0.01, 2.2)}deg)`,
                            opacity: clamp01((frame - bubble.frame) / 5),
                        }}
                    >
                        <NoiseCard item={item} seed={bubble.index + 1} />
                        {layerIndex < 2 && ping < 1 ? (
                            <div
                                style={{
                                    position: "absolute",
                                    right: -18 - ping * 30,
                                    top: -18 - ping * 30,
                                    width: 36 + ping * 60,
                                    height: 36 + ping * 60,
                                    borderRadius: "50%",
                                    border: `3px solid ${COLORS.nightMarker}`,
                                    opacity: 0.8 * (1 - ping),
                                }}
                            />
                        ) : null}
                        {layerIndex < 2 ? (
                            <div
                                style={{
                                    position: "absolute",
                                    right: -8,
                                    top: -8,
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    background: COLORS.nightMarker,
                                    transform: `scale(${pop(frame, bubble.frame + 3, SPRING_POP)})`,
                                }}
                            />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

function Fragments({ frame, settled }: { frame: number; settled: number }) {
    return (
        <>
            {FRAGMENT_SPOTS.map((spot, index) => {
                const start = NOISE.fragmentsIn[index];
                if (frame < start) {
                    return null;
                }
                const appear = pop(frame, start, SPRING_POP);
                const life = clamp01((settled - start) / 160);
                const z = lerp(60, 320, life);
                return (
                    <div
                        key={spot.text}
                        style={{
                            position: "absolute",
                            left: spot.x + drift(`fx${index}`, settled, 0.01, 18),
                            top: spot.y + drift(`fy${index}`, settled, 0.01, 14),
                            transform: `translate(-50%, -50%) translateZ(${z}px) rotate(${spot.spin * (1 - life * 0.5)}deg) scale(${appear})`,
                            padding: "12px 22px",
                            borderRadius: 12,
                            border: `2px dashed ${COLORS.nightMarker}`,
                            background: "rgba(7, 11, 18, 0.88)",
                            color: COLORS.nightMarker,
                            fontFamily: FONTS.mono,
                            fontSize: 32,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
                        }}
                    >
                        {spot.text}
                    </div>
                );
            })}
        </>
    );
}

function Whip({ frame }: { frame: number }) {
    if (frame < NOISE.whipStart) {
        return null;
    }
    const amount = ramp(frame, NOISE.whipStart, NOISE.whipEnd - NOISE.whipStart, EASE_IN_OUT_QUART);
    const lead = lerp(-600, 2500, amount);
    const slant = 460;
    const streak = 260;
    return (
        <AbsoluteFill>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: COLORS.marker,
                    clipPath: `polygon(-10px 0, ${lead}px 0, ${lead - slant}px 1080px, -10px 1080px)`,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(90deg, rgba(255, 227, 90, 0.85), rgba(255, 227, 90, 0))`,
                    clipPath: `polygon(${lead}px 0, ${lead + streak}px 0, ${lead + streak - slant}px 1080px, ${lead - slant}px 1080px)`,
                }}
            />
        </AbsoluteFill>
    );
}

export function NoiseScene() {
    const frame = useCurrentFrame();
    const settled = Math.min(frame, NOISE.freeze);
    const journey = EASE_IN_OUT_CUBIC(clamp01(settled / NOISE.freeze));
    const kick = shake(frame, NOISE.whipStart, 18, 10, "noise-kick");
    const pose = {
        x: drift("cam-x", settled, 0.004, 22) + kick.x,
        y: drift("cam-y", settled, 0.004, 14) + kick.y,
        z: lerp(0, 190, journey),
        rx: drift("cam-rx", settled, 0.003, 2.4),
        ry: lerp(-6, 4, journey),
        rz: drift("cam-rz", settled, 0.003, 1.4),
        scale: 1,
    };

    return (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 75% at 64% 46%, ${COLORS.nightPaper} 0%, ${COLORS.night} 72%)` }}>
            <World pose={pose} perspective={PERSPECTIVE}>
                <Bubbles frame={frame} settled={settled} layerIndex={2} />
                <Bubbles frame={frame} settled={settled} layerIndex={1} />
                <Fragments frame={frame} settled={settled} />
                <Bubbles frame={frame} settled={settled} layerIndex={0} />
            </World>
            <AbsoluteFill
                style={{
                    background: "linear-gradient(90deg, rgba(7, 11, 18, 0.94) 0%, rgba(7, 11, 18, 0.82) 30%, rgba(7, 11, 18, 0) 56%)",
                }}
            />
            {TITLES.map((title, index) => {
                const lines = title.split("\n").length;
                const lineBox = TITLE_SIZE * 1.0;
                return (
                    <RevealText
                        key={title}
                        text={title}
                        start={NOISE.titleIn[index]}
                        exit={NOISE.titleOut[index]}
                        size={TITLE_SIZE}
                        lineHeight={1.0}
                        weight={700}
                        color={COLORS.nightInk}
                        letterSpacing="-0.04em"
                        stagger={4}
                        duration={30}
                        tilt={4}
                        marks={index === 3 ? [{ words: [4, 5], start: NOISE.markTitle, duration: 10, color: COLORS.marker, ink: COLORS.ink }] : []}
                        style={{ position: "absolute", left: 120, top: 540 - (lines * lineBox) / 2 }}
                        frame={frame}
                    />
                );
            })}
            <Whip frame={frame} />
        </AbsoluteFill>
    );
}
