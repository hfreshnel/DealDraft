import { SITE } from "../data/demo";
import { lerp } from "../lib/motion";
import { COLORS, FONTS } from "../theme";
import { SheetGlyph } from "./SheetGlyph";

type WordmarkProps = {
    layout: {
        glyphWidth: number;
        glyphHeight: number;
        glyphTop: number;
        textLeft: number;
        wordWidth: number;
        gap: number;
    };
    fontSize: number;
    glyphLeft: number;
    glyphTop?: number;
    glyphHeight?: number;
    glyphScale?: number;
    outline: number;
    bar: number;
    reveal: number;
    letterWeights: number[];
};

// Letters emerge from behind the glyph: everything left of the glyph's right edge is clipped away.
export function Wordmark({ layout, fontSize, glyphLeft, glyphTop, glyphHeight, glyphScale = 1, outline, bar, reveal, letterWeights }: WordmarkProps) {
    const top = glyphTop ?? layout.glyphTop;
    const height = glyphHeight ?? layout.glyphHeight;
    const width = layout.glyphWidth * (height / layout.glyphHeight);
    const glyphRight = glyphLeft + width;
    const clipLeft = glyphRight + layout.gap * 0.3 - layout.textLeft;
    const textShift = lerp(-(layout.wordWidth + layout.gap), 0, reveal);
    const letters = Array.from(SITE.name);

    return (
        <>
            {reveal > 0 ? (
                <div
                    style={{
                        position: "absolute",
                        left: layout.textLeft,
                        top: layout.glyphTop,
                        height: layout.glyphHeight,
                        display: "flex",
                        alignItems: "center",
                        clipPath: `inset(-40% -40% -40% ${Math.max(-200, clipLeft)}px)`,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            transform: `translateX(${textShift}px)`,
                            fontFamily: FONTS.sans,
                            fontSize,
                            fontWeight: 700,
                            letterSpacing: "-0.035em",
                            color: COLORS.ink,
                            lineHeight: 1,
                            whiteSpace: "pre",
                            marginTop: fontSize * 0.02,
                        }}
                    >
                        {letters.map((letter, index) => (
                            <span key={index} style={{ fontVariationSettings: `"wght" ${letterWeights[index] ?? 700}` }}>
                                {letter}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}
            <div
                style={{
                    position: "absolute",
                    left: glyphLeft,
                    top,
                    transform: `scale(${glyphScale})`,
                    transformOrigin: "50% 50%",
                }}
            >
                <SheetGlyph height={height} outline={outline} bar={bar} />
            </div>
        </>
    );
}
