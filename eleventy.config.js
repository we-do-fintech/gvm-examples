/**
 * Eleventy config for the gvm.js showcase.
 *
 * Source lives in `src/`, the built site goes to `dist/`.
 *
 * - Nunjucks pages (`*.njk`) are rendered with the layouts in `src/_includes`.
 * - `content/` is editorial material (article, PDFs, EPUB, audio, posters).
 *   Markdown is rendered at build time by `src/_data/catalog.js`; binary files
 *   are copied as-is so the download-strategy examples have real URLs.
 * - `src/archive/` is a reference library of the previous flat examples and is
 *   intentionally NOT built.
 */
module.exports = function (eleventyConfig) {
    eleventyConfig.ignores.add("src/archive/**");

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

    eleventyConfig.addFilter("ytEmbed", (url) => {
        const match = /[?&]v=([^&]+)/.exec(url || "");
        return match
            ? "https://www.youtube.com/embed/" + match[1] + "?autoplay=1"
            : url;
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
