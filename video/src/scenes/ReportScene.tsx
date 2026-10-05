import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DocIcon, FolderIcon, SheetIcon } from "../components/Icons";
import { ReportPage, REPORT_HEIGHT } from "../components/ReportPage";
import { RevealText } from "../components/RevealText";
import { ShutterBlur } from "../components/ShutterBlur";
import { World } from "../components/World";
import { LEDGER, REPORT_META } from "../data/demo";
import { DOC, docIntroPose } from "../layout";
import { EASE_IN_CUBIC, EASE_IN_OUT_CUBIC, EASE_IN_OUT_EXPO, EASE_IN_OUT_QUART, EASE_OUT_CUBIC, EASE_OUT_EXPO } from "../lib/easing";
import { clamp01, lerp, pop, poseAt, ramp, SPRING_POP } from "../lib/motion";
import { REPORT } from "../timeline";
import { COLORS, FONTS } from "../theme";

const OVERVIEW_SCALE = 0.36;
const SCROLL_DISTANCE = 2050;
const PAGE_CENTER_Y = DOC.y + REPORT_HEIGHT / 2;
const CARD = { x: 112, y: 412, width: 756, height: 74 };
const DRIVE = { x: 90, y: 330, width: 800, height: 560 };
const SHEET = { x: 950, y: 330, width: 880, height: 560 };
const COLUMNS = [
    { name: "studyId", width: 150 },
    { name: "status", width: 150 },
    { name: "listingTitle", width: 250 },
    { name: "totalBudget", width: 150 },
    { name: "grossYield…", width: 140 },
];

function FileCard({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div style={{ width: CARD.width, height: CARD.height, display: "flex", alignItems: "center", gap: 16, padding: "0 18px", boxSizing: "border-box", background: COLORS.paper, borderRadius: 12, border: `1.5px solid ${COLORS.rule}` }}>
            <DocIcon size={40} color={COLORS.plan} />
            <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONTS.sans, fontSize: 21, fontWeight: 600, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
                <div style={{ fontFamily: FONTS.sans, fontSize: 18, color: COLORS.slate }}>{subtitle}</div>
            </div>
        </div>
    );
}

function Skeleton({ width, opacity = 1 }: { width: number; opacity?: number }) {
    return <div style={{ width, height: 12, borderRadius: 6, background: COLORS.rule, opacity }} />;
}

function DrivePanel({ frame }: { frame: number }) {
    const appear = ramp(frame, REPORT.flipStart + 34, 34, EASE_OUT_EXPO);
    return (
        <div
            style={{
                position: "absolute",
                left: DRIVE.x,
                top: DRIVE.y,
                width: DRIVE.width,
                height: DRIVE.height,
                background: COLORS.paper,
                borderRadius: 18,
                boxShadow: "0 20px 60px rgba(20, 32, 51, 0.12)",
                opacity: appear,
                transform: `translateX(${(1 - appear) * -60}px)`,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 22px 0", fontFamily: FONTS.sans, fontSize: 23, color: COLORS.slate }}>
                <FolderIcon size={30} color={COLORS.slate} />
                <span>Google Drive</span>
                <span style={{ color: COLORS.rule }}>›</span>
                <span>DealDraft</span>
                <span style={{ color: COLORS.rule }}>›</span>
                <span style={{ color: COLORS.ink, fontWeight: 600 }}>Études</span>
            </div>
            {[0, 1, 2, 3].map((index) => (
                <div key={index} style={{ position: "absolute", left: 22, right: 22, top: CARD.y - DRIVE.y + CARD.height + 16 + index * 82, height: 70, display: "flex", alignItems: "center", gap: 16, padding: "0 18px", borderRadius: 12, border: `1.5px solid ${COLORS.wash}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: COLORS.wash }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Skeleton width={360 - index * 40} />
                        <Skeleton width={160} opacity={0.6} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SheetPanel({ frame }: { frame: number }) {
    const appear = ramp(frame, REPORT.flipStart + 44, 34, EASE_OUT_EXPO);
    const slide = ramp(frame, REPORT.rowSlide, 22, EASE_OUT_EXPO);
    const chip = pop(frame, REPORT.statusChip, SPRING_POP);
    const flash = clamp01(1 - (frame - REPORT.rowSlide - 10) / 40);
    const values = [REPORT_META.studyId, "", REPORT_META.listingTitle, LEDGER.total, LEDGER.yield];
    return (
        <div
            style={{
                position: "absolute",
                left: SHEET.x,
                top: SHEET.y,
                width: SHEET.width,
                height: SHEET.height,
                background: COLORS.paper,
                borderRadius: 18,
                boxShadow: "0 20px 60px rgba(20, 32, 51, 0.12)",
                overflow: "hidden",
                opacity: appear,
                transform: `translateX(${(1 - appear) * 60}px)`,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 22px 18px", fontFamily: FONTS.sans, fontSize: 23, color: COLORS.slate }}>
                <SheetIcon size={30} color={COLORS.met} />
                <span>Google Sheets</span>
                <span style={{ marginLeft: 18, padding: "4px 14px", borderRadius: 8, background: COLORS.wash, color: COLORS.ink, fontWeight: 600 }}>Suivi</span>
                <span style={{ padding: "4px 14px" }}>Journal</span>
            </div>
            <div style={{ display: "flex", borderTop: `1.5px solid ${COLORS.rule}`, borderBottom: `1.5px solid ${COLORS.rule}`, background: COLORS.wash, height: 46, alignItems: "center", paddingLeft: 12 }}>
                {COLUMNS.map((column) => (
                    <div key={column.name} style={{ width: column.width, fontFamily: FONTS.mono, fontSize: 17, fontWeight: 700, color: COLORS.ink, paddingLeft: 10, whiteSpace: "nowrap" }}>
                        {column.name}
                    </div>
                ))}
            </div>
            <div style={{ position: "relative", height: 62, overflow: "hidden", borderBottom: `1.5px solid ${COLORS.rule}`, background: `rgba(255, 227, 90, ${0.28 * (frame >= REPORT.rowSlide ? flash : 0)})` }}>
                <div style={{ display: "flex", alignItems: "center", height: 62, paddingLeft: 12, transform: `translateY(${(1 - slide) * -62}px)`, opacity: slide }}>
                    {COLUMNS.map((column, index) => (
                        <div key={column.name} style={{ width: column.width, paddingLeft: 10, fontFamily: index === 0 ? FONTS.mono : FONTS.sans, fontSize: 19, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: index >= 3 ? 600 : 400 }}>
                            {index === 1 ? (
                                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: COLORS.draftBanner, color: COLORS.watch, fontWeight: 700, fontSize: 18, transform: `scale(${chip})` }}>À valider</span>
                            ) : (
                                values[index]
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", height: 62, paddingLeft: 22, gap: 30, borderBottom: `1.5px solid ${COLORS.wash}` }}>
                    {COLUMNS.map((column) => (
                        <Skeleton key={column.name} width={column.width - 50} opacity={0.75 - index * 0.1} />
                    ))}
                </div>
            ))}
        </div>
    );
}

function ReportContent() {
    const frame = useCurrentFrame();
    const intro = docIntroPose();
    // The camera keeps its tilt while the page slides within its own plane, so the area under the lens stays at depth zero.
    const scroll = -SCROLL_DISTANCE * ramp(frame, 70, REPORT.flyEnd - 8 - 70, EASE_IN_OUT_CUBIC);
    const overviewY = -(PAGE_CENTER_Y - SCROLL_DISTANCE - 540) * OVERVIEW_SCALE;
    const pose = poseAt(frame, [
        { frame: 0, pose: { scale: intro.scale, x: intro.x, y: intro.y } },
        { frame: REPORT.landEnd + 10, pose: { scale: 1, x: 0, y: 0 }, easing: EASE_IN_OUT_EXPO },
        { frame: 96, pose: { rx: 34, rz: -8, scale: 1.12, x: 20 }, easing: EASE_IN_OUT_CUBIC },
        { frame: REPORT.flyEnd - 8, pose: { x: -30, rz: -6 }, easing: EASE_IN_OUT_CUBIC },
        { frame: REPORT.flipStart + 20, pose: { rx: 0, rz: 0, scale: OVERVIEW_SCALE, x: 0, y: overviewY }, easing: EASE_IN_OUT_QUART },
    ]);
    const flipOut = ramp(frame, REPORT.flipStart + 18, 16, EASE_IN_CUBIC);
    const flipIn = ramp(frame, REPORT.flipStart + 34, 18, EASE_OUT_CUBIC);
    const drop = ramp(frame, REPORT.drop[0], REPORT.drop[1] - REPORT.drop[0], EASE_IN_OUT_CUBIC);
    const whip = ramp(frame, REPORT.whipStart, REPORT.whipEnd - REPORT.whipStart, EASE_IN_CUBIC);
    const pageVisible = flipOut < 1;
    const cardVisible = frame >= REPORT.flipStart + 34;
    const cardScale = lerp(1.3, 1, drop);
    const cardX = lerp(960 - CARD.width / 2, CARD.x, drop);
    const cardY = lerp(540 - CARD.height / 2, CARD.y, drop);

    return (
        <AbsoluteFill style={{ background: COLORS.wash }}>
            <AbsoluteFill style={{ transform: `translateY(${-1300 * whip}px)` }}>
                {pageVisible ? (
                    <World pose={pose} perspective={1500}>
                        <div style={{ position: "absolute", inset: 0, transform: `translateY(${scroll}px)`, transformStyle: "preserve-3d" }}>
                            <div style={{ position: "absolute", inset: 0, transform: `rotateY(${flipOut * 90}deg)`, transformOrigin: `${DOC.x + DOC.width / 2}px ${PAGE_CENTER_Y}px`, transformStyle: "preserve-3d" }}>
                                <ReportPage frame={frame} timing={{ buildStart: 8, passes: REPORT.passes }} />
                            </div>
                        </div>
                    </World>
                ) : null}
                <DrivePanel frame={frame} />
                <SheetPanel frame={frame} />
                {cardVisible ? (
                    <div
                        style={{
                            position: "absolute",
                            left: cardX,
                            top: cardY,
                            transform: `perspective(1200px) rotateY(${(1 - flipIn) * -90}deg) scale(${cardScale})`,
                            transformOrigin: "50% 50%",
                            boxShadow: `0 ${lerp(30, 4, drop)}px ${lerp(70, 12, drop)}px rgba(20, 32, 51, ${lerp(0.25, 0.08, drop)})`,
                            borderRadius: 12,
                        }}
                    >
                        <FileCard title={REPORT_META.title} subtitle={frame >= REPORT.drop[1] ? "Google Docs · ajoutée à l'instant" : "Google Docs"} />
                    </div>
                ) : null}
                <RevealText
                    text={"Rangée dans Google Drive.\nSuivie dans Google Sheets."}
                    start={REPORT.captionTwoIn}
                    size={54}
                    lineHeight={1.08}
                    style={{ position: "absolute", left: 90, top: 140 }}
                    frame={frame}
                />
            </AbsoluteFill>
            {frame >= REPORT.captionIn - 4 && frame < REPORT.captionOut + 24 ? (
                <>
                    <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(238, 242, 246, 0.96) 0%, rgba(238, 242, 246, 0.82) 22%, rgba(238, 242, 246, 0) 42%)", opacity: ramp(frame, REPORT.captionIn - 4, 20) * (1 - ramp(frame, REPORT.captionOut, 20)) }} />
                    <RevealText text="Chaque chiffre garde sa source." start={REPORT.captionIn} exit={REPORT.captionOut} size={60} style={{ position: "absolute", left: 90, top: 902 }} frame={frame} />
                </>
            ) : null}
        </AbsoluteFill>
    );
}

export function ReportScene() {
    const frame = useCurrentFrame();
    if (frame >= REPORT.whipStart - 2) {
        return (
            <ShutterBlur samples={14} shutterAngle={300}>
                <ReportContent />
            </ShutterBlur>
        );
    }
    return <ReportContent />;
}
