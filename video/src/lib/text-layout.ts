import { measureText } from "@remotion/layout-utils";
import { FONTS } from "../theme";

export type TextStyle = { fontSize: number; fontWeight: number; fontFamily?: string; letterSpacing?: string; fontVariantNumeric?: string };

export function textWidth(text: string, style: TextStyle): number {
    if (text.length === 0) {
        return 0;
    }
    return measureText({
        text,
        fontFamily: style.fontFamily ?? FONTS.sans,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        // measureText caches by a key that ignores fontVariantNumeric; additionalStyles is part of the key.
        additionalStyles: style.fontVariantNumeric === "tabular-nums" ? { fontFeatureSettings: '"tnum"' } : undefined,
        validateFontIsLoaded: true,
    }).width;
}

export type MessageLine = { text: string; start: number; weight: number };

// Greedy wrap that never breaks inside an excerpt, so every highlight sits on a single line.
export function layoutMessage(text: string, atoms: string[], maxWidth: number, style: TextStyle, firstParagraphWeight?: number): MessageLine[] {
    const ranges = atoms.map((atom) => {
        const start = text.indexOf(atom);
        if (start < 0) {
            throw new Error(`Excerpt not found in the message: "${atom}"`);
        }
        return [start, start + atom.length] as const;
    });
    const isProtected = (position: number) => ranges.some(([start, end]) => position > start && position < end);

    const lines: MessageLine[] = [];
    let paragraphStart = 0;
    text.split("\n").forEach((paragraph, paragraphIndex) => {
        const weight = paragraphIndex === 0 && firstParagraphWeight !== undefined ? firstParagraphWeight : style.fontWeight;
        const lineStyle = { ...style, fontWeight: weight };
        if (paragraph.length === 0) {
            lines.push({ text: "", start: paragraphStart, weight });
            paragraphStart += 1;
            return;
        }
        const words: { start: number; end: number }[] = [];
        let wordStart = 0;
        for (let position = 0; position <= paragraph.length; position += 1) {
            if (position === paragraph.length || (paragraph[position] === " " && !isProtected(paragraphStart + position))) {
                words.push({ start: wordStart, end: position });
                wordStart = position + 1;
            }
        }
        let current = { ...words[0] };
        for (let index = 1; index < words.length; index += 1) {
            if (textWidth(paragraph.slice(current.start, words[index].end), lineStyle) <= maxWidth) {
                current.end = words[index].end;
            } else {
                lines.push({ text: paragraph.slice(current.start, current.end), start: paragraphStart + current.start, weight });
                current = { ...words[index] };
            }
        }
        lines.push({ text: paragraph.slice(current.start, current.end), start: paragraphStart + current.start, weight });
        paragraphStart += paragraph.length + 1;
    });
    return lines;
}

export type ExcerptBox = { line: number; x: number; width: number };

export function locateExcerpt(text: string, lines: MessageLine[], excerpt: string, style: TextStyle): ExcerptBox {
    const start = text.indexOf(excerpt);
    const line = lines.findIndex((item) => start >= item.start && start + excerpt.length <= item.start + item.text.length);
    if (start < 0 || line < 0) {
        throw new Error(`Excerpt "${excerpt}" does not fit on one line`);
    }
    const lineStyle = { ...style, fontWeight: lines[line].weight };
    return {
        line,
        x: textWidth(text.slice(lines[line].start, start), lineStyle),
        width: textWidth(excerpt, lineStyle),
    };
}
