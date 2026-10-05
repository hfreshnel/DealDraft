// Single source of timing for picture and sound: the audio script imports this file with Node type stripping,
// so it must stay free of imports and of non-erasable TypeScript syntax.

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BEAT = 30;
export const BAR = 4 * BEAT;

export function beat(count: number): number {
    return Math.round(count * BEAT);
}

export function bar(count: number): number {
    return Math.round(count * BAR);
}

export type SceneKey = "noise" | "brand" | "paste" | "read" | "check" | "compute" | "report" | "decide" | "proof" | "end";

export type SceneSlot = { key: SceneKey; from: number; duration: number };

const SCENE_BARS: [SceneKey, number][] = [
    ["noise", 4],
    ["brand", 3],
    ["paste", 4],
    ["read", 7],
    ["check", 5],
    ["compute", 6],
    ["report", 5],
    ["decide", 5],
    ["proof", 4],
    ["end", 2],
];

export const SCENES: Record<SceneKey, SceneSlot> = (() => {
    const slots = {} as Record<SceneKey, SceneSlot>;
    let cursor = 0;
    for (const [key, bars] of SCENE_BARS) {
        slots[key] = { key, from: cursor, duration: bar(bars) };
        cursor += bar(bars);
    }
    return slots;
})();

export const SCENE_ORDER: SceneKey[] = SCENE_BARS.map(([key]) => key);

export const TOTAL_FRAMES = SCENE_BARS.reduce((sum, [, bars]) => sum + bar(bars), 0);

export function mulberry32(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let mixed = state;
        mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}

// ---------------------------------------------------------------- 1. Noise

export type NoiseBubble = { index: number; frame: number; layer: number; x: number; y: number };

const NOISE_COUNTS = [1, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7];

// Front bubbles fill the right half (the title owns the left), deeper layers cover the whole frame.
const NOISE_REGIONS = [
    { xMin: 1040, xMax: 1610, yMin: 190, yMax: 890 },
    { xMin: 120, xMax: 1800, yMin: 110, yMax: 980 },
    { xMin: 60, xMax: 1860, yMin: 60, yMax: 1020 },
];

export const NOISE_BUBBLES: NoiseBubble[] = (() => {
    const random = mulberry32(20261004);
    const bubbles: NoiseBubble[] = [];
    let index = 0;
    NOISE_COUNTS.forEach((count, beatIndex) => {
        for (let slot = 0; slot < count; slot += 1) {
            const offset = index === 0 ? 8 : Math.round((slot / count) * BEAT * 0.85);
            const draw = random();
            const layer = index < 5 ? 0 : draw < 0.34 ? 0 : draw < 0.7 ? 1 : 2;
            const region = NOISE_REGIONS[layer];
            const x = index === 0 ? 1330 : region.xMin + random() * (region.xMax - region.xMin);
            const y = index === 0 ? 470 : region.yMin + random() * (region.yMax - region.yMin);
            bubbles.push({ index, frame: beat(beatIndex) + offset, layer, x, y });
            index += 1;
        }
    });
    return bubbles;
})();

export const NOISE = {
    titleIn: [14, 134, 254, 374],
    titleOut: [100, 220, 340],
    fragmentsIn: [beat(8), beat(9), beat(10), beat(11), beat(12), beat(13)],
    freeze: beat(15),
    markTitle: 436,
    whipStart: 456,
    whipEnd: bar(4),
};

// ---------------------------------------------------------------- 2. Brand

export const BRAND = {
    contractEnd: 26,
    outlineStart: 20,
    outlineEnd: 56,
    popStart: 24,
    slideStart: 54,
    slideEnd: 92,
    taglineIn: [100, 116],
    markTagline: 156,
    exitStart: 300,
    glyphTravelStart: 304,
    glyphTravelEnd: 356,
};

// ---------------------------------------------------------------- 3. Paste

export const PASTE = {
    cardEnd: 34,
    fieldsIn: 20,
    captionIn: 40,
    keyCtrl: 76,
    keyV: 84,
    paste: 90,
    captionOut: 206,
    captionTwoIn: 228,
    rentFocus: 244,
    rentDigits: [252, 261, 270],
    notaryFocus: 290,
    notaryDigit: 300,
    cursorIn: 316,
    cursorArrive: 376,
    click: 390,
    whipStart: 450,
    whipEnd: bar(4),
};

// ---------------------------------------------------------------- 4. Read

export const READ = {
    arriveEnd: 26,
    panelIn: 20,
    headlineIn: 34,
    scanStart: 46,
    scanEnd: 108,
    marks: [
        { key: "type", frame: beat(4) },
        { key: "area", frame: beat(5) },
        { key: "city", frame: beat(6) },
        { key: "price", frame: beat(7) },
        { key: "occupancy", frame: beat(8) },
        { key: "condition", frame: beat(9) },
        { key: "risk", frame: beat(10) },
        { key: "windows", frame: beat(10.5) },
        { key: "painting", frame: beat(11) },
        { key: "flooring", frame: beat(11.5) },
        { key: "bathroom", frame: beat(12) },
    ],
    empties: [beat(13), beat(13.5), beat(14)],
    headlineOut: 436,
    punchIn: [452, 482],
    punchMark: 506,
    zoomStart: 712,
    zoomEnd: bar(7),
};

// ---------------------------------------------------------------- 5. Check

export const CHECK = {
    settleEnd: 30,
    headlineIn: 24,
    chipIn: 14,
    checksIn: [36, 44, 52],
    scanOne: [40, 104],
    verdictsOne: [84, 96, 108],
    errorAt: 108,
    stampOne: 150,
    loopStart: 196,
    loopEnd: 236,
    flip: 240,
    scanTwo: [262, 322],
    verdictsTwo: [300, 312, 324],
    stampTwo: 336,
    footnoteIn: 176,
    irisStart: 536,
    irisEnd: bar(5),
};

// ---------------------------------------------------------------- 6. Compute

export const COMPUTE = {
    headlineIn: 12,
    rows: [36, 66, 96, 126],
    sumRule: 158,
    totalRoll: [166, 226],
    rentRow: 246,
    headlineOut: 344,
    fraction: [366, 444],
    drop: beat(16),
    yieldRoll: [480, 528],
    yieldMark: 532,
    chips: [566, 582],
    exitStart: 662,
    exitEnd: bar(6),
};

// ---------------------------------------------------------------- 7. Report

export const REPORT = {
    landEnd: 46,
    pageBuild: [10, 70],
    flyStart: 40,
    flyEnd: 300,
    captionIn: 70,
    captionOut: 288,
    passes: [96, 140, 184, 228, 262],
    flipStart: 300,
    flipEnd: 352,
    drop: [352, 404],
    rowSlide: 404,
    statusChip: 424,
    captionTwoIn: 414,
    whipStart: 560,
    whipEnd: bar(5),
};

// ---------------------------------------------------------------- 8. Decide

export const DECIDE = {
    arriveEnd: 26,
    headlineIn: 22,
    buttons: [beat(1), beat(2), beat(3)],
    cursorIn: 108,
    hoverRevise: 150,
    hoverReject: 236,
    clickApprove: beat(11.5),
    envelope: [352, 404],
    draft: [396, 446],
    approachSend: [446, 486],
    silence: [488, 516],
    finalTitle: 500,
};

// ---------------------------------------------------------------- 9. Proof

export const PROOF = {
    headlineIn: 4,
    cards: [24, 112, 200, 288],
    finePrintIn: 30,
    lockFrame: 236,
    finalMark: 392,
    exitStart: 436,
    exitEnd: bar(4),
};

// ---------------------------------------------------------------- 10. End

export const END = {
    outlineEnd: 30,
    wordmarkIn: 16,
    taglineIn: 46,
    urlIn: 74,
    finePrintIn: 92,
    fadeStart: bar(2) - 15,
};
