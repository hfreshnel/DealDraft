import { noise2D } from "@remotion/noise";
import { interpolateColors, spring } from "remotion";
import { FPS } from "../timeline";
import { EASE_IN_CUBIC, EASE_IN_OUT_CUBIC, EASE_OUT_EXPO, type EasingFunction } from "./easing";

export function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

export function lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
}

export function ramp(frame: number, start: number, duration: number, easing: EasingFunction = EASE_OUT_EXPO): number {
    if (duration <= 0) {
        return frame >= start ? 1 : 0;
    }
    return easing(clamp01((frame - start) / duration));
}

export function inOut(
    frame: number,
    inStart: number,
    inDuration: number,
    outStart: number,
    outDuration: number,
    easeIn: EasingFunction = EASE_OUT_EXPO,
    easeOut: EasingFunction = EASE_IN_CUBIC,
): number {
    return ramp(frame, inStart, inDuration, easeIn) * (1 - ramp(frame, outStart, outDuration, easeOut));
}

export type SpringConfig = { damping: number; stiffness: number; mass: number };

export const SPRING_POP: SpringConfig = { damping: 13, stiffness: 190, mass: 0.7 };
export const SPRING_SOFT: SpringConfig = { damping: 20, stiffness: 120, mass: 0.9 };
export const SPRING_SNAP: SpringConfig = { damping: 18, stiffness: 260, mass: 0.6 };
export const SPRING_STAMP: SpringConfig = { damping: 11, stiffness: 340, mass: 0.8 };

export function pop(frame: number, start: number, config: SpringConfig = SPRING_POP): number {
    if (frame < start) {
        return 0;
    }
    return spring({ frame: frame - start, fps: FPS, config });
}

export function mixColor(from: string, to: string, amount: number): string {
    return interpolateColors(clamp01(amount), [0, 1], [from, to]);
}

export function drift(seed: string, frame: number, speed: number, amplitude: number): number {
    return noise2D(seed, frame * speed, 0.37) * amplitude;
}

export function shake(frame: number, start: number, duration: number, amplitude: number, seed: string): { x: number; y: number } {
    if (frame < start || frame > start + duration) {
        return { x: 0, y: 0 };
    }
    const decay = 1 - (frame - start) / duration;
    const strength = amplitude * decay * decay;
    return {
        x: noise2D(`${seed}-x`, frame * 0.55, 0.5) * strength,
        y: noise2D(`${seed}-y`, 0.5, frame * 0.55) * strength,
    };
}

export type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; scale: number };

export const REST_POSE: Pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 };

export type PoseKey = { frame: number; pose: Partial<Pose>; easing?: EasingFunction };

function mixPose(from: Pose, to: Pose, amount: number): Pose {
    return {
        x: lerp(from.x, to.x, amount),
        y: lerp(from.y, to.y, amount),
        z: lerp(from.z, to.z, amount),
        rx: lerp(from.rx, to.rx, amount),
        ry: lerp(from.ry, to.ry, amount),
        rz: lerp(from.rz, to.rz, amount),
        scale: lerp(from.scale, to.scale, amount),
    };
}

// Each key inherits the fields it does not set from the previous key; the easing belongs to the segment ending on it.
export function poseAt(frame: number, keys: PoseKey[]): Pose {
    if (keys.length === 0) {
        return REST_POSE;
    }
    const resolved: { frame: number; pose: Pose; easing: EasingFunction }[] = [];
    let current = REST_POSE;
    for (const key of keys) {
        current = { ...current, ...key.pose };
        resolved.push({ frame: key.frame, pose: current, easing: key.easing ?? EASE_IN_OUT_CUBIC });
    }
    if (frame <= resolved[0].frame) {
        return resolved[0].pose;
    }
    for (let index = 1; index < resolved.length; index += 1) {
        const next = resolved[index];
        if (frame <= next.frame) {
            const previous = resolved[index - 1];
            const span = Math.max(1, next.frame - previous.frame);
            return mixPose(previous.pose, next.pose, next.easing(clamp01((frame - previous.frame) / span)));
        }
    }
    return resolved[resolved.length - 1].pose;
}

export function poseTransform(pose: Pose): string {
    return `translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg) scale(${pose.scale})`;
}

export function typed(text: string, frame: number, start: number, framesPerChar: number): string {
    if (frame < start) {
        return "";
    }
    const count = Math.floor((frame - start) / framesPerChar) + 1;
    return text.slice(0, Math.min(text.length, count));
}
