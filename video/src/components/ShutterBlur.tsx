import type { ReactNode } from "react";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";

// Running average of sub-frame samples: sample k is laid over the previous ones at opacity 1/k.
// Unlike additive blending of 1/N layers, this keeps flat colors exact in 8-bit compositing.
export function ShutterBlur({ children, samples = 12, shutterAngle = 270 }: { children: ReactNode; samples?: number; shutterAngle?: number }) {
    const frame = useCurrentFrame();
    const fraction = shutterAngle / 360;
    return (
        <AbsoluteFill style={{ isolation: "isolate" }}>
            {Array.from({ length: samples }, (_, index) => (
                <AbsoluteFill key={index} style={{ opacity: 1 / (index + 1) }}>
                    <Freeze frame={frame - fraction * (index / samples)}>{children}</Freeze>
                </AbsoluteFill>
            ))}
        </AbsoluteFill>
    );
}
