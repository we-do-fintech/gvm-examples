#!/usr/bin/env node
/**
 * Generate the Open Graph cards (1200×630) into src/assets/og/.
 *
 *   npm run og:image
 *
 * This is deliberately NOT part of `npm run build`: the PNGs are committed, so
 * the deploy only copies them. Run this locally when the card copy changes.
 *
 * Steps:
 *   1. render the /og-image/<key>-<lang>/ pages (Eleventy with OG_BUILD=1),
 *   2. screenshot each one in headless Chrome at 1200×630,
 *   3. write the PNGs to src/assets/og/.
 *
 * Chrome is used through its own CLI (no Playwright dependency); set
 * CHROME_PATH to override the binary.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { cards } = require(resolve(ROOT, "src/_data/og.js"));

const WIDTH = 1200;
const HEIGHT = 630;
const STAGE = join(ROOT, ".og-build");
const OUT_DIR = join(ROOT, "src/assets/og");

const CHROME_CANDIDATES = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
    console.error(
        "No Chrome found. Set CHROME_PATH to a Chrome/Chromium binary and retry."
    );
    process.exit(1);
}

console.log("→ rendering the OG card pages (Eleventy, OG_BUILD=1)…");
execFileSync("npx", ["eleventy", "--output", STAGE], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, OG_BUILD: "1" },
});

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

console.log("→ screenshotting in headless Chrome…");
for (const card of cards) {
    const source = join(STAGE, "og-image", `${card.key}-${card.lang}`, "index.html");
    if (!existsSync(source)) {
        console.error(`  ✗ missing ${source}`);
        process.exit(1);
    }
    const target = join(OUT_DIR, card.file);
    execFileSync(
        chrome,
        [
            "--headless",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-sandbox",
            "--force-device-scale-factor=1",
            `--window-size=${WIDTH},${HEIGHT}`,
            "--virtual-time-budget=1500",
            `--screenshot=${target}`,
            "file://" + source,
        ],
        { stdio: ["ignore", "ignore", "ignore"] }
    );
    console.log(`  ✓ ${card.file}`);
}

rmSync(STAGE, { recursive: true, force: true });
console.log(`\nDone: ${cards.length} cards in src/assets/og/`);
