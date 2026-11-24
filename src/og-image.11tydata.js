/**
 * The /og-image/<key>/ card pages are rendered ONLY by `npm run og:image`
 * (which sets OG_BUILD=1). A normal `npm run build` skips them entirely, so
 * they never ship to the deploy.
 */
module.exports = {
    eleventyExcludeFromCollections: true,
    eleventyComputed: {
        permalink: (data) =>
            process.env.OG_BUILD === "1"
                ? `/og-image/${data.card.key}-${data.card.lang}/index.html`
                : false,
    },
};
