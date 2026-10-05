import { evolvePath } from "@remotion/paths";
import { COLORS } from "../theme";

// The brand mark: a sheet with one highlighted line (same proportions as .wordmark-mark on the product page).
export const GLYPH_OUTLINE = "M 2.2 1 H 13.8 A 1.2 1.2 0 0 1 15 2.2 V 17.8 A 1.2 1.2 0 0 1 13.8 19 H 2.2 A 1.2 1.2 0 0 1 1 17.8 V 2.2 A 1.2 1.2 0 0 1 2.2 1 Z";
export const GLYPH_BAR = { x: 4, y: 9, width: 8, height: 4 };
export const GLYPH_WIDTH = 16;
export const GLYPH_HEIGHT = 20;

type SheetGlyphProps = {
    height: number;
    outline?: number;
    bar?: number;
    stroke?: string;
    barColor?: string;
};

export function SheetGlyph({ height, outline = 1, bar = 1, stroke = COLORS.ink, barColor = COLORS.marker }: SheetGlyphProps) {
    const unit = height / GLYPH_HEIGHT;
    const evolved = evolvePath(Math.max(0.0001, Math.min(1, outline)), GLYPH_OUTLINE);
    return (
        <svg width={GLYPH_WIDTH * unit} height={height} viewBox={`0 0 ${GLYPH_WIDTH} ${GLYPH_HEIGHT}`} style={{ display: "block", overflow: "visible" }}>
            {bar > 0 ? <rect x={GLYPH_BAR.x} y={GLYPH_BAR.y} width={GLYPH_BAR.width * Math.min(1, bar)} height={GLYPH_BAR.height} fill={barColor} /> : null}
            {outline > 0 ? (
                <path
                    d={GLYPH_OUTLINE}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={evolved.strokeDasharray}
                    strokeDashoffset={evolved.strokeDashoffset}
                />
            ) : null}
        </svg>
    );
}
