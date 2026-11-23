/**
 * Eleventy config for the gvm.js showcase.
 *
 * Source lives in `src/`, the built site goes to `dist/`.
 *
 * - Nunjucks pages (`*.njk`) are rendered with the layouts in `src/_includes`.
 * - `src/archive/` is intentionally NOT built: it is a reference library of the
 *   previous flat examples, kept so layouts and use cases can be reused when
 *   the new pages are rewritten. Nothing in the archive is served.
 * - Everything that is not a template (CSS, JS, images) is copied untouched.
 */
module.exports = function (eleventyConfig) {
    // Reference only, never part of the build.
    eleventyConfig.ignores.add("src/archive/**");

    // Static assets: CSS, logos, favicon, the agg bridge.
    eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

    eleventyConfig.addWatchTarget("src/assets/");

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
