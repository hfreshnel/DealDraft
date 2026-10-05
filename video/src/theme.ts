// Tokens copied from web/app/globals.css so the film and the product page share one identity.
export const COLORS = {
    paper: "#ffffff",
    wash: "#eef2f6",
    ink: "#142033",
    slate: "#4d5a6c",
    rule: "#d6dde6",
    plan: "#1f4fb0",
    marker: "#ffe35a",
    markerSoft: "#fff5bf",
    markerDeep: "#dfae00",
    watchSoft: "#ffd9a0",
    met: "#19704f",
    watch: "#a0610a",
    refused: "#b3261e",
    draftBanner: "#fde7b0",
    night: "#070b12",
    nightPaper: "#0f1623",
    nightWash: "#162032",
    nightInk: "#e7ecf3",
    nightSlate: "#9eabbd",
    nightRule: "#283549",
    nightPlan: "#84a9f7",
    nightMarker: "#f3d84c",
    nightMet: "#6fd0a6",
    nightWatch: "#f0b860",
    nightRefused: "#ff8a7a",
} as const;

export const FONT_FAMILY = {
    sans: "Schibsted Grotesk",
    mono: "JetBrains Mono",
};

export const FONTS = {
    sans: `"${FONT_FAMILY.sans}", "Helvetica Neue", Arial, sans-serif`,
    mono: `"${FONT_FAMILY.mono}", Consolas, monospace`,
    doc: "Arial, Helvetica, sans-serif",
};

export const SAFE = 90;

export const SHEET_SHADOW = "0 2px 4px rgba(20, 32, 51, 0.06), 0 28px 70px rgba(20, 32, 51, 0.14)";
export const CARD_SHADOW = "0 1px 2px rgba(20, 32, 51, 0.06), 0 14px 40px rgba(20, 32, 51, 0.10)";

export const NBSP = " ";
