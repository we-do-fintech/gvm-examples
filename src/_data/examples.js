/**
 * Homepage cards. Each entry renders in `index.njk`.
 */
module.exports = [
    {
        group: "Strategies",
        items: [
            {
                href: "/hide/",
                title: "Hide",
                desc: "Client-side article gating and an instant unlock flow.",
            },
            {
                href: "/blur/",
                title: "Blur",
                desc: "Premium content blurred in place — the layout stays intact.",
            },
            {
                href: "/blur-mangle/",
                title: "Blur + mangle",
                desc: "Blur layer plus shuffled text for extra obfuscation.",
            },
            {
                href: "/blur-pwa/",
                title: "Blur + PWA",
                desc: "Blur gating with an extra “Unlock in the app” action.",
            },
            {
                href: "/blur-sticky/",
                title: "Blur + sticky bar",
                desc: "Mangled blur with an always-visible bottom bar.",
            },
            {
                href: "/hide/mobile.html",
                title: "Hide · mobile only",
                desc: "Conditional paywall activation for mobile audiences.",
            },
            {
                href: "/download/",
                title: "Download",
                desc: "Per-file monetization with controlled delivery.",
            },
            {
                href: "/redirect/",
                title: "Redirect",
                desc: "Paid access to protected destination pages.",
            },
            {
                href: "/inject/",
                title: "Inject",
                desc: "Premium module inserted on the page after payment.",
            },
        ],
    },
    {
        group: "Paywall templates",
        items: [
            {
                href: "/templates/inline.html",
                title: "Inline card",
                desc: "Paywall card sits in the article flow.",
                tag: "inline",
            },
            {
                href: "/templates/overlay.html",
                title: "Centered overlay",
                desc: "Modal card over the blurred content.",
                tag: "overlay",
            },
            {
                href: "/templates/sticky-bottom.html",
                title: "Sticky bottom bar",
                desc: "Full-width bar pinned to the viewport bottom.",
                tag: "sticky bottom",
            },
            {
                href: "/templates/sticky-right.html",
                title: "Sticky side card",
                desc: "Floating card docked to the right edge.",
                tag: "sticky right",
            },
            {
                href: "/templates/widget.html",
                title: "Corner widget",
                desc: "Compact widget that expands into a dialog.",
                tag: "widget",
            },
            {
                href: "/templates/banner.html",
                title: "Sticky top banner",
                desc: "Slim banner that collapses to a pill on scroll.",
                tag: "banner",
            },
            {
                href: "/templates/drawer.html",
                title: "Unlock drawer",
                desc: "Side panel explaining the SMS unlock flow.",
                tag: "drawer",
            },
        ],
    },
    {
        group: "App & publisher flows",
        items: [
            {
                href: "/plan/",
                title: "Plans & activation",
                desc: "App subscription checkout linked to the account e-mail.",
            },
            {
                href: "/app-basket/",
                title: "App basket",
                desc: "Configurator where the basket total is the amount charged.",
            },
            {
                href: "/ads/",
                title: "Ads · ad-free day",
                desc: "Publisher page with ad slots and a one-SMS ad-free day pass.",
            },
            {
                href: "/overlay/",
                title: "gvm-overlay.js",
                desc: "Config-driven paywall — prices come from static JSON.",
            },
        ],
    },
];
