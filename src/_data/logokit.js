/**
 * LogoKit catalogue — shared by the PL and EN add-ons pages.
 *
 * Every item is priced in minor units (grosze/cents) so the basket total is
 * an integer sum and cannot drift. The preformatted `price` labels keep the
 * Nunjucks templates dumb (no filters to add to eleventy.config.js).
 *
 * 10 deliverables, 0.99–5.99 PLN each, 29.90 PLN for everything — comfortably
 * under the 50 PLN per-commitment limit.
 */

const money = (cents) => (cents / 100).toFixed(2);

const label = (cents) => ({
    pl: money(cents).replace(".", ",") + " zł",
    en: money(cents) + " PLN",
});

const item = (id, group, cents, name, desc) => ({
    id,
    group,
    cents,
    price: label(cents),
    name,
    desc,
});

const items = [
    item("logo-primary", "identity", 299, {
        pl: "Logo główne",
        en: "Primary logo",
    }, {
        pl: "Znak firmowy w układzie poziomym i pionowym.",
        en: "Wordmark lockup, horizontal and stacked.",
    }),
    item("logo-monogram", "identity", 199, {
        pl: "Monogram / sygnet",
        en: "Monogram / symbol",
    }, {
        pl: "Kompaktowy znak do awatarów, pieczęci i znaków wodnych.",
        en: "Compact mark for avatars, stamps and watermarks.",
    }),
    item("app-icon", "identity", 99, {
        pl: "Ikona aplikacji i favicon",
        en: "App icon & favicon",
    }, {
        pl: "Kwadraty 16–512 px oraz komplet favicon.",
        en: "Rounded squares 16–512 px plus a favicon set.",
    }),
    item("color-palette", "identity", 199, {
        pl: "Paleta kolorów",
        en: "Color palette",
    }, {
        pl: "Kolory główne i wspierające, wartości HEX i CMYK.",
        en: "Primary and support colors with HEX and print values.",
    }),
    item("business-card", "stationery", 399, {
        pl: "Wizytówka",
        en: "Business card",
    }, {
        pl: "Przód i tył, do druku 85 × 55 mm.",
        en: "Front and back, print-ready 85 × 55 mm.",
    }),
    item("letterhead", "stationery", 399, {
        pl: "Papier firmowy",
        en: "Letterhead",
    }, {
        pl: "Szablon A4 do pism, ofert i faktur.",
        en: "A4 template for letters, offers and invoices.",
    }),
    item("email-signature", "stationery", 199, {
        pl: "Stopka e-mail",
        en: "Email signature",
    }, {
        pl: "Podpis HTML dla całego zespołu.",
        en: "HTML signature for the whole team.",
    }),
    item("presentation", "marketing", 599, {
        pl: "Szablon prezentacji",
        en: "Presentation template",
    }, {
        pl: "Deck 16:9: okładka, agenda, cytat i kontakt.",
        en: "16:9 deck: cover, agenda, quote and contact slides.",
    }),
    item("social-kit", "marketing", 299, {
        pl: "Zestaw social media",
        en: "Social media kit",
    }, {
        pl: "Post, relacja i okładka na start.",
        en: "Post, story and cover sizes for the launch.",
    }),
    item("brand-guide", "system", 299, {
        pl: "Księga znaku (PDF)",
        en: "Brand guide (PDF)",
    }, {
        pl: "Zasady użycia logo, kolory, typografia i do / don't.",
        en: "Logo usage, colors, type and do / don't rules.",
    }),
];

const groups = [
    { id: "identity", name: { pl: "Identyfikacja", en: "Identity" } },
    { id: "stationery", name: { pl: "Materiały biurowe", en: "Stationery" } },
    { id: "marketing", name: { pl: "Marketing", en: "Marketing" } },
    { id: "system", name: { pl: "System", en: "System" } },
];

// Colors are language-independent; the names are not.
const palettes = [
    {
        id: "graphite",
        name: { pl: "Grafit", en: "Graphite" },
        ink: "#1d1d1b",
        accent: "#7a7463",
        soft: "#ece8dc",
        paper: "#f5f2ea",
    },
    {
        id: "navy",
        name: { pl: "Granat", en: "Navy" },
        ink: "#14213d",
        accent: "#3d5a80",
        soft: "#e7eef7",
        paper: "#f4f6fa",
    },
    {
        id: "forest",
        name: { pl: "Las", en: "Forest" },
        ink: "#1f3d2b",
        accent: "#6f8f5f",
        soft: "#e8efe3",
        paper: "#f3f7f0",
    },
    {
        id: "wine",
        name: { pl: "Wino", en: "Wine" },
        ink: "#4a1c2a",
        accent: "#9b4a5c",
        soft: "#f2e5e8",
        paper: "#faf3f4",
    },
    {
        id: "terracotta",
        name: { pl: "Terkota", en: "Terracotta" },
        ink: "#3a1f1a",
        accent: "#b5654a",
        soft: "#f4e5dc",
        paper: "#faf1ec",
    },
    {
        id: "mono",
        name: { pl: "Mono", en: "Mono" },
        ink: "#111111",
        accent: "#555555",
        soft: "#ededed",
        paper: "#f7f7f7",
    },
];

const moods = [
    { id: "editorial", name: { pl: "Editorial (szeryf)", en: "Editorial serif" } },
    { id: "grotesk", name: { pl: "Grotesk (bez szeryfów)", en: "Grotesk sans" } },
    { id: "mono", name: { pl: "Mono (wersaliki)", en: "Mono uppercase" } },
    { id: "round", name: { pl: "Round (zaokrąglony)", en: "Round sans" } },
];

const industries = [
    { id: "agency", name: { pl: "Agencja / studio", en: "Agency / studio" } },
    { id: "technology", name: { pl: "Technologia", en: "Technology" } },
    { id: "retail", name: { pl: "Handel / e-commerce", en: "Retail / e-commerce" } },
    { id: "food", name: { pl: "Gastronomia", en: "Food & drink" } },
    { id: "health", name: { pl: "Zdrowie i uroda", en: "Health & wellness" } },
    { id: "finance", name: { pl: "Finanse / prawo", en: "Finance / legal" } },
    { id: "education", name: { pl: "Edukacja", en: "Education" } },
    { id: "other", name: { pl: "Inne", en: "Other" } },
];

module.exports = {
    items,
    groups,
    palettes,
    moods,
    industries,
    totalCents: items.reduce((sum, entry) => sum + entry.cents, 0),
};