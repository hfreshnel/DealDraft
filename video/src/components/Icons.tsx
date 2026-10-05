import { evolvePath } from "@remotion/paths";
import { COLORS } from "../theme";

type IconProps = { size: number; color?: string; progress?: number; strokeWidth?: number };

const CHECK_PATH = "M 4 12.5 L 9.5 18 L 20 6.5";
const CROSS_PATH = "M 6 6 L 18 18 M 18 6 L 6 18";

function drawn(progress: number, path: string) {
    return evolvePath(Math.max(0.0001, Math.min(1, progress)), path);
}

export function CheckIcon({ size, color = COLORS.met, progress = 1, strokeWidth = 3 }: IconProps) {
    const evolved = drawn(progress, CHECK_PATH);
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
            <path d={CHECK_PATH} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset} />
        </svg>
    );
}

export function CrossIcon({ size, color = COLORS.refused, progress = 1, strokeWidth = 3 }: IconProps) {
    const evolved = drawn(progress, CROSS_PATH);
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
            <path d={CROSS_PATH} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset} />
        </svg>
    );
}

export function ArrowIcon({ size, color = COLORS.ink, strokeWidth = 2.4 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
            <path d="M 4 12 H 19 M 13 6 L 19 12 L 13 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function DocIcon({ size, color = COLORS.plan }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
            <path d="M 6 2.5 H 14 L 19 7.5 V 21.5 H 6 Z" fill={color} />
            <path d="M 14 2.5 V 7.5 H 19" fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.2} />
            <rect x={8.5} y={11} width={8} height={1.6} rx={0.8} fill="#ffffff" opacity={0.85} />
            <rect x={8.5} y={14.4} width={8} height={1.6} rx={0.8} fill="#ffffff" opacity={0.85} />
            <rect x={8.5} y={17.8} width={5} height={1.6} rx={0.8} fill="#ffffff" opacity={0.85} />
        </svg>
    );
}

export function SheetIcon({ size, color = COLORS.met }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
            <path d="M 6 2.5 H 14 L 19 7.5 V 21.5 H 6 Z" fill={color} />
            <rect x={8.4} y={10.6} width={8.2} height={8} fill="none" stroke="#ffffff" strokeWidth={1.2} />
            <path d="M 8.4 14.6 H 16.6 M 12.5 10.6 V 18.6" stroke="#ffffff" strokeWidth={1.2} />
        </svg>
    );
}

export function FolderIcon({ size, color = COLORS.slate }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
            <path d="M 2.5 6 A 1.5 1.5 0 0 1 4 4.5 H 9.5 L 11.5 6.8 H 20 A 1.5 1.5 0 0 1 21.5 8.3 V 18.5 A 1.5 1.5 0 0 1 20 20 H 4 A 1.5 1.5 0 0 1 2.5 18.5 Z" fill={color} />
        </svg>
    );
}

export function ClipboardIcon({ size, color = COLORS.ink }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
            <rect x={5} y={4} width={14} height={17.5} rx={2} fill="none" stroke={color} strokeWidth={1.8} />
            <rect x={8.5} y={2.5} width={7} height={3.6} rx={1.2} fill={color} />
            <path d="M 8.5 11 H 15.5 M 8.5 14.5 H 15.5 M 8.5 18 H 13" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </svg>
    );
}

export function PlayIcon({ size, color = COLORS.nightInk }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
            <circle cx={12} cy={12} r={11} fill={color} opacity={0.14} />
            <path d="M 9.5 7.5 L 17 12 L 9.5 16.5 Z" fill={color} />
        </svg>
    );
}

export function NoteIcon({ size, color = COLORS.nightMarker }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
            <rect x={4.5} y={3} width={15} height={18} rx={2} fill="none" stroke={color} strokeWidth={1.8} />
            <path d="M 8 8.5 H 16 M 8 12 H 16 M 8 15.5 H 12.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </svg>
    );
}

export function LoopArrowIcon({ size, color = COLORS.nightRefused, progress = 1, strokeWidth = 2.4 }: IconProps) {
    const path = "M 19 12 A 7 7 0 1 1 15.5 5.9";
    const evolved = drawn(progress, path);
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
            <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset} />
            {progress >= 0.98 ? <path d="M 15.8 2.6 L 16.2 6.4 L 12.4 7" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" /> : null}
        </svg>
    );
}
