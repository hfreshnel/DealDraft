import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { useMemo } from "react";
import { COLORS } from "../theme";

export type Point = { x: number; y: number };

type ThreadProps = {
    from: Point;
    to: Point;
    progress: number;
    color?: string;
    width?: number;
    landed?: number;
    opacity?: number;
};

// A source-to-value connector: cubic curve with horizontal tangents, drawn on, with a glowing head while travelling.
export function Thread({ from, to, progress, color = COLORS.marker, width = 2.5, landed = 0, opacity = 1 }: ThreadProps) {
    const d = useMemo(() => {
        const dx = Math.max(70, Math.abs(to.x - from.x) * 0.5);
        return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y} ${to.x - dx} ${to.y} ${to.x} ${to.y}`;
    }, [from.x, from.y, to.x, to.y]);
    const length = useMemo(() => getLength(d), [d]);
    if (progress <= 0) {
        return null;
    }
    const clamped = Math.min(1, progress);
    const evolved = evolvePath(clamped, d);
    const head = getPointAtLength(d, length * clamped) ?? to;
    return (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity }}>
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
                strokeDasharray={evolved.strokeDasharray}
                strokeDashoffset={evolved.strokeDashoffset}
            />
            <circle cx={from.x} cy={from.y} r={width * 2.2} fill={color} />
            {clamped < 1 ? (
                <>
                    <circle cx={head.x} cy={head.y} r={width * 5} fill={color} opacity={0.25} />
                    <circle cx={head.x} cy={head.y} r={width * 2.4} fill={color} />
                </>
            ) : (
                <circle cx={to.x} cy={to.y} r={width * (2.2 + 2.4 * (1 - landed))} fill={color} />
            )}
        </svg>
    );
}
