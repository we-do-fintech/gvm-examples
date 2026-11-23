/**
 * Eleventy config for the gvm.js showcase.
 *
 * Source lives in `src/`, the site is built into `dist/`.
 * Everything that is not a Nunjucks template (JS, data files, images,
 * the injectable `swan.html` fragment) is copied through untouched.
 */
module.exports = function (eleventyConfig) {
    // Static assets: CSS, logos, favicon.
    eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

    // Scripts and binary payloads referenced by the examples.
    eleventyConfig.addPassthroughCopy("src/**/*.js");
    eleventyConfig.addPassthroughCopy("src/**/*.data");
    eleventyConfig.addPassthroughCopy("src/**/*.png");

    // The inject strategy fetches this fragment at runtime.
    eleventyConfig.addPassthroughCopy({
        "src/inject/swan.html": "inject/swan.html",
    });

    eleventyConfig.addWatchTarget("src/assets/");

    return {
        dir: {
            input: "src",
            output: "dist",
            includes: "_includes",
            data: "_data",
        },
        templateFormats: ["njk"],
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
    };
};
