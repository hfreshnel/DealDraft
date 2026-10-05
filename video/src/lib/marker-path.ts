import { mulberry32 } from "../timeline";

// A highlighter stroke: slanted chisel ends and slightly uneven edges, deterministic for a given seed.
export function markerPath(width: number, height: number, seed: number): string {
    const random = mulberry32(seed);
    const jitter = Math.max(0.8, height * 0.045);
    const slant = Math.min(height * 0.22, width * 0.2);
    const count = Math.max(2, Math.ceil(width / 22));
    const top: [number, number][] = [];
    const bottom: [number, number][] = [];
    for (let index = 0; index <= count; index += 1) {
        const x = (index / count) * width;
        top.push([x, (random() - 0.5) * jitter]);
        bottom.push([x, height + (random() - 0.5) * jitter]);
    }
    const points: [number, number][] = [
        [slant, 0],
        ...top.filter(([x]) => x > slant && x < width),
        [width, top[top.length - 1][1]],
        [width - slant * 0.45, height],
        ...bottom.filter(([x]) => x < width - slant * 0.45 && x > 0).reverse(),
        [-slant * 0.3, height],
    ];
    return `M ${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")} Z`;
}
