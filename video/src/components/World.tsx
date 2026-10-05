import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { poseTransform, type Pose } from "../lib/motion";

type WorldProps = {
    pose: Pose;
    perspective?: number;
    origin?: string;
    children: ReactNode;
    style?: CSSProperties;
};

// The virtual camera: everything inside moves together, in perspective, like a single 2.5D set.
export function World({ pose, perspective = 1600, origin = "50% 50%", children, style }: WorldProps) {
    return (
        <AbsoluteFill style={{ perspective, perspectiveOrigin: origin }}>
            <AbsoluteFill style={{ transform: poseTransform(pose), transformOrigin: origin, transformStyle: "preserve-3d", ...style }}>{children}</AbsoluteFill>
        </AbsoluteFill>
    );
}
