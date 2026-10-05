// Renders chosen frames of the film as PNG, bundling once: node scripts/stills.ts [--scale=0.5] [--out=out/stills] 120 480 ...
import bundler from "@remotion/bundler";
import { ensureBrowser, openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name: string, fallback: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const scale = Number(option("scale", "1"));
const outDir = path.resolve(root, option("out", "out/stills"));
const compositionId = option("composition", "DealDraftFilm");
const frames = args.filter((arg) => !arg.startsWith("--")).map(Number);

if (frames.length === 0 || frames.some((frame) => !Number.isInteger(frame) || frame < 0)) {
    console.error("Usage: node scripts/stills.ts [--scale=0.5] [--out=dir] <frame> [frame...]");
    process.exit(1);
}

mkdirSync(outDir, { recursive: true });

try {
    const serveUrl = await bundler.bundle({ entryPoint: path.join(root, "src", "index.ts"), onProgress: () => undefined });
    await ensureBrowser();
    const browser = await openBrowser("chrome");
    const inputProps = { withAudio: false };
    const composition = await selectComposition({ serveUrl, id: compositionId, inputProps, puppeteerInstance: browser });
    for (const frame of frames) {
        const output = path.join(outDir, `f${String(frame).padStart(5, "0")}.png`);
        const started = Date.now();
        await renderStill({ composition, serveUrl, output, frame, imageFormat: "png", scale, inputProps, puppeteerInstance: browser, overwrite: true });
        console.log(`${output} (${Date.now() - started} ms)`);
    }
    await browser.close({ silent: true });
} catch (error) {
    console.error("Still rendering failed:", error);
    process.exit(1);
}
