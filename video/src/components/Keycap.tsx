import { COLORS, FONTS } from "../theme";

export function Keycap({ label, pressed }: { label: string; pressed: number }) {
    return (
        <div
            style={{
                padding: "8px 18px",
                minWidth: 64,
                textAlign: "center",
                background: COLORS.paper,
                border: `2px solid ${COLORS.rule}`,
                borderBottomWidth: 6 - pressed * 4,
                borderRadius: 12,
                transform: `translateY(${pressed * 4}px)`,
                fontFamily: FONTS.mono,
                fontSize: 26,
                fontWeight: 700,
                color: COLORS.ink,
                boxShadow: "0 10px 24px rgba(20, 32, 51, 0.16)",
            }}
        >
            {label}
        </div>
    );
}
