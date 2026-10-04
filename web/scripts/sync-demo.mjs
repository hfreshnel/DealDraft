import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const copies = [
    ["eval/demo/demo.json", "web/data/demo.json"],
    ["eval/demo/report.html", "web/public/demo/report.html"],
];

try {
    for (const [from, to] of copies) {
        mkdirSync(dirname(resolve(root, to)), { recursive: true });
        copyFileSync(resolve(root, from), resolve(root, to));
        console.log(`${from} -> ${to}`);
    }
} catch (error) {
    console.error("Demo sync failed", error);
    process.exit(1);
}
