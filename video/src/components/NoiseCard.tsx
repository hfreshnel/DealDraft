import type { NoiseItem } from "../data/demo";
import { mulberry32 } from "../timeline";
import { COLORS, FONTS } from "../theme";
import { DocIcon, NoteIcon, PlayIcon } from "./Icons";

const CARD_WIDTH = 430;

export function NoiseCard({ item, seed }: { item: NoiseItem; seed: number }) {
    const base = {
        width: CARD_WIDTH,
        fontFamily: FONTS.sans,
        color: COLORS.nightInk,
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
    };

    if (item.kind === "message") {
        return (
            <div style={{ ...base, background: COLORS.nightWash, borderRadius: "26px 26px 26px 8px", padding: "20px 26px 22px" }}>
                <div style={{ fontSize: 19, fontWeight: 600, color: COLORS.nightPlan, marginBottom: 6 }}>{item.from}</div>
                <div style={{ fontSize: 26, lineHeight: 1.38 }}>{item.text}</div>
            </div>
        );
    }

    if (item.kind === "note") {
        return (
            <div style={{ ...base, background: COLORS.nightPaper, border: `1.5px solid ${COLORS.nightRule}`, borderRadius: 16, padding: "18px 24px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, fontWeight: 600, color: COLORS.nightMarker, marginBottom: 8 }}>
                    <NoteIcon size={24} />
                    Notes de visite
                </div>
                <div style={{ fontSize: 25, lineHeight: 1.4 }}>{item.text}</div>
            </div>
        );
    }

    if (item.kind === "voice") {
        const random = mulberry32(seed);
        return (
            <div style={{ ...base, width: 360, background: COLORS.nightWash, borderRadius: "26px 26px 26px 8px", padding: "18px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                <PlayIcon size={44} />
                <div style={{ display: "flex", alignItems: "center", gap: 4, height: 44, flex: 1 }}>
                    {Array.from({ length: 26 }, (_, index) => (
                        <span key={index} style={{ width: 5, borderRadius: 3, height: 8 + random() * 32, background: COLORS.nightSlate }} />
                    ))}
                </div>
                <div style={{ fontSize: 21, color: COLORS.nightSlate, fontFamily: FONTS.mono }}>{item.duration}</div>
            </div>
        );
    }

    if (item.kind === "file") {
        return (
            <div style={{ ...base, width: 400, background: COLORS.nightPaper, border: `1.5px solid ${COLORS.nightRule}`, borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                <DocIcon size={52} color={COLORS.refused} />
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 600, whiteSpace: "nowrap" }}>{item.name}</div>
                    <div style={{ fontSize: 19, color: COLORS.nightSlate }}>{item.detail}</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ ...base, width: 360, background: COLORS.nightPaper, border: `1.5px solid ${COLORS.nightRule}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ height: 130, background: `linear-gradient(135deg, ${COLORS.nightRule}, ${COLORS.nightWash})` }} />
            <div style={{ padding: "14px 20px 18px" }}>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.nightMarker, marginTop: 4 }}>{item.price}</div>
            </div>
        </div>
    );
}
