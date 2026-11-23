/**
 * Global defaults for the showcase.
 *
 * Pages override these in their front matter (`env: demo`), everything else
 * is inherited. Keeping them in one file is what makes the examples DRY.
 */
module.exports = {
    title: "gvm.js Developer Examples",
    description:
        "Production-minded gvm.js strategy examples: paid content, downloads, redirects and inline premium modules.",

    // GetViaMsg tenant / environment used by the live (QA) flows.
    tenant: "wdft_showcase_qa",
    env: "qa",
    currency: "PLN",

    gvm: true,
    analytics: "custom",

    // Self-hosted analytics (agg).
    aggScript: "https://agg.tfdw.ovh/agg.js",
    aggSite: "pk_tkajj6iaq6xz4vyuhop4",
    aggBridge: "/assets/agg-gvm-bridge.js",

    // SDK entry points.
    sdk: "https://esm.sh/@wdft/gvm-sdk@latest/gvm.js",
    overlaySdk: "https://esm.sh/@wdft/gvm-sdk@latest/gvm-overlay.js",

    termsUrl: "https://getviamsg.com/terms",
    github: "https://github.com/we-do-fintech/gvm-examples",
    docs: "https://docs.wdft.ovh/gvm-js",
    site: "https://getviamsg.com",
};
