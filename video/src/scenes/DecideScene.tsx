import { evolvePath } from "@remotion/paths";
import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cursor } from "../components/Cursor";
import { CheckIcon, CrossIcon, LoopArrowIcon } from "../components/Icons";
import { RevealText } from "../components/RevealText";
import { ShutterBlur } from "../components/ShutterBlur";
import { DRAFT, LEDGER } from "../data/demo";
import { EASE_IN_CUBIC, EASE_IN_OUT_CUBIC, EASE_OUT_CUBIC, EASE_OUT_EXPO, EASE_OUT_QUART } from "../lib/easing";
import { lerp, mixColor, pop, ramp, SPRING_POP } from "../lib/motion";
import { DECIDE } from "../timeline";
import { CARD_SHADOW, COLORS, FONTS, NBSP } from "../theme";

const BUTTON = { width: 380, height: 116, gap: 44, y: 412 };
const BUTTON_LEFT = 960 - (BUTTON.width * 3 + BUTTON.gap * 2) / 2;
const WINDOW = { x: 360, y: 200, width: 1200, height: 740 };
const SEND = { x: WINDOW.x + 40, y: WINDOW.y + WINDOW.height - 92, width: 190, height: 60 };
const ENVELOPE = { width: 300, height: 200 };

function buttonCenter(index: number): { x: number; y: number } {
    return { x: BUTTON_LEFT + index * (BUTTON.width + BUTTON.gap) + BUTTON.width / 2, y: BUTTON.y + BUTTON.height / 2 };
}

function Tooltip({ text, x, visible }: { text: string; x: number; visible: number }) {
    if (visible <= 0) {
        return null;
    }
    return (
        <div
            style={{
                position: "absolute",
                left: x,
                top: BUTTON.y + BUTTON.height + 22,
                transform: `translateX(-50%) translateY(${(1 - visible) * -10}px)`,
                opacity: visible,
                background: COLORS.ink,
                color: COLORS.paper,
                fontFamily: FONTS.sans,
                fontSize: 28,
                fontWeight: 500,
                padding: "14px 24px",
                borderRadius: 14,
                whiteSpace: "nowrap",
                boxShadow: "0 16px 40px rgba(20, 32, 51, 0.25)",
            }}
        >
            <div style={{ position: "absolute", left: "50%", top: -9, width: 18, height: 18, background: COLORS.ink, transform: "translateX(-50%) rotate(45deg)", borderRadius: 3 }} />
            <span style={{ position: "relative" }}>{text}</span>
        </div>
    );
}

function DecisionButton({ index, label, icon, primary, frame, hover, press, leave }: { index: number; label: string; icon: ReactNode; primary: boolean; frame: number; hover: number; press: number; leave: number }) {
    const drop = pop(frame, DECIDE.buttons[index], SPRING_POP);
    if (drop <= 0 || leave >= 1) {
        return null;
    }
    return (
        <div
            style={{
                position: "absolute",
                left: BUTTON_LEFT + index * (BUTTON.width + BUTTON.gap),
                top: BUTTON.y,
                width: BUTTON.width,
                height: BUTTON.height,
                borderRadius: 18,
                background: primary ? mixColor(COLORS.plan, "#173d8c", hover) : mixColor(COLORS.paper, COLORS.wash, hover),
                border: primary ? "none" : `2.5px solid ${mixColor(COLORS.rule, COLORS.ink, hover)}`,
                boxSizing: "border-box",
                color: primary ? COLORS.paper : COLORS.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                fontFamily: FONTS.sans,
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                boxShadow: primary ? "0 18px 40px rgba(31, 79, 176, 0.3)" : CARD_SHADOW,
                opacity: Math.min(1, drop * 1.5) * (1 - leave),
                transform: `translateY(${(1 - drop) * -90 + leave * 40}px) scale(${(1 - press * 0.05) * (1 - leave * 0.1)})`,
            }}
        >
            {icon}
            {label}
        </div>
    );
}

function Envelope({ frame }: { frame: number }) {
    const morph = ramp(frame, DECIDE.envelope[0], 26, EASE_IN_OUT_CUBIC);
    const fold = ramp(frame, DECIDE.envelope[0] + 14, 20, EASE_IN_OUT_CUBIC);
    const open = ramp(frame, DECIDE.envelope[0] + 34, 18, EASE_OUT_CUBIC);
    const fade = 1 - ramp(frame, DECIDE.draft[0] + 18, 14);
    if (frame < DECIDE.envelope[0] || fade <= 0) {
        return null;
    }
    const center = buttonCenter(0);
    const width = lerp(BUTTON.width, ENVELOPE.width, morph);
    const height = lerp(BUTTON.height, ENVELOPE.height, morph);
    const x = lerp(center.x, 960, morph) - width / 2;
    const y = lerp(center.y, 560, morph) - height / 2;
    const flapPath = `M 0 0 L ${width / 2} ${height * 0.55} L ${width} 0`;
    const evolved = evolvePath(Math.max(0.001, fold), flapPath);
    return (
        <div
            style={{
                position: "absolute",
                left: x,
                top: y,
                width,
                height,
                borderRadius: lerp(18, 10, morph),
                background: mixColor(COLORS.plan, COLORS.paper, morph),
                border: `3px solid ${COLORS.plan}`,
                boxSizing: "border-box",
                boxShadow: "0 24px 60px rgba(31, 79, 176, 0.25)",
                opacity: fade,
                perspective: 600,
            }}
        >
            {morph < 0.5 ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                        color: COLORS.paper,
                        fontFamily: FONTS.sans,
                        fontSize: 40,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        opacity: 1 - morph * 2,
                        transform: `scale(${1 - morph * 0.4})`,
                    }}
                >
                    <CheckIcon size={40} color={COLORS.paper} strokeWidth={3.4} />
                    Valider
                </div>
            ) : null}
            {fold > 0 ? (
                <svg width={width} height={height} style={{ position: "absolute", left: -3, top: -3, overflow: "visible" }}>
                    <path d={flapPath} fill="none" stroke={COLORS.plan} strokeWidth={3} strokeLinejoin="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset} />
                </svg>
            ) : null}
            {open > 0 ? (
                <svg width={width} height={height} style={{ position: "absolute", left: -3, top: -3, overflow: "visible", transform: `rotateX(${open * 180}deg)`, transformOrigin: "50% 0" }}>
                    <path d={`${flapPath} Z`} fill={COLORS.markerSoft} stroke={COLORS.plan} strokeWidth={3} strokeLinejoin="round" />
                </svg>
            ) : null}
        </div>
    );
}

function DraftWindow({ frame }: { frame: number }) {
    const grow = ramp(frame, DECIDE.draft[0], DECIDE.draft[1] - DECIDE.draft[0], EASE_OUT_EXPO);
    if (frame < DECIDE.draft[0]) {
        return null;
    }
    const width = lerp(ENVELOPE.width - 40, WINDOW.width, grow);
    const height = lerp(ENVELOPE.height - 60, WINDOW.height, grow);
    const x = lerp(960 - width / 2, WINDOW.x, grow);
    const y = lerp(530 - height / 2, WINDOW.y, grow);
    const line = (index: number) => {
        const amount = ramp(frame, DECIDE.draft[0] + 16 + index * 3, 18, EASE_OUT_EXPO);
        return { opacity: amount, transform: `translateY(${(1 - amount) * 12}px)` };
    };
    const field = { display: "flex", gap: 20, alignItems: "center", height: 58, borderBottom: `1.5px solid ${COLORS.wash}`, padding: "0 40px", fontFamily: FONTS.sans, fontSize: 23 };
    const body = { fontFamily: FONTS.sans, fontSize: 25, lineHeight: 1.5, color: COLORS.ink };
    return (
        <div
            style={{
                position: "absolute",
                left: x,
                top: y,
                width,
                height,
                borderRadius: 18,
                background: COLORS.paper,
                boxShadow: "0 30px 90px rgba(20, 32, 51, 0.22)",
                overflow: "hidden",
            }}
        >
            <div style={{ width: WINDOW.width, height: WINDOW.height, transform: `scale(${width / WINDOW.width})`, transformOrigin: "0 0" }}>
                <div style={{ ...line(0), display: "flex", alignItems: "center", justifyContent: "space-between", height: 72, padding: "0 40px", background: COLORS.wash }}>
                    <span style={{ fontFamily: FONTS.sans, fontSize: 25, fontWeight: 700, color: COLORS.ink }}>Nouveau message</span>
                    <span style={{ padding: "6px 16px", borderRadius: 999, background: COLORS.draftBanner, color: COLORS.watch, fontFamily: FONTS.sans, fontSize: 21, fontWeight: 700 }}>Brouillon</span>
                </div>
                <div style={{ ...field, ...line(1) }}>
                    <span style={{ color: COLORS.slate, width: 70 }}>À</span>
                    <span style={{ color: COLORS.ink }}>{DRAFT.to}</span>
                </div>
                <div style={{ ...field, ...line(2) }}>
                    <span style={{ color: COLORS.slate, width: 70 }}>Objet</span>
                    <span style={{ color: COLORS.ink, fontWeight: 600 }}>{DRAFT.subject}</span>
                </div>
                <div style={{ padding: "26px 40px 0" }}>
                    <div style={{ ...body, ...line(3) }}>Bonjour,</div>
                    <div style={{ ...body, ...line(4), marginTop: 12 }}>
                        Voici l'étude de rendement du bien que nous vous proposons : <b>{DRAFT.description}</b>.
                    </div>
                    <div style={{ marginTop: 12 }}>
                        {[
                            `Budget total clé en main${NBSP}: ${LEDGER.total}`,
                            `Loyer mensuel estimé après travaux${NBSP}: ${LEDGER.rent}`,
                            `Rendement brut estimé${NBSP}: ${LEDGER.yield}`,
                        ].map((item, index) => (
                            <div key={item} style={{ ...body, ...line(5 + index), paddingLeft: 26 }}>
                                • {item}
                            </div>
                        ))}
                    </div>
                    <div style={{ ...body, ...line(8), marginTop: 12 }}>
                        Le détail est dans l'étude : <span style={{ color: COLORS.plan, textDecoration: "underline" }}>ouvrir l'étude de rendement</span>.
                    </div>
                    <div style={{ ...body, ...line(9), marginTop: 12 }}>Bien cordialement,</div>
                </div>
                <div style={{ position: "absolute", left: 40, top: WINDOW.height - 92, display: "flex", alignItems: "center", gap: 24, ...line(10) }}>
                    <div style={{ width: SEND.width, height: SEND.height, borderRadius: 12, background: COLORS.plan, color: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.sans, fontSize: 26, fontWeight: 700 }}>
                        Envoyer
                    </div>
                    <span style={{ fontFamily: FONTS.sans, fontSize: 21, color: COLORS.slate }}>Brouillon enregistré, non envoyé</span>
                </div>
            </div>
        </div>
    );
}

function DecideContent() {
    const frame = useCurrentFrame();
    const arrive = ramp(frame, 0, DECIDE.arriveEnd, EASE_OUT_CUBIC);
    const hoverRevise = ramp(frame, DECIDE.hoverRevise, 8) * (1 - ramp(frame, DECIDE.hoverReject - 20, 8));
    const hoverReject = ramp(frame, DECIDE.hoverReject, 8) * (1 - ramp(frame, DECIDE.clickApprove - 26, 8));
    const hoverApprove = ramp(frame, DECIDE.clickApprove - 6, 6);
    const press = frame >= DECIDE.clickApprove && frame < DECIDE.clickApprove + 10 ? Math.sin(((frame - DECIDE.clickApprove) / 10) * Math.PI) : 0;
    const othersLeave = ramp(frame, DECIDE.envelope[0], 18, EASE_IN_CUBIC);
    const approveGone = frame >= DECIDE.envelope[0] ? 1 : 0;
    const headlineLeave = DECIDE.envelope[0] + 4;
    const scrim = ramp(frame, DECIDE.silence[0], 18, EASE_IN_OUT_CUBIC);
    const revise = buttonCenter(1);
    const reject = buttonCenter(2);
    const approve = buttonCenter(0);

    return (
        <AbsoluteFill style={{ background: COLORS.wash }}>
            <AbsoluteFill style={{ transform: `translateY(${(1 - arrive) * 1300}px)` }}>
                <RevealText text="Vous décidez." start={DECIDE.headlineIn} exit={headlineLeave} size={64} style={{ position: "absolute", left: 90, top: 150 }} frame={frame} />
                <DecisionButton index={0} label="Valider" primary frame={frame} hover={hoverApprove} press={press} leave={approveGone} icon={<CheckIcon size={40} color={COLORS.paper} strokeWidth={3.4} />} />
                <DecisionButton index={1} label="Corriger" primary={false} frame={frame} hover={hoverRevise} press={0} leave={othersLeave} icon={<LoopArrowIcon size={38} color={COLORS.ink} strokeWidth={2.8} />} />
                <DecisionButton index={2} label="Rejeter" primary={false} frame={frame} hover={hoverReject} press={0} leave={othersLeave} icon={<CrossIcon size={36} color={COLORS.ink} strokeWidth={3.2} />} />
                <Tooltip text="Recalcul sans IA, même lien." x={revise.x} visible={ramp(frame, DECIDE.hoverRevise + 4, 12, EASE_OUT_EXPO) * (1 - ramp(frame, DECIDE.hoverReject - 16, 8))} />
                <Tooltip text="Classée, avec votre remarque." x={reject.x} visible={ramp(frame, DECIDE.hoverReject + 4, 12, EASE_OUT_EXPO) * (1 - ramp(frame, DECIDE.clickApprove - 24, 8))} />
                <Envelope frame={frame} />
                <DraftWindow frame={frame} />
                <Cursor
                    frame={frame}
                    from={DECIDE.cursorIn}
                    keys={[
                        { frame: DECIDE.cursorIn, x: 1720, y: 1010 },
                        { frame: DECIDE.hoverRevise, x: revise.x + 30, y: revise.y + 18, easing: EASE_OUT_QUART },
                        { frame: DECIDE.hoverReject - 30, x: revise.x + 30, y: revise.y + 18 },
                        { frame: DECIDE.hoverReject, x: reject.x + 30, y: reject.y + 18, easing: EASE_OUT_QUART },
                        { frame: DECIDE.clickApprove - 50, x: reject.x + 30, y: reject.y + 18 },
                        { frame: DECIDE.clickApprove - 4, x: approve.x + 30, y: approve.y + 18, easing: EASE_OUT_QUART },
                        { frame: DECIDE.approachSend[0], x: approve.x + 60, y: approve.y + 140 },
                        { frame: DECIDE.approachSend[1], x: SEND.x + SEND.width * 0.66, y: SEND.y - 30, easing: EASE_OUT_QUART },
                    ]}
                    clicks={[DECIDE.clickApprove]}
                />
            </AbsoluteFill>
            {scrim > 0 ? <AbsoluteFill style={{ background: `rgba(238, 242, 246, ${0.9 * scrim})` }} /> : null}
            <RevealText
                text={"Rien ne part\nsans vous."}
                start={DECIDE.finalTitle}
                size={136}
                weight={800}
                lineHeight={1.02}
                letterSpacing="-0.045em"
                align="center"
                stagger={5}
                duration={28}
                marks={[{ words: [3, 4], start: DECIDE.finalTitle + 30, duration: 10 }]}
                style={{ position: "absolute", left: 0, right: 0, top: 540 - 136 * 1.02 }}
                frame={frame}
            />
        </AbsoluteFill>
    );
}

export function DecideScene() {
    const frame = useCurrentFrame();
    if (frame <= DECIDE.arriveEnd) {
        return (
            <ShutterBlur samples={14} shutterAngle={300}>
                <DecideContent />
            </ShutterBlur>
        );
    }
    return <DecideContent />;
}

