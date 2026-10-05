import { GLYPH_BAR, GLYPH_HEIGHT, GLYPH_WIDTH } from "./components/SheetGlyph";
import { LEDGER, SITE } from "./data/demo";
import { textWidth } from "./lib/text-layout";

// Geometry shared across scenes, so match cuts land on the exact same pixels.

export type Rect = { x: number; y: number; width: number; height: number };

export function wordmarkLayout(fontSize: number, glyphHeight: number, centerX: number, centerY: number) {
    const unit = glyphHeight / GLYPH_HEIGHT;
    const glyphWidth = GLYPH_WIDTH * unit;
    const gap = fontSize * 0.24;
    const wordWidth = textWidth(SITE.name, { fontSize, fontWeight: 700, letterSpacing: "-0.035em" });
    const total = glyphWidth + gap + wordWidth;
    const glyphLeft = centerX - total / 2;
    const glyphTop = centerY - glyphHeight / 2;
    return {
        unit,
        glyphWidth,
        glyphHeight,
        gap,
        wordWidth,
        glyphLeft,
        glyphTop,
        textLeft: glyphLeft + glyphWidth + gap,
        centeredGlyphLeft: centerX - glyphWidth / 2,
        barAt(left: number, top: number = glyphTop): Rect {
            return { x: left + GLYPH_BAR.x * unit, y: top + GLYPH_BAR.y * unit, width: GLYPH_BAR.width * unit, height: GLYPH_BAR.height * unit };
        },
    };
}

export const BRAND_MARK = { fontSize: 172, glyphHeight: 196, centerY: 430 };
export const END_MARK = { fontSize: 140, glyphHeight: 160, centerY: 410 };

export const FORM = {
    x: 780,
    y: 120,
    width: 1050,
    height: 840,
    iconX: 818,
    iconY: 158,
    iconHeight: 50,
    inner: 818,
    innerWidth: 974,
    textarea: { y: 314, height: 290, padX: 22, padY: 18, fontSize: 22, lineHeight: 33 },
    notes: { y: 658, height: 58 },
    inputs: { y: 776, height: 62, rentX: 818, notaryX: 1316, width: 476 },
    button: { x: 1532, y: 868, width: 260, height: 64 },
};

export const READ_LAYOUT = {
    card: { x: 90, y: 250, width: 900 },
    cardPadX: 44,
    textTop: 336,
    fontSize: 27,
    lineHeight: 44,
    panel: { x: 1050, y: 250, width: 780, height: 770 },
    rowTop: 352,
    rowHeight: 50,
    worksHeight: 96,
    labelX: 1090,
    valueX: 1290,
    statusX: 1786,
};

export function readRowFrames(rowKeys: { key: string }[]): Record<string, { top: number; height: number }> {
    const frames: Record<string, { top: number; height: number }> = {};
    let top = READ_LAYOUT.rowTop;
    for (const row of rowKeys) {
        const height = row.key === "works" ? READ_LAYOUT.worksHeight : READ_LAYOUT.rowHeight;
        frames[row.key] = { top, height };
        top += height;
    }
    return frames;
}

// The study page (scene 7) in world coordinates; the yield value of its summary table receives the big number of scene 6.
export const DOC = {
    x: 530,
    y: 60,
    width: 860,
    padX: 56,
    synthTop: 314,
    synthRow: 40,
    valueColumn: 0.6,
    valueFontSize: 18,
    introZoom: 1.6,
};

export function docYieldCenter(): { x: number; y: number } {
    const contentWidth = DOC.width - DOC.padX * 2;
    const valueLeft = DOC.padX + contentWidth * DOC.valueColumn + 10;
    const yieldWidth = textWidth(LEDGER.yield, { fontSize: DOC.valueFontSize, fontWeight: 700, fontFamily: "Arial, Helvetica, sans-serif", letterSpacing: "normal" });
    return { x: DOC.x + valueLeft + yieldWidth / 2, y: DOC.y + DOC.synthTop + DOC.synthRow * 2 + DOC.synthRow / 2 };
}

// Opening camera of scene 7: zoomed so the yield value sits at the screen center, at the size scene 6 hands over.
export function docIntroPose(): { x: number; y: number; scale: number } {
    const center = docYieldCenter();
    return { scale: DOC.introZoom, x: -(center.x - 960) * DOC.introZoom, y: -(center.y - 540) * DOC.introZoom };
}

export const HANDOFF_FONT_SIZE = DOC.valueFontSize * DOC.introZoom;

// Camera poses (screen-centered) shared by the reading and validation scenes.
export const READ_PUNCH_POSE = { x: -240, y: -470, scale: 1.45 };
export const CHECK_POSE = { x: -979, y: -156, scale: 1.3 };
