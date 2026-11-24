/**
 * Global defaults for the showcase.
 *
 * Pages override these in their front matter (`lang: en`, `gvm: true`, …),
 * everything else is inherited. Keeping the endpoints here is what makes the
 * examples DRY: no example hardcodes a tenant or a script URL.
 */
module.exports = {
    // Absolute origin of the deployed showcase — used for canonical URLs,
    // hreflang alternates, the sitemap and llms.txt.
    baseUrl: "https://showcase.getviamsg.com",

    title: "GetViaMsg Showcase",
    description:
        "GetViaMsg showcases: modern content monetization (micropayments) for publishers, digital commerce, SaaS and apps.",

    // Default language for pages that do not set `lang` in front matter.
    defaultLang: "pl",
    langs: ["pl", "en"],

    // GetViaMsg tenant / environment used by the live (QA) flows.
    // `env: demo` simulates the whole flow without a real charge.
    tenant: "wdft_showcase_qa",
    env: "qa",
    currency: "PLN",
    termsVersion: "pl-2026-10-23",

    // SDK entry points.
    sdk: "https://esm.sh/@wdft/gvm-sdk@latest/gvm.js",
    overlaySdk: "https://esm.sh/@wdft/gvm-sdk@latest/gvm-overlay.js",

    // Self-hosted analytics (agg).
    aggScript: "https://agg.tfdw.ovh/agg.js",
    aggSite: "pk_tkajj6iaq6xz4vyuhop4",
    aggBridge: "/assets/agg-gvm-bridge.js",

    // Outbound links.
    termsUrl: "https://getviamsg.com/terms",
    github: "https://github.com/we-do-fintech/gvm-examples",
    docs: "https://docs.wdft.ovh/gvm-js",
    site: "https://getviamsg.com"
};
