import { clamp01, lerp, pop, SPRING_STAMP } from "../lib/motion";
import { FONTS } from "../theme";

type StampProps = {
    text: string;
    color: string;
    start: number;
    frame: number;
    x: number;
    y: number;
    rotate?: number;
    size?: number;
    exit?: number;
    background?: string;
};

export function Stamp({ text, color, start, frame, x, y, rotate = -7, size = 54, exit, background }: StampProps) {
    if (frame < start) {
        return null;
    }
    const landing = pop(frame, start, SPRING_STAMP);
    const fade = exit === undefined ? 1 : 1 - clamp01((frame - exit) / 10);
    if (fade <= 0) {
        return null;
    }
    return (
        <div
            style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${lerp(2.3, 1, landing)})`,
                opacity: clamp01((frame - start) / 4) * fade,
                border: `${size * 0.11}px solid ${color}`,
                outline: `${size * 0.04}px solid ${color}`,
                outlineOffset: -size * 0.26,
                borderRadius: size * 0.24,
                padding: `${size * 0.3}px ${size * 0.55}px`,
                color,
                background,
                boxShadow: background ? "0 18px 50px rgba(0, 0, 0, 0.45)" : undefined,
                fontFamily: FONTS.sans,
                fontSize: size,
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1,
            }}
        >
            {text}
        </div>
    );
}
