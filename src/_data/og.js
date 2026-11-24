/**
 * Open Graph cards.
 *
 * `key`  — the segment under /og-image/<key>/ where the card is rendered,
 * `file` — the PNG written to src/assets/og/ by `npm run og:image`.
 *
 * The card pages are rendered ONLY by that script (`OG_BUILD=1`, see
 * src/og-image.11tydata.js); a normal `npm run build` never touches them. The
 * generated PNGs are committed, so the deploy just copies them.
 *
 * Every key exists in both languages; `imageFor()` falls back to the Polish
 * card when a translation is missing.
 */
const cards = [
    {
        key: "default",
        lang: "pl",
        file: "og-default.png",
        eyebrow: "GetViaMsg · showcase",
        title: "Mikropłatności za pojedyncze treści.",
        accent: "Bez subskrypcji.",
        subtitle:
            "Działające przykłady dla wydawców, sklepów z plikami i aplikacji. Wszystko w środowisku testowym.",
    },
    {
        key: "default",
        lang: "en",
        file: "og-default-en.png",
        eyebrow: "GetViaMsg · showcase",
        title: "Pay for a single piece of content.",
        accent: "No subscription.",
        subtitle:
            "Working examples for publishers, digital shops and apps. Everything runs in a test environment.",
    },
    {
        key: "publisher",
        lang: "pl",
        file: "og-publisher.png",
        eyebrow: "Dla wydawców",
        title: "Sprzedaj jeden artykuł.",
        accent: "Nie całą subskrypcję.",
        subtitle:
            "Płatny dostęp do pojedynczego tekstu albo dzień bez reklam — potwierdzony jednym SMS-em.",
    },
    {
        key: "publisher",
        lang: "en",
        file: "og-publisher-en.png",
        eyebrow: "For publishers",
        title: "Sell one article.",
        accent: "Not a subscription.",
        subtitle:
            "Paid access to a single piece, or a day without ads — confirmed with one text message.",
    },
    {
        key: "digital-commerce",
        lang: "pl",
        file: "og-digital-commerce.png",
        eyebrow: "E-commerce cyfrowy",
        title: "Sprzedawaj pliki pojedynczo.",
        accent: "Bez koszyka.",
        subtitle:
            "E-book, raport, muzyka, zdjęcie, audiobook i wideo — każdy z osobną płatnością.",
    },
    {
        key: "digital-commerce",
        lang: "en",
        file: "og-digital-commerce-en.png",
        eyebrow: "Digital commerce",
        title: "Sell files one at a time.",
        accent: "No basket.",
        subtitle:
            "E-book, report, music, photo, audiobook and video — each with its own payment.",
    },
    {
        key: "saas",
        lang: "pl",
        file: "og-saas.png",
        eyebrow: "Dla aplikacji",
        title: "Plany i dodatki w aplikacji.",
        accent: "Rozliczane zbiorczo.",
        subtitle:
            "Klient wybiera plan albo zestaw dodatków i potwierdza go jednym SMS-em.",
    },
    {
        key: "saas",
        lang: "en",
        file: "og-saas-en.png",
        eyebrow: "For apps",
        title: "Plans and add-ons in your app.",
        accent: "Settled together.",
        subtitle:
            "The customer picks a plan or a set of add-ons and confirms it with one text message.",
    },
    {
        key: "overlay",
        lang: "pl",
        file: "og-overlay.png",
        eyebrow: "Overlay",
        title: "Płatna treść na Twojej stronie.",
        accent: "Bez przebudowy.",
        subtitle:
            "Wklejasz jeden skrypt, a serwis sam znajduje i odblokowuje treść.",
    },
    {
        key: "overlay",
        lang: "en",
        file: "og-overlay-en.png",
        eyebrow: "Overlay",
        title: "Paid content on your own page.",
        accent: "No rebuild.",
        subtitle:
            "You drop in one script and the service finds and unlocks the content itself.",
    },
    {
        key: "templates",
        lang: "pl",
        file: "og-templates.png",
        eyebrow: "Szablony",
        title: "Formularz płatności i miejsca na wezwanie.",
        accent: "Do wyboru.",
        subtitle:
            "Cztery warianty formularza i siedem miejsc, w których może stanąć wezwanie do odblokowania.",
    },
    {
        key: "templates",
        lang: "en",
        file: "og-templates-en.png",
        eyebrow: "Templates",
        title: "The payment form and where the call to action sits.",
        accent: "Your pick.",
        subtitle:
            "Four form variants and seven places the unlock call to action can appear.",
    },
];

/** URL prefix -> card key. Checked in order, so keep the specific ones first. */
const sections = [
    { prefix: "/publisher", key: "publisher" },
    { prefix: "/digital-ecommerce", key: "digital-commerce" },
    { prefix: "/saas", key: "saas" },
    { prefix: "/add-ons", key: "saas" },
    { prefix: "/overlay", key: "overlay" },
    { prefix: "/templates", key: "templates" },
];

function keyFor(url) {
    const path = String(url || "/");
    const hit = sections.find((s) => path.startsWith(s.prefix));
    return hit ? hit.key : "default";
}

function cardFor(url, lang) {
    const key = keyFor(url);
    return (
        cards.find((c) => c.key === key && c.lang === lang) ||
        cards.find((c) => c.key === key) ||
        cards.find((c) => c.key === "default" && c.lang === lang) ||
        cards.find((c) => c.key === "default")
    );
}

/** Public path of the card image for a page (absolute URL built in head.njk). */
function imageFor(url, lang) {
    return "/assets/og/" + cardFor(url, lang).file;
}

module.exports = { cards, sections, keyFor, cardFor, imageFor };
