import { loadFont } from "@remotion/fonts";
import monoLatinExt from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-ext-wght-normal.woff2";
import monoLatin from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2";
import sansLatinExt from "@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-ext-wght-normal.woff2";
import sansLatin from "@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2";
import { FONT_FAMILY } from "./theme";

// Unicode ranges from the Fontsource stylesheets: latin covers French accents, € and typographic quotes.
const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

const FACES = [
    { family: FONT_FAMILY.sans, url: sansLatin, weight: "400 900", unicodeRange: LATIN },
    { family: FONT_FAMILY.sans, url: sansLatinExt, weight: "400 900", unicodeRange: LATIN_EXT },
    { family: FONT_FAMILY.mono, url: monoLatin, weight: "100 800", unicodeRange: LATIN },
    { family: FONT_FAMILY.mono, url: monoLatinExt, weight: "100 800", unicodeRange: LATIN_EXT },
];

let fontsPromise: Promise<void> | null = null;

export function loadAllFonts(): Promise<void> {
    if (fontsPromise === null) {
        fontsPromise = Promise.all(FACES.map((face) => loadFont({ ...face, format: "woff2", display: "block" }))).then(() => undefined);
    }
    return fontsPromise;
}
