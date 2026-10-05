import { AbsoluteFill, useCurrentFrame } from "remotion";
import { RevealText } from "../components/RevealText";
import { Wordmark } from "../components/Wordmark";
import { REPO_LABEL, SITE } from "../data/demo";
import { END_MARK, wordmarkLayout } from "../layout";
import { EASE_IN_OUT_CUBIC, EASE_IN_OUT_EXPO, EASE_OUT_EXPO } from "../lib/easing";
import { clamp01, lerp, ramp } from "../lib/motion";
import { END } from "../timeline";
import { COLORS, FONTS } from "../theme";

export function EndScene() {
    const frame = useCurrentFrame();
    const layout = wordmarkLayout(END_MARK.fontSize, END_MARK.glyphHeight, 960, END_MARK.centerY);
    const outline = ramp(frame, 0, END.outlineEnd, EASE_IN_OUT_CUBIC);
    const slide = ramp(frame, END.wordmarkIn + 8, 36, EASE_IN_OUT_EXPO);
    const reveal = ramp(frame, END.wordmarkIn + 12, 40, EASE_OUT_EXPO);
    const letterWeights = Array.from(SITE.name).map((_, index) => lerp(900, 700, ramp(frame, END.wordmarkIn + 16 + index * 2.5, 30, EASE_IN_OUT_CUBIC)));
    const bumpAmount = clamp01((frame - END.outlineEnd + 6) / 24);
    const bump = frame >= END.outlineEnd - 6 ? Math.sin(bumpAmount * Math.PI) * 0.06 : 0;
    const fade = 1 - ramp(frame, END.fadeStart, 15, EASE_IN_OUT_CUBIC);
    const url = ramp(frame, END.urlIn, 26, EASE_OUT_EXPO);

    return (
        <AbsoluteFill style={{ background: COLORS.paper }}>
            <AbsoluteFill style={{ opacity: fade }}>
                <Wordmark
                    layout={layout}
                    fontSize={END_MARK.fontSize}
                    glyphLeft={lerp(layout.centeredGlyphLeft, layout.glyphLeft, slide)}
                    glyphScale={1 + bump}
                    outline={outline}
                    bar={1}
                    reveal={reveal}
                    letterWeights={letterWeights}
                />
                <RevealText
                    text="Collez une annonce. Recevez l'étude de rendement."
                    start={END.taglineIn}
                    size={46}
                    weight={600}
                    lineHeight={1.2}
                    letterSpacing="-0.015em"
                    align="center"
                    stagger={2}
                    marks={[{ words: [4, 5, 6], start: END.taglineIn + 34, duration: 10 }]}
                    style={{ position: "absolute", left: 0, right: 0, top: 552 }}
                    frame={frame}
                />
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 676,
                        textAlign: "center",
                        fontFamily: FONTS.mono,
                        fontSize: 32,
                        fontWeight: 500,
                        color: COLORS.plan,
                        opacity: url,
                        transform: `translateY(${(1 - url) * 16}px)`,
                    }}
                >
                    {REPO_LABEL}
                </div>
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 990,
                        textAlign: "center",
                        fontFamily: FONTS.sans,
                        fontSize: 24,
                        color: COLORS.slate,
                        opacity: ramp(frame, END.finePrintIn, 24),
                    }}
                >
                    {SITE.footerNote}
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
}
