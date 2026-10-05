import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArrowIcon } from "../components/Icons";
import { Cursor } from "../components/Cursor";
import { Keycap } from "../components/Keycap";
import { ShutterBlur } from "../components/ShutterBlur";
import { RevealText } from "../components/RevealText";
import { SheetGlyph } from "../components/SheetGlyph";
import { World } from "../components/World";
import { LISTING_TEXT, MARKS, WRAP_KEEP } from "../data/demo";
import { FORM } from "../layout";
import { EASE_IN_CUBIC, EASE_OUT_EXPO, EASE_OUT_QUART } from "../lib/easing";
import { clamp01, lerp, mixColor, pop, ramp, REST_POSE, SPRING_POP } from "../lib/motion";
import { layoutMessage, textWidth } from "../lib/text-layout";
import { PASTE } from "../timeline";
import { CARD_SHADOW, COLORS, FONTS, NBSP } from "../theme";

const TEXT_STYLE = { fontSize: FORM.textarea.fontSize, fontWeight: 400 };

function rise(frame: number, start: number): { opacity: number; transform: string } {
    const amount = ramp(frame, start, 22, EASE_OUT_EXPO);
    return { opacity: amount, transform: `translateY(${(1 - amount) * 18}px)` };
}

function Label({ text, x, y, frame, start }: { text: string; x: number; y: number; frame: number; start: number }) {
    return (
        <div style={{ position: "absolute", left: x, top: y, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 600, color: COLORS.ink, ...rise(frame, start) }}>
            {text}
        </div>
    );
}

function Caret({ frame, x, y, height }: { frame: number; x: number; y: number; height: number }) {
    const visible = Math.floor(frame / 15) % 2 === 0;
    return <div style={{ position: "absolute", left: x, top: y, width: 2.5, height, background: COLORS.plan, opacity: visible ? 1 : 0 }} />;
}

function Input({ frame, x, label, value, unit, focusStart, focusEnd, enterAt }: { frame: number; x: number; label: string; value: string; unit: string; focusStart: number; focusEnd: number; enterAt: number }) {
    const focus = ramp(frame, focusStart, 10) * (1 - ramp(frame, focusEnd, 10));
    const { y, height, width } = FORM.inputs;
    return (
        <>
            <Label text={label} x={x} y={y - 34} frame={frame} start={enterAt} />
            <div
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width,
                    height,
                    borderRadius: 10,
                    border: `2px solid ${mixColor(COLORS.rule, COLORS.plan, focus)}`,
                    boxShadow: `0 0 0 ${focus * 5}px rgba(31, 79, 176, 0.14)`,
                    background: COLORS.paper,
                    ...rise(frame, enterAt + 2),
                }}
            >
                <div style={{ position: "absolute", left: 20, top: 0, height, display: "flex", alignItems: "center", fontFamily: FONTS.sans, fontSize: 30, fontWeight: 600, color: COLORS.ink }}>
                    {value}
                </div>
                <div style={{ position: "absolute", right: 20, top: 0, height, display: "flex", alignItems: "center", fontFamily: FONTS.sans, fontSize: 22, color: COLORS.slate }}>{unit}</div>
                {focus > 0.5 ? <Caret frame={frame} x={22 + textWidth(value, { fontSize: 30, fontWeight: 600 })} y={14} height={34} /> : null}
            </div>
        </>
    );
}

function PasteContent() {
    const frame = useCurrentFrame();
    const lines = useMemo(() => layoutMessage(LISTING_TEXT, [...Object.values(MARKS), ...WRAP_KEEP], FORM.innerWidth - FORM.textarea.padX * 2, TEXT_STYLE, 600), []);

    const grow = ramp(frame, 0, PASTE.cardEnd, EASE_OUT_EXPO);
    const card = {
        x: lerp(FORM.iconX - 14, FORM.x, grow),
        y: lerp(FORM.iconY - 14, FORM.y, grow),
        width: lerp(68, FORM.width, grow),
        height: lerp(78, FORM.height, grow),
    };
    const whip = ramp(frame, PASTE.whipStart, PASTE.whipEnd - PASTE.whipStart, EASE_IN_CUBIC);
    const pose = { ...REST_POSE, x: -2200 * whip };

    const pasted = frame >= PASTE.paste;
    const flash = pasted ? 1 - clamp01((frame - PASTE.paste) / 34) : 0;
    const pasteFocus = ramp(frame, PASTE.keyCtrl, 8) * (1 - ramp(frame, PASTE.paste + 40, 12));
    const keysIn = pop(frame, PASTE.keyCtrl, SPRING_POP);
    const keysOut = ramp(frame, PASTE.paste + 22, 12);
    const vIn = pop(frame, PASTE.keyV, SPRING_POP);
    const keyPress = frame >= PASTE.paste - 4 && frame < PASTE.paste + 6 ? 1 : 0;

    const rentValue = PASTE.rentDigits.reduce((value, at, index) => (frame >= at ? "570".slice(0, index + 1) : value), "");
    const notaryValue = frame >= PASTE.notaryDigit ? "7" : "";
    const hover = ramp(frame, PASTE.cursorArrive, 8);
    const clicked = frame >= PASTE.click;
    const press = frame >= PASTE.click && frame < PASTE.click + 10 ? Math.sin(((frame - PASTE.click) / 10) * Math.PI) : 0;
    const loading = clamp01((frame - PASTE.click - 6) / 50);

    return (
        <AbsoluteFill style={{ background: mixColor(COLORS.paper, COLORS.wash, ramp(frame, 0, 40)) }}>
            <World pose={pose}>
                <RevealText
                    text={"Annonce,\nmessage ou\nnotes de visite,\ntels quels."}
                    start={PASTE.captionIn}
                    exit={PASTE.captionOut}
                    size={66}
                    lineHeight={1.04}
                    style={{ position: "absolute", left: 90, top: 540 - 2 * 66 * 1.04 }}
                    frame={frame}
                />
                <RevealText
                    text={"Le loyer\naprès travaux\nvient de vous."}
                    start={PASTE.captionTwoIn}
                    size={66}
                    lineHeight={1.04}
                    accent={{ words: [4, 5, 6], color: COLORS.plan }}
                    style={{ position: "absolute", left: 90, top: 540 - 1.5 * 66 * 1.04 }}
                    frame={frame}
                />

                <div
                    style={{
                        position: "absolute",
                        left: card.x,
                        top: card.y,
                        width: card.width,
                        height: card.height,
                        background: COLORS.paper,
                        borderRadius: lerp(10, 18, grow),
                        boxShadow: CARD_SHADOW,
                    }}
                />
                <div style={{ position: "absolute", left: FORM.iconX, top: FORM.iconY }}>
                    <SheetGlyph height={FORM.iconHeight} />
                </div>
                <RevealText text="Analyse d'annonce" start={12} size={38} weight={700} lineHeight={1.1} letterSpacing="-0.02em" style={{ position: "absolute", left: 886, top: 150 }} frame={frame} />
                <div style={{ position: "absolute", left: 886, top: 198, fontFamily: FONTS.sans, fontSize: 22, color: COLORS.slate, ...rise(frame, 20) }}>
                    Brouillon d'étude de rendement, à relire et à valider.
                </div>
                <div style={{ position: "absolute", left: FORM.inner, top: 252, width: FORM.innerWidth * ramp(frame, 18, 30), height: 1.5, background: COLORS.rule }} />

                <Label text="Annonce ou message" x={FORM.inner} y={278} frame={frame} start={PASTE.fieldsIn} />
                <div
                    style={{
                        position: "absolute",
                        left: FORM.inner,
                        top: FORM.textarea.y,
                        width: FORM.innerWidth,
                        height: FORM.textarea.height,
                        borderRadius: 12,
                        border: `2px solid ${mixColor(COLORS.rule, COLORS.plan, pasteFocus)}`,
                        boxShadow: `0 0 0 ${pasteFocus * 5}px rgba(31, 79, 176, 0.14)`,
                        background: mixColor(COLORS.paper, COLORS.markerSoft, flash),
                        overflow: "hidden",
                        ...rise(frame, PASTE.fieldsIn + 3),
                    }}
                >
                    {!pasted ? (
                        <div style={{ position: "absolute", left: FORM.textarea.padX, top: FORM.textarea.padY, fontFamily: FONTS.sans, fontSize: 22, color: COLORS.slate, opacity: 0.7 }}>
                            Collez ici l'annonce, le message ou vos notes de visite
                        </div>
                    ) : null}
                    {pasted
                        ? lines.map((line, index) => {
                              const appear = ramp(frame, PASTE.paste + index * 3, 16, EASE_OUT_EXPO);
                              return (
                                  <div
                                      key={index}
                                      style={{
                                          position: "absolute",
                                          left: FORM.textarea.padX,
                                          top: FORM.textarea.padY + index * FORM.textarea.lineHeight,
                                          fontFamily: FONTS.sans,
                                          fontSize: FORM.textarea.fontSize,
                                          fontWeight: line.weight,
                                          lineHeight: `${FORM.textarea.lineHeight}px`,
                                          whiteSpace: "pre",
                                          color: COLORS.ink,
                                          opacity: appear,
                                          transform: `translateY(${(1 - appear) * 14}px)`,
                                      }}
                                  >
                                      {line.text}
                                  </div>
                              );
                          })
                        : null}
                </div>

                <Label text="Notes de visite" x={FORM.inner} y={624} frame={frame} start={PASTE.fieldsIn + 6} />
                <div
                    style={{
                        position: "absolute",
                        left: FORM.inner,
                        top: FORM.notes.y,
                        width: FORM.innerWidth,
                        height: FORM.notes.height,
                        borderRadius: 12,
                        border: `2px solid ${COLORS.rule}`,
                        background: COLORS.paper,
                        ...rise(frame, PASTE.fieldsIn + 9),
                    }}
                >
                    <div style={{ position: "absolute", left: FORM.textarea.padX, top: 14, fontFamily: FONTS.sans, fontSize: 22, color: COLORS.slate, opacity: 0.7 }}>Facultatif</div>
                </div>

                <Input frame={frame} x={FORM.inputs.rentX} label="Loyer visé après travaux" value={rentValue} unit={`€${NBSP}/${NBSP}mois`} focusStart={PASTE.rentFocus} focusEnd={PASTE.notaryFocus} enterAt={PASTE.fieldsIn + 12} />
                <Input frame={frame} x={FORM.inputs.notaryX} label="Frais de notaire" value={notaryValue} unit="%" focusStart={PASTE.notaryFocus} focusEnd={PASTE.cursorIn} enterAt={PASTE.fieldsIn + 15} />

                <div
                    style={{
                        position: "absolute",
                        left: FORM.button.x,
                        top: FORM.button.y,
                        width: FORM.button.width,
                        height: FORM.button.height,
                        borderRadius: 12,
                        background: mixColor(COLORS.plan, "#173d8c", hover),
                        color: COLORS.paper,
                        overflow: "hidden",
                        opacity: rise(frame, PASTE.fieldsIn + 18).opacity,
                        transform: `${rise(frame, PASTE.fieldsIn + 18).transform} scale(${1 - press * 0.05})`,
                        boxShadow: `0 ${8 + hover * 6}px ${18 + hover * 10}px rgba(31, 79, 176, ${0.25 + hover * 0.1})`,
                    }}
                >
                    {clicked ? (
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${loading * 100}%`, background: "rgba(255, 255, 255, 0.16)" }} />
                    ) : null}
                    <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 700 }}>
                        {clicked ? "Analyse en cours" : "Analyser"}
                        {clicked ? null : <ArrowIcon size={26} color={COLORS.paper} />}
                    </div>
                </div>

                <div
                    style={{
                        position: "absolute",
                        left: 1480,
                        top: 520,
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        opacity: 1 - keysOut,
                        transform: `scale(${lerp(0.6, 1, keysIn) * (1 - keysOut * 0.3)})`,
                    }}
                >
                    <Keycap label="Ctrl" pressed={keyPress} />
                    <div style={{ fontFamily: FONTS.sans, fontSize: 28, fontWeight: 700, color: COLORS.slate }}>+</div>
                    <div style={{ transform: `scale(${lerp(0.4, 1, vIn)})`, opacity: frame >= PASTE.keyV ? 1 : 0 }}>
                        <Keycap label="V" pressed={keyPress} />
                    </div>
                </div>

                <Cursor
                    frame={frame}
                    from={PASTE.cursorIn}
                    keys={[
                        { frame: PASTE.cursorIn, x: 1960, y: 1130 },
                        { frame: PASTE.cursorArrive, x: FORM.button.x + 150, y: FORM.button.y + 36, easing: EASE_OUT_QUART },
                    ]}
                    clicks={[PASTE.click]}
                />
            </World>
        </AbsoluteFill>
    );
}

export function PasteScene() {
    const frame = useCurrentFrame();
    if (frame >= PASTE.whipStart - 2) {
        return (
            <ShutterBlur samples={14} shutterAngle={300}>
                <PasteContent />
            </ShutterBlur>
        );
    }
    return <PasteContent />;
}
