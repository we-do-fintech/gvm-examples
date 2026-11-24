/** Build-time catalogue of ./content. See README for the file rules. */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({ html: true, linkify: true });
const ROOT = path.join(__dirname, "..", "..");
const DIR = path.join(ROOT, "content");
const LANGS = ["pl", "en"];

const readDir = (d) => {
    try { return fs.readdirSync(path.join(DIR, d)); } catch { return []; }
};

const publicUrl = (p) =>
    "/" + path.relative(ROOT, p).split(path.sep).join("/");

/* en wins, then pl, then common */
function resolve(lang, rel) {
    for (const d of [lang, "pl", "common"]) {
        const p = path.join(DIR, d, rel);
        if (fs.existsSync(p)) return { p, contentLang: d };
    }
    return null;
}

/* first match in <lang>/ then pl/ */
function find(lang, test) {
    for (const d of [lang, "pl"]) {
        const name = readDir(d).find(test);
        if (name) return { p: path.join(DIR, d, name), contentLang: d };
    }
    return null;
}

/* --- file metadata ------------------------------------------------------- */
const durations = new Map();

function audioSeconds(absPath) {
    if (durations.has(absPath)) return durations.get(absPath);
    let out = null;
    try {
        const raw = execFileSync("ffprobe", [
            "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", absPath,
        ], { encoding: "utf8" });
        const n = Number.parseFloat(raw);
        if (Number.isFinite(n)) out = Math.round(n);
    } catch { out = null; }
    durations.set(absPath, out);
    return out;
}

function jpegSize(absPath) {
    try {
        const b = fs.readFileSync(absPath);
        let i = 2;
        while (i < b.length - 8) {
            if (b[i] !== 0xff) { i += 1; continue; }
            const m = b[i + 1];
            if (m === 0xd8 || m === 0xd9) { i += 2; continue; }
            const len = b.readUInt16BE(i + 2);
            const sof = m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m);
            if (sof) {
                return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
            }
            i += 2 + len;
        }
    } catch { /* ignore */ }
    return null;
}

function fileInfo(absPath) {
    const stat = fs.statSync(absPath);
    const ext = path.extname(absPath).slice(1).toLowerCase();
    const info = {
        name: path.basename(absPath),
        href: publicUrl(absPath),
        bytes: stat.size,
        ext,
    };
    if (["ogg", "mp3", "wav", "m4a"].includes(ext)) info.seconds = audioSeconds(absPath);
    if (["jpg", "jpeg", "png"].includes(ext)) Object.assign(info, jpegSize(absPath) || {});
    return info;
}

/* --- markdown ------------------------------------------------------------ */
function dropTitle(tokens) {
    const start = tokens.findIndex((t) => t.type === "heading_open");
    if (start < 0) return { title: "", tokens };
    const title = (tokens[start + 1].content || "").trim();
    const end = tokens.findIndex((t, i) => i > start && t.type === "heading_close");
    const rest = tokens.slice(0, start).concat(tokens.slice(end + 1));
    return { title, tokens: rest };
}

function normaliseHeadings(tokens) {
    const levels = tokens
        .filter((t) => t.type === "heading_open")
        .map((t) => Number(t.tag.slice(1)));
    if (!levels.length) return;
    const shift = 2 - Math.min(...levels);
    for (const t of tokens) {
        if (t.type !== "heading_open" && t.type !== "heading_close") continue;
        const next = Math.max(2, Math.min(6, Number(t.tag.slice(1)) + shift));
        t.tag = "h" + next;
    }
}

function previewStats(tokens) {
    let blocks = 0;
    let seen = false;
    let stop = tokens.length;
    for (let i = 0; i < tokens.length; i += 1) {
        const t = tokens[i];
        if (t.level !== 0 || t.nesting !== 1) continue;
        if (t.type === "heading_open") {
            if (seen) { stop = i; break; }
            continue;
        }
        blocks += 1;
        if (t.type === "paragraph_open") seen = true;
    }
    const words = tokens
        .slice(0, stop)
        .filter((t) => t.type === "inline")
        .map((t) => t.content)
        .join(" ")
        .split(/\s+/)
        .filter(Boolean).length;
    return { blocks, words };
}

function article(lang) {
    const hit = find(lang, (n) => /article|artykul/i.test(n) && n.endsWith(".md"));
    if (!hit) return null;
    const raw = fs.readFileSync(hit.p, "utf8");
    const env = {};
    const parsed = md.parse(raw, env);
    const { title, tokens } = dropTitle(parsed);
    normaliseHeadings(tokens);
    const stats = previewStats(tokens);
    const html = md.renderer.render(tokens, md.options, env);
    const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return {
        available: hit.contentLang === lang,
        contentLang: hit.contentLang,
        source: publicUrl(hit.p),
        title,
        html,
        previewSections: Math.max(2, stats.blocks),
        previewWords: Math.max(6, stats.words),
        words,
        minutes: Math.max(1, Math.round(words / 200)),
    };
}

function vod(lang) {
    for (const d of [lang, "pl"]) {
        for (const name of readDir(d)) {
            if (!name.endsWith(".md")) continue;
            const text = fs.readFileSync(path.join(DIR, d, name), "utf8").trim();
            if (/^https?:\/\/\S+$/.test(text)) {
                return { available: d === lang, contentLang: d, url: text };
            }
        }
    }
    return null;
}

function single(lang, test, title) {
    const hit = find(lang, test);
    if (!hit) return null;
    return {
        available: hit.contentLang === lang,
        contentLang: hit.contentLang,
        title,
        ...fileInfo(hit.p),
    };
}

function list(lang, test) {
    const pick = (d) =>
        readDir(d)
            .filter(test)
            .map((name) => ({
                ...fileInfo(path.join(DIR, d, name)),
                // A stable, URL-safe id for payment references (`data-gvm-reference`
                // must be 3–60 chars, so the file name alone is not enough).
                id: name
                    .replace(/\.[^.]+$/, "")
                    .replace(/[^a-z0-9]+/gi, "-")
                    .replace(/^-+|-+$/g, "")
                    .toLowerCase(),
                title: name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
                contentLang: d,
            }));
    const own = pick(lang);
    const fallback = own.length ? [] : pick("pl");
    const seen = new Set();
    return [...own, ...fallback, ...pick("common")].filter((f) => {
        if (seen.has(f.name)) return false;
        seen.add(f.name);
        return true;
    });
}

function posters() {
    const names = readDir("common")
        .filter((n) => /\.jpe?g$/i.test(n) && !/_small\.jpe?g$/i.test(n))
        .sort();
    return names.map((name) => {
        const base = name.replace(/\.jpe?g$/i, "");
        const small = readDir("common").find((n) => n === base + "_small.jpg");
        const dir = path.join(DIR, "common");
        return {
            id: base,
            full: fileInfo(path.join(dir, name)),
            preview: small ? fileInfo(path.join(dir, small)) : null,
        };
    });
}

function build(lang) {
    return {
        lang,
        article: article(lang),
        vod: vod(lang),
        ebook: single(lang, (n) => n.endsWith(".epub"), "E-book"),
        podcast: single(lang, (n) => n.endsWith(".mp3"), "Podcast"),
        pdfs: list(lang, (n) => n.endsWith(".pdf")),
        music: list(lang, (n) => n.endsWith(".ogg")),
        posters: posters(),
    };
}

module.exports = () => Object.fromEntries(LANGS.map((l) => [l, build(l)]));
