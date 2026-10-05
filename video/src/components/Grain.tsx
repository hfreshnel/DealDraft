import { AbsoluteFill } from "remotion";

const VARIANTS = 6;

// Tiled SVG turbulence: each variant is rasterized once by the browser, so animated grain stays cheap.
const GRAIN_URLS = Array.from({ length: VARIANTS }, (_, seed) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='${seed * 7 + 3}' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='linear' slope='1'/></feComponentTransfer></filter><rect width='256' height='256' filter='url(#g)'/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
});

export function Grain({ frame, opacity }: { frame: number; opacity: number }) {
    if (opacity <= 0) {
        return null;
    }
    const variant = Math.floor(frame / 2) % VARIANTS;
    return (
        <AbsoluteFill
            style={{
                backgroundImage: `url("${GRAIN_URLS[variant]}")`,
                backgroundSize: "256px 256px",
                opacity,
                mixBlendMode: "soft-light",
                pointerEvents: "none",
            }}
        />
    );
}

export function Vignette({ opacity, color = "0, 0, 0" }: { opacity: number; color?: string }) {
    if (opacity <= 0) {
        return null;
    }
    return (
        <AbsoluteFill
            style={{
                background: `radial-gradient(ellipse 75% 70% at 50% 48%, rgba(${color}, 0) 55%, rgba(${color}, 0.55) 100%)`,
                opacity,
                pointerEvents: "none",
            }}
        />
    );
}
