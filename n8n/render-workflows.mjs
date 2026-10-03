// Replaces __CONFIG_<key>__ tokens in the committed workflows with values from config.local.json,
// so account-specific ids (spreadsheet, Drive folder) never reach git.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKFLOW_DIR = join(ROOT_DIR, 'workflows');
const OUTPUT_DIR = join(ROOT_DIR, '.rendered');
const CONFIG_FILE = join(ROOT_DIR, 'config.local.json');
const TOKEN_PATTERN = /__CONFIG_([A-Za-z0-9]+)__/g;

try {
    let config;
    try {
        config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    } catch (error) {
        throw new Error(`Cannot read ${CONFIG_FILE} (copy config.example.json first): ${error.message}`);
    }
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(OUTPUT_DIR);

    let renderedCount = 0;
    for (const fileName of readdirSync(WORKFLOW_DIR).filter((name) => name.endsWith('.json'))) {
        const source = readFileSync(join(WORKFLOW_DIR, fileName), 'utf8');
        const missingKeys = new Set();
        const rendered = source.replace(TOKEN_PATTERN, (token, key) => {
            const value = config[key];
            if (typeof value !== 'string' || value === '') {
                missingKeys.add(key);
                return token;
            }
            // Values land inside JSON strings: escape them the same way.
            return JSON.stringify(value).slice(1, -1);
        });
        if (missingKeys.size > 0) {
            console.warn(`${fileName}: skipped, missing config: ${[...missingKeys].join(', ')}`);
            continue;
        }
        JSON.parse(rendered);
        writeFileSync(join(OUTPUT_DIR, fileName), rendered);
        renderedCount += 1;
        console.log(`${fileName}: rendered`);
    }
    if (renderedCount === 0) {
        throw new Error('No workflow rendered');
    }
} catch (error) {
    console.error(`render-workflows failed: ${error.message}`);
    process.exit(1);
}
