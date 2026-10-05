import { EASE_OUT_EXPO } from "../lib/easing";
import { clamp01, mixColor, ramp } from "../lib/motion";
import { CHECK, READ, SCENES, type SceneKey } from "../timeline";
import { COLORS, FONTS } from "../theme";

const CHAPTERS: { scene: SceneKey; number: string; label: string }[] = [
    { scene: "paste", number: "01", label: "Collez" },
    { scene: "read", number: "02", label: "Lecture" },
    { scene: "check", number: "03", label: "Contrôle" },
    { scene: "compute", number: "04", label: "Calcul" },
    { scene: "report", number: "05", label: "Fiche" },
    { scene: "decide", number: "06", label: "Décision" },
];

const FIRST = SCENES.paste.from + 28;
const LAST = SCENES.decide.from + SCENES.decide.duration;

// 0 on paper, 1 when the chapter sits on the dark validation set.
function darkness(frame: number): number {
    const zoomStart = SCENES.read.from + READ.zoomStart + 60;
    const zoomEnd = SCENES.read.from + READ.zoomEnd;
    const irisStart = SCENES.check.from + CHECK.irisStart + 20;
    const irisEnd = SCENES.check.from + CHECK.irisEnd;
    return clamp01((frame - zoomStart) / (zoomEnd - zoomStart)) * (1 - clamp01((frame - irisStart) / (irisEnd - irisStart)));
}

function Label({ number, label, offset, ink, accent }: { number: string; label: string; offset: number; ink: string; accent: string }) {
    return (
        <div style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "baseline", gap: 12, transform: `translateY(${offset}%)`, whiteSpace: "nowrap" }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 600, color: accent }}>{number}</span>
            <span style={{ fontFamily: FONTS.sans, fontSize: 26, fontWeight: 600, color: ink, letterSpacing: "-0.01em" }}>{label}</span>
        </div>
    );
}

export function ChapterTag({ frame }: { frame: number }) {
    if (frame < FIRST || frame >= LAST) {
        return null;
    }
    let current = 0;
    CHAPTERS.forEach((chapter, index) => {
        if (frame >= SCENES[chapter.scene].from) {
            current = index;
        }
    });
    const chapterStart = Math.max(FIRST, SCENES[CHAPTERS[current].scene].from);
    const roll = ramp(frame, chapterStart, 22, EASE_OUT_EXPO);
    const appear = ramp(frame, FIRST, 26, EASE_OUT_EXPO);
    const dark = darkness(frame);
    const ink = mixColor(COLORS.ink, COLORS.nightInk, dark);
    const accent = mixColor(COLORS.plan, COLORS.nightPlan, dark);
    const track = mixColor(COLORS.rule, COLORS.nightRule, dark);

    return (
        <div style={{ position: "absolute", left: 90, top: 54, opacity: appear }}>
            <div style={{ position: "relative", width: 420, height: 36, overflow: "hidden" }}>
                {current > 0 && roll < 1 ? (
                    <Label number={CHAPTERS[current - 1].number} label={CHAPTERS[current - 1].label} offset={-roll * 110} ink={ink} accent={accent} />
                ) : null}
                <Label number={CHAPTERS[current].number} label={CHAPTERS[current].label} offset={(1 - roll) * 110 * (current > 0 ? 1 : 1 - appear)} ink={ink} accent={accent} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {CHAPTERS.map((chapter, index) => {
                    const slot = SCENES[chapter.scene];
                    const fill = index < current ? 1 : index > current ? 0 : clamp01((frame - slot.from) / slot.duration);
                    return (
                        <div key={chapter.scene} style={{ width: 36, height: 4, borderRadius: 2, background: track, overflow: "hidden" }}>
                            <div style={{ width: `${fill * 100}%`, height: "100%", background: accent }} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
