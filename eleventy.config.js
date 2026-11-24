/**
 * Eleventy config for the gvm.js showcase.
 *
 * Source lives in `src/`, the built site goes to `dist/`.
 *
 * - Nunjucks pages (`*.njk`) are rendered with the layouts in `src/_includes`.
 * - `content/` is editorial material (article, PDFs, EPUB, audio, posters).
 *   Markdown is rendered at build time by `src/_data/catalog.js`; binary files
 *   are copied as-is so the download-strategy examples have real URLs.
 */
module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

    for (const ext of ["pdf", "epub", "mp3", "ogg", "jpg", "jpeg", "png", "webp", "mp4"]) {
        eleventyConfig.addPassthroughCopy(`content/**/*.${ext}`);
    }

    eleventyConfig.addWatchTarget("src/assets/");
    eleventyConfig.addWatchTarget("content/");

    eleventyConfig.addFilter("filesize", (bytes) => {
        if (!bytes) return "";
        const units = ["B", "KB", "MB", "GB"];
        let value = bytes;
        let unit = 0;
        while (value >= 1024 && unit < units.length - 1) {
            value /= 1024;
            unit += 1;
        }
        const digits = unit === 0 || value >= 10 ? 0 : 1;
        return `${value.toFixed(digits)} ${units[unit]}`;
    });

    eleventyConfig.addFilter("duration", (seconds) => {
        if (!seconds) return "";
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${String(sec).padStart(2, "0")}`;
    });

    // Extract a YouTube video id from any common URL shape (watch, youtu.be,
    // /embed, /shorts, /live). Returns null when the URL is not YouTube.
    const ytVideoId = (url) =>
        (
            /(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{6,})/.exec(
                url || ""
            ) || []
        )[1] || null;

    eleventyConfig.addFilter("ytId", ytVideoId);

    eleventyConfig.addFilter("ytEmbed", (url) => {
        const id = ytVideoId(url);
        return id ? "https://www.youtube.com/embed/" + id + "?autoplay=1" : url;
    });

    // Poster frame straight from YouTube, so the pay-per-view thumbnail is
    // always the frame of the video that is actually behind the paywall.
    // `maxresdefault` (1280x720) is not guaranteed for every video — the
    // templates fall back to `hqdefault` via onerror.
    eleventyConfig.addFilter("ytThumb", (url, quality = "maxresdefault") => {
        const id = ytVideoId(url);
        return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : null;
    });
    return {
        dir: {
            input: "src",
            output: "dist",
            includes: "_includes",
            data: "_data",
        },
        templateFormats: ["njk", "11ty.js"],
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
    };
};
