import { AbsoluteFill, useCurrentFrame } from "remotion";
import { RevealText } from "../components/RevealText";
import { Wordmark } from "../components/Wordmark";
import { SITE } from "../data/demo";
import { BRAND_MARK, FORM, wordmarkLayout } from "../layout";
import { EASE_IN_CUBIC, EASE_IN_OUT_CUBIC, EASE_IN_OUT_EXPO, EASE_IN_OUT_QUART, EASE_OUT_EXPO } from "../lib/easing";
import { clamp01, lerp, ramp } from "../lib/motion";
import { BRAND } from "../timeline";
import { COLORS } from "../theme";

export function BrandScene() {
    const frame = useCurrentFrame();
    const layout = wordmarkLayout(BRAND_MARK.fontSize, BRAND_MARK.glyphHeight, 960, BRAND_MARK.centerY);

    const contract = ramp(frame, 0, BRAND.contractEnd, EASE_IN_OUT_QUART);
    const target = layout.barAt(layout.centeredGlyphLeft);
    const slide = ramp(frame, BRAND.slideStart, BRAND.slideEnd - BRAND.slideStart, EASE_IN_OUT_EXPO);
    const travel = ramp(frame, BRAND.glyphTravelStart, BRAND.glyphTravelEnd - BRAND.glyphTravelStart, EASE_IN_OUT_EXPO);
    const groupLeft = lerp(layout.centeredGlyphLeft, layout.glyphLeft, slide);
    const glyphLeft = lerp(groupLeft, FORM.iconX, travel);
    const glyphTop = lerp(layout.glyphTop, FORM.iconY, travel);
    const glyphHeight = lerp(BRAND_MARK.glyphHeight, FORM.iconHeight, travel);
    const bumpAmount = clamp01((frame - BRAND.popStart) / 26);
    const bump = frame >= BRAND.popStart ? Math.sin(bumpAmount * Math.PI) * 0.07 : 0;

    const reveal = ramp(frame, BRAND.slideStart + 4, 44, EASE_OUT_EXPO) * (1 - ramp(frame, BRAND.exitStart, 18, EASE_IN_CUBIC));
    const letterWeights = Array.from(SITE.name).map((_, index) => lerp(900, 700, ramp(frame, BRAND.slideStart + 10 + index * 2.5, 34, EASE_IN_OUT_CUBIC)));
    const outline = ramp(frame, BRAND.outlineStart, BRAND.outlineEnd - BRAND.outlineStart, EASE_IN_OUT_CUBIC);

    return (
        <AbsoluteFill style={{ background: COLORS.paper }}>
            {frame < BRAND.contractEnd ? (
                <div
                    style={{
                        position: "absolute",
                        left: lerp(0, target.x, contract),
                        top: lerp(0, target.y, contract),
                        width: lerp(1920, target.width, contract),
                        height: lerp(1080, target.height, contract),
                        background: COLORS.marker,
                    }}
                />
            ) : null}
            <Wordmark
                layout={layout}
                fontSize={BRAND_MARK.fontSize}
                glyphLeft={glyphLeft}
                glyphTop={glyphTop}
                glyphHeight={glyphHeight}
                glyphScale={1 + bump}
                outline={outline}
                bar={frame >= BRAND.contractEnd ? 1 : 0}
                reveal={reveal}
                letterWeights={letterWeights}
            />
            <RevealText
                text={"Collez une annonce.\nRecevez l'étude de rendement."}
                start={BRAND.taglineIn[0]}
                exit={BRAND.exitStart}
                size={60}
                weight={600}
                lineHeight={1.2}
                letterSpacing="-0.02em"
                align="center"
                color={COLORS.ink}
                stagger={3}
                marks={[{ words: [4, 5, 6], start: BRAND.markTagline, duration: 10 }]}
                style={{ position: "absolute", left: 0, right: 0, top: 600 }}
                frame={frame}
            />
        </AbsoluteFill>
    );
}
