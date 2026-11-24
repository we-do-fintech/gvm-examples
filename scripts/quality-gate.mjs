#!/usr/bin/env node
/**
 * Quality gate for the GetViaMsg showcase.
 *
 *   npm run build && npm run gate
 *
 * Two independent checks:
 *
 * 1. COPY (on `src/`, not `dist/`). We scan the page templates, the shared
 *    i18n strings and the site metadata — i.e. everything a visitor reads as
 *    UI chrome. We deliberately do NOT scan `dist/`, because the editorial
 *    article body comes from `content/*.md` and is allowed to use industry
 *    words like "paywall". Front matter `title` and `crumb` are included
 *    (they show in the tab and in the example bar); `description` is not.
 *
 * 2. STRUCTURE (on `dist/`). The invariants that have actually broken before:
 *    a paywall template injected into an element that does not exist (it then
 *    lands on <body>, i.e. behind the footer), duplicate ids, dead internal
 *    links, and leftover developer-kit blocks.
 *
 * Exit code 1 = gate failed. Every violation is printed with context.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const SRC = "src";

/* --- copy rules ---------------------------------------------------------- */

const HARD = [
    [/\bpaywall\w*/i, "jargon: paywall"],
    [/\bpartial\w*/i, "jargon: partial"],
    [/\btenant\w*/i, "jargon: tenant"],
    [/gvm\.js/i, "jargon: gvm.js"],
    [/\bSDK\b/, "jargon: SDK"],
    [/strategi/i, "jargon: strategia"],
    [/data-gvm/i, "jargon: data-gvm"],
    [/wdft_showcase/i, "internal tenant id"],
    [/Live\s*·/, "meta badge: Live ·"],
    [/\bKrok \d/, "meta label: Krok N"],
    [/\bStep \d/, "meta label: Step N"],
    [/Podgląd na żywo/i, "meta label: Podgląd na żywo"],
    [/Live preview/i, "meta label: Live preview"],
    [/Płatność potwierdzona/i, "meta label: Płatność potwierdzona"],
    [/Do Twojej sesji dojdzie/i, "robotic copy"],
    [/referencj[aię]\s+płatności/i, "jargon: referencja płatności"],
    [/\bCTA\b/, "jargon: CTA"],
    [/\bDOM\b/, "jargon: DOM"],
    [/wstrzyk/i, "jargon: wstrzyknięcie"],
    [/\btrigger\b/i, "jargon: trigger"],
    [/\b\d+\s*(pozycji|wariantów|variants|deliverables|SMS)\b/i, "meta count"],
];

const SOFT = [
    [/\bQA\b/, "mention of QA"],
    [/\blazy\b/i, "mention of lazy loading"],
    [/\bkompilacj|zbudowan/i, "build-process wording"],
];

/* --- helpers ------------------------------------------------------------- */

function walk(dir, ext, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p, ext, out);
        else if (ext.some((e) => p.endsWith(e))) out.push(p);
    }
    return out;
}

function stripMarkup(html) {
    return html
        .replace(/\{#[\s\S]*?#\}/g, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/\{%[\s\S]*?%\}/g, " ")
        .replace(/\{\{[\s\S]*?\}\}/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();
}

function frontMatterValues(raw) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
    if (!m) return "";
    const out = [];
    for (const line of m[1].split(/\r?\n/)) {
        const kv = /^(title|crumb)\s*:\s*(.+)$/.exec(line.trim());
        if (kv) out.push(kv[2].replace(/^["']|["']$/g, ""));
    }
    return out.join(" · ");
}

function context(text, index, span = 64) {
    return text.slice(Math.max(0, index - span / 3), index + span).trim();
}

function checkText(where, text, problems, warnings) {
    for (const [re, label] of HARD) {
        const m = re.exec(text);
        if (m) problems.push(`${where}: ${label} → "${context(text, m.index)}"`);
    }
    for (const [re, label] of SOFT) {
        const m = re.exec(text);
        if (m) warnings.push(`${where}: ${label} → "${context(text, m.index)}"`);
    }
}

function flatten(value, out = []) {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach((v) => flatten(v, out));
    else if (value && typeof value === "object") Object.values(value).forEach((v) => flatten(v, out));
    return out;
}

/* --- 1. copy gate -------------------------------------------------------- */

const problems = [];
const warnings = [];

// Excluded from the visitor-facing copy gate:
//  - src/archive/**   reference library, not built
//  - src/llms.njk     machine-readable doc for LLM crawlers (technical on purpose)
//  - src/overlay/article-*.njk  real editorial prose; "paywall" is a normal
//    word there, exactly like in content/*.md
const njk = walk(SRC, [".njk"]).filter(
    (p) =>
        !p.includes("/archive/") &&
        !p.endsWith("/llms.njk") &&
        !/\/overlay\/article-\d+\.njk$/.test(p)
);
for (const file of njk) {
    const raw = readFileSync(file, "utf8");
    const where = relative(".", file);
    checkText(where, stripMarkup(raw) + " · " + frontMatterValues(raw), problems, warnings);
}

for (const file of walk(join(SRC, "_data", "i18n"), [".json"])) {
    const where = relative(".", file);
    checkText(where, flatten(JSON.parse(readFileSync(file, "utf8"))).join(" · "), problems, warnings);
}

// site metadata — only the tab title and the meta description are user-facing;
// the rest of site.js is configuration (tenant ids, endpoints) and is exempt.
const site = readFileSync(join(SRC, "_data", "site.js"), "utf8");
const siteMeta = [...site.matchAll(/^\s*(title|description)\s*:\s*"([^"]*)"/gm)].map((m) => m[2]).join(" · ");
checkText("src/_data/site.js (title/description)", siteMeta, problems, warnings);

/* --- 2. structure gate --------------------------------------------------- */

if (!existsSync(DIST)) {
    console.error("dist/ not found — run `npm run build` first.");
    process.exit(2);
}

const htmlFiles = walk(DIST, [".html"]);
const pageUrls = new Set(
    htmlFiles.map((f) => {
        const rel = relative(DIST, f).split("\\").join("/");
        if (rel === "index.html") return "/";
        if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
        return "/" + rel;
    })
);

for (const file of htmlFiles) {
    const rel = relative(DIST, file).split("\\").join("/");
    const url = rel === "index.html" ? "/" : rel.endsWith("/index.html") ? "/" + rel.slice(0, -"index.html".length) : "/" + rel;
    const html = readFileSync(file, "utf8");

    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    if (dupes.length) problems.push(`${url}: duplicate id(s): ${dupes.join(", ")}`);

    const pageIds = new Set(ids);
    for (const m of html.matchAll(/data-gvm-template-inject-to="([^"]+)"/g)) {
        const target = m[1];
        if (target === "body") continue;
        if (!pageIds.has(target.replace(/^[#.]/, ""))) {
            problems.push(`${url}: inject target "${target}" missing → template would land on <body>`);
        }
    }

    for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
        const target = m[1];
        if (target.startsWith("/assets/") || target.startsWith("/content/") || target.startsWith("/ppv/")) continue;
        const candidates = [target, target + "index.html", target.replace(/\/$/, "") + "/index.html"];
        if (!candidates.some((c) => pageUrls.has(c) || existsSync(join(DIST, c.replace(/^\//, ""))))) {
            problems.push(`${url}: dead internal link ${target}`);
        }
    }

    if (/Developer Kit|dev-kit|de-kit|paywall-kit|lk-dev|dev-snippet/i.test(html)) {
        problems.push(`${url}: leftover developer-kit block`);
    }

    // payment triggers must carry a usable reference and price — the SDK rejects
    // a reference shorter than 3 or longer than 60 characters
    for (const m of html.matchAll(/data-gvm-reference="([^"]*)"/g)) {
        const ref = m[1];
        if (ref.length < 3 || ref.length > 60) {
            problems.push(`${url}: data-gvm-reference "${ref}" must be 3–60 chars`);
        }
    }
    for (const m of html.matchAll(/data-gvm-price="([^"]*)"/g)) {
        if (!/^\d+(\.\d+)?$/.test(m[1])) {
            problems.push(`${url}: data-gvm-price "${m[1]}" is not a number`);
        }
    }

    // every payment trigger must also declare a success action, otherwise the
    // SDK throws "No action matched for payment element" when it is clicked
    const ACTIONS = [
        "data-gvm-http-redirect-to",
        "data-gvm-http-download",
        "data-gvm-http-inject",
        "data-gvm-hide-strategy",
    ];
    for (const m of html.matchAll(/<[^>]*data-gvm-price="[^"]*"[^>]*>/g)) {
        if (!ACTIONS.some((a) => m[0].includes(a))) {
            problems.push(
                `${url}: payment trigger without an action → ${m[0].replace(/\s+/g, " ").slice(0, 90)}`
            );
        }
    }
}

/* --- report -------------------------------------------------------------- */

console.log(`quality gate: ${njk.length} templates + ${htmlFiles.length} built pages checked`);

if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log("  ~ " + w);
}
if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of problems) console.log("  ✗ " + p);
    process.exit(1);
}
console.log("\n✓ gate passed");
