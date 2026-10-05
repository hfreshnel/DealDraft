import { EASE_IN_OUT_CUBIC, type EasingFunction } from "../lib/easing";
import { clamp01, lerp } from "../lib/motion";
import { COLORS } from "../theme";

export type CursorKey = { frame: number; x: number; y: number; easing?: EasingFunction };

type CursorProps = {
    keys: CursorKey[];
    frame: number;
    clicks?: number[];
    from?: number;
    to?: number;
};

function positionAt(keys: CursorKey[], frame: number): { x: number; y: number } {
    if (frame <= keys[0].frame) {
        return keys[0];
    }
    for (let index = 1; index < keys.length; index += 1) {
        const next = keys[index];
        if (frame <= next.frame) {
            const previous = keys[index - 1];
            const amount = (next.easing ?? EASE_IN_OUT_CUBIC)(clamp01((frame - previous.frame) / Math.max(1, next.frame - previous.frame)));
            // A slight arc reads as a hand movement rather than a straight robotic slide.
            const arc = Math.sin(amount * Math.PI) * Math.min(60, Math.hypot(next.x - previous.x, next.y - previous.y) * 0.12);
            return { x: lerp(previous.x, next.x, amount), y: lerp(previous.y, next.y, amount) - arc };
        }
    }
    return keys[keys.length - 1];
}

export function Cursor({ keys, frame, clicks = [], from = -Infinity, to = Infinity }: CursorProps) {
    if (frame < from || frame > to || keys.length === 0) {
        return null;
    }
    const { x, y } = positionAt(keys, frame);
    let press = 0;
    for (const click of clicks) {
        if (frame >= click && frame <= click + 10) {
            press = Math.max(press, Math.sin(((frame - click) / 10) * Math.PI));
        }
    }
    const ripples = clicks.filter((click) => frame >= click && frame <= click + 24);
    const appear = clamp01((frame - from) / 8);
    return (
        <>
            {ripples.map((click) => {
                const amount = (frame - click) / 24;
                return (
                    <div
                        key={click}
                        style={{
                            position: "absolute",
                            left: x - 6 - amount * 46,
                            top: y - 6 - amount * 46,
                            width: 12 + amount * 92,
                            height: 12 + amount * 92,
                            borderRadius: "50%",
                            border: `3px solid ${COLORS.plan}`,
                            opacity: 0.55 * (1 - amount),
                        }}
                    />
                );
            })}
            <svg
                width={44}
                height={52}
                viewBox="0 0 22 26"
                style={{
                    position: "absolute",
                    left: x - 2,
                    top: y - 2,
                    transform: `scale(${(1 - press * 0.16) * appear})`,
                    transformOrigin: "2px 2px",
                    filter: "drop-shadow(0 6px 10px rgba(20, 32, 51, 0.28))",
                    overflow: "visible",
                }}
            >
                <path d="M 1 1 L 1 20.5 L 6 15.8 L 9.6 23.8 L 13 22.3 L 9.5 14.4 L 16.4 14.4 Z" fill={COLORS.ink} stroke="#ffffff" strokeWidth={1.4} strokeLinejoin="round" />
            </svg>
        </>
    );
}
