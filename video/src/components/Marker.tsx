import { useMemo } from "react";
import { markerPath } from "../lib/marker-path";
import { COLORS } from "../theme";

type MarkerProps = {
    x: number;
    y: number;
    width: number;
    height: number;
    progress: number;
    seed: number;
    color?: string;
    opacity?: number;
};

export function Marker({ x, y, width, height, progress, seed, color = COLORS.marker, opacity = 1 }: MarkerProps) {
    const path = useMemo(() => markerPath(width, height, seed), [width, height, seed]);
    if (progress <= 0) {
        return null;
    }
    const bleed = height * 0.4;
    return (
        <div
            style={{
                position: "absolute",
                left: x - bleed,
                top: y - bleed,
                width: (width + bleed * 2) * Math.min(1, progress),
                height: height + bleed * 2,
                overflow: "hidden",
                opacity,
            }}
        >
            <svg width={width + bleed * 2} height={height + bleed * 2} style={{ position: "absolute", left: 0, top: 0 }}>
                <path d={path} transform={`translate(${bleed} ${bleed})`} fill={color} />
            </svg>
        </div>
    );
}
