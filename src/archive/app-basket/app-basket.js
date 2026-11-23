/**
 * /app-basket — "LogoKit" in-app configurator (gvm.js showcase)
 *
 * A mockup of an app screen where the customer configures a brand kit: a
 * company name, a type style, a palette and 10 optional deliverables. The
 * basket total is the amount that is sent to GetViaMsg when the customer
 * checks out (max of all options = 29.90 PLN, safely under the 50 PLN
 * per-commitment limit).
 *
 * Why gvm.js is loaded lazily (and not in <head>):
 *
 *   gvm.js reads `data-gvm-price` / `data-gvm-reference` once, at boot
 *   (`GvmProvider.processPaymentElements`). The basket total only exists after
 *   the customer has configured something, so we set those attributes on
 *   `#basket-trigger` and *then* import the module. The trigger uses the
 *   `hide` strategy with **no split config**: nothing is hidden, gvm.js only
 *   injects the bound "pay" CTA (`basket-cta` template) into
 *   `#basket-cta-slot`, which we click programmatically to open the dialog.
 *
 *   If the basket changes *after* gvm.js has booted, the price on the trigger
 *   is already frozen, so we persist the basket and reload with `?checkout=1`.
 *   On that landing we bind a fresh trigger and boot gvm.js again.
 *
 * Everything except the QA payment call is mocked on the front end: the logo
 * and the brand sheet are generated in the browser, the "files" are not real.
 * In production a backend would mint a `data-gvm-price-token` for the basket
 * amount (see the gvm.js docs) and deliver the assets after the commitment is
 * verified.
 */
(function () {
    "use strict";

    var GVM_URL = "https://esm.sh/@wdft/gvm-sdk@latest/gvm.js";
    var STORAGE_KEY = "gvm_app_basket_state";
    var CHECKOUT_PARAM = "checkout";
    var MAX_REFERENCE = 60;

    /* ------------------------------------------------------------------ */
    /* catalog & design tokens                                             */
    /* ------------------------------------------------------------------ */

    // 10 deliverables. Sum of all prices = 29.90 PLN.
    var CATALOG = [
        {
            id: "logo-primary",
            group: "Identity",
            name: "Primary logo",
            desc: "Wordmark lockup, horizontal and stacked.",
            price: 2.99
        },
        {
            id: "logo-monogram",
            group: "Identity",
            name: "Monogram / symbol",
            desc: "Compact mark for avatars, stamps and watermarks.",
            price: 1.99
        },
        {
            id: "app-icon",
            group: "Identity",
            name: "App icon & favicon",
            desc: "Rounded squares 16–512 px plus a favicon set.",
            price: 0.99
        },
        {
            id: "color-palette",
            group: "Identity",
            name: "Color palette",
            desc: "Primary and support colors with HEX and print values.",
            price: 1.99
        },
        {
            id: "business-card",
            group: "Stationery",
            name: "Business card",
            desc: "Front and back, print-ready 85 × 55 mm.",
            price: 3.99
        },
        {
            id: "letterhead",
            group: "Stationery",
            name: "Letterhead",
            desc: "A4 template for letters, offers and invoices.",
            price: 3.99
        },
        {
            id: "email-signature",
            group: "Stationery",
            name: "Email signature",
            desc: "HTML signature for the whole team.",
            price: 1.99
        },
        {
            id: "presentation",
            group: "Marketing",
            name: "Presentation template",
            desc: "16:9 deck: cover, agenda, quote and contact slides.",
            price: 5.99
        },
        {
            id: "social-kit",
            group: "Marketing",
            name: "Social media kit",
            desc: "Post, story and cover sizes for the launch.",
            price: 2.99
        },
        {
            id: "brand-guide",
            group: "System",
            name: "Brand guide (PDF)",
            desc: "Logo usage, colors, type and do / don't rules.",
            price: 2.99
        }
    ];

    var GROUPS = ["Identity", "Stationery", "Marketing", "System"];

    var PALETTES = [
        {
            id: "graphite",
            name: "Graphite",
            ink: "#1d1d1b",
            accent: "#7a7463",
            soft: "#ece8dc",
            paper: "#f5f2ea"
        },
        {
            id: "navy",
            name: "Navy",
            ink: "#14213d",
            accent: "#3d5a80",
            soft: "#e7eef7",
            paper: "#f4f6fa"
        },
        {
            id: "forest",
            name: "Forest",
            ink: "#1f3d2b",
            accent: "#6f8f5f",
            soft: "#e8efe3",
            paper: "#f3f7f0"
        },
        {
            id: "wine",
            name: "Wine",
            ink: "#4a1c2a",
            accent: "#9b4a5c",
            soft: "#f2e5e8",
            paper: "#faf3f4"
        },
        {
            id: "terracotta",
            name: "Terracotta",
            ink: "#3a1f1a",
            accent: "#b5654a",
            soft: "#f4e5dc",
            paper: "#faf1ec"
        },
        {
            id: "mono",
            name: "Mono",
            ink: "#111111",
            accent: "#555555",
            soft: "#ededed",
            paper: "#f7f7f7"
        }
    ];

    var MOODS = [
        { id: "editorial", name: "Editorial serif" },
        { id: "grotesk", name: "Grotesk sans" },
        { id: "mono", name: "Mono uppercase" },
        { id: "round", name: "Round sans" }
    ];

    var INDUSTRIES = [
        "Agency / studio",
        "Technology",
        "Retail / e-commerce",
        "Food & drink",
        "Health & wellness",
        "Finance / legal",
        "Education",
        "Other"
    ];

    /* ------------------------------------------------------------------ */
    /* state                                                               */
    /* ------------------------------------------------------------------ */

    var state = {
        company: "",
        tagline: "",
        industry: INDUSTRIES[0],
        mood: "editorial",
        palette: "graphite",
        selected: {},
        gvmLoaded: false,
        opening: false,
        boundSignature: "",
        dirty: false
    };

    /* ------------------------------------------------------------------ */
    /* helpers                                                             */
    /* ------------------------------------------------------------------ */

    function track(name, props) {
        try {
            var api = window.agg || (window.agg = {});
            if (typeof api.track === "function") {
                api.track(name, props || {});
                return;
            }
            api.q = api.q || [];
            api.q.push(["track", name, props || {}]);
        } catch (err) {
            /* analytics must never break the page */
        }
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function money(cents) {
        return (cents / 100).toFixed(2);
    }

    function centsOf(item) {
        return Math.round(item.price * 100);
    }

    function findItem(id) {
        for (var i = 0; i < CATALOG.length; i++) {
            if (CATALOG[i].id === id) return CATALOG[i];
        }
        return null;
    }

    function paletteOf(id) {
        for (var i = 0; i < PALETTES.length; i++) {
            if (PALETTES[i].id === id) return PALETTES[i];
        }
        return PALETTES[0];
    }

    function selectedIds() {
        return CATALOG.map(function (item) {
            return item.id;
        }).filter(function (id) {
            return !!state.selected[id];
        });
    }

    function totalCents() {
        return selectedIds().reduce(function (sum, id) {
            return sum + centsOf(findItem(id));
        }, 0);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function slugify(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 18);
    }

    function initials(value) {
        var words = String(value || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        if (words.length === 0) return "";
        if (words.length === 1) {
            return words[0].slice(0, 2).toUpperCase();
        }
        return (words[0][0] + words[1][0]).toUpperCase();
    }

    /** Deterministic, non-cryptographic hash (mock only). */
    function hashHex(input, length) {
        var source = String(input || "");
        var h1 = 0x811c9dc5;
        var h2 = 0x01000193;
        for (var i = 0; i < source.length; i++) {
            var code = source.charCodeAt(i);
            h1 = Math.imul(h1 ^ code, 16777619);
            h2 = Math.imul(h2 ^ (code + i), 2246822519);
        }
        var hex = function (n) {
            return (n >>> 0).toString(16).padStart(8, "0");
        };
        return (hex(h1) + hex(h2)).slice(0, length).toUpperCase();
    }

    /**
     * Basket fingerprint. Two baskets with the same signature can reuse the
     * gvm.js trigger that is already bound; a different signature means the
     * price changed and we have to boot gvm.js again (via a reload).
     */
    function signature() {
        return [
            selectedIds().join("+"),
            String(totalCents()),
            state.mood,
            state.palette,
            slugify(state.company)
        ].join("|");
    }

    function reference() {
        var slug = slugify(state.company) || "brand";
        var value = "logokit_" + slug + "_" + hashHex(signature(), 8);
        return value.slice(0, MAX_REFERENCE);
    }

    /* ------------------------------------------------------------------ */
    /* persistence                                                         */
    /* ------------------------------------------------------------------ */

    function persist() {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                company: state.company,
                tagline: state.tagline,
                industry: state.industry,
                mood: state.mood,
                palette: state.palette,
                selected: selectedIds()
            }));
        } catch (err) {
            /* private mode — the basket just won't survive a reload */
        }
    }

    function restore() {
        var raw;
        try {
            raw = sessionStorage.getItem(STORAGE_KEY);
        } catch (err) {
            return;
        }
        if (!raw) return;
        var saved;
        try {
            saved = JSON.parse(raw);
        } catch (err) {
            return;
        }
        if (!saved || typeof saved !== "object") return;
        state.company = typeof saved.company === "string" ? saved.company : "";
        state.tagline = typeof saved.tagline === "string" ? saved.tagline : "";
        if (INDUSTRIES.indexOf(saved.industry) !== -1) {
            state.industry = saved.industry;
        }
        if (MOODS.some(function (m) { return m.id === saved.mood; })) {
            state.mood = saved.mood;
        }
        if (PALETTES.some(function (p) { return p.id === saved.palette; })) {
            state.palette = saved.palette;
        }
        state.selected = {};
        if (Array.isArray(saved.selected)) {
            saved.selected.forEach(function (id) {
                if (findItem(id)) state.selected[id] = true;
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /* gvm.js boot                                                         */
    /* ------------------------------------------------------------------ */

    function bindTrigger() {
        var trigger = byId("basket-trigger");
        if (!trigger) return;
        trigger.setAttribute("data-gvm-price", money(totalCents()));
        trigger.setAttribute("data-gvm-reference", reference());
        trigger.setAttribute(
            "data-gvm-metadata-title",
            "Logo kit — " + (state.company.trim() || "brand")
        );
        state.boundSignature = signature();
    }

    function loadGvm() {
        if (state.gvmLoaded) return;
        state.gvmLoaded = true;
        track("basket_gvm_load", {
            env: "qa",
            tenant: "wdft_showcase_qa"
        });

        var script = document.createElement("script");
        script.type = "module";
        script.src = GVM_URL;
        script.addEventListener("error", function () {
            state.gvmLoaded = false;
            setCheckoutNote(
                "Could not load gvm.js. Check your connection and reload.",
                true
            );
            track("basket_gvm_error", {});
        });
        document.head.appendChild(script);
    }

    /** Wait for the bound pay CTA that the hide strategy injects. */
    function clickInjectedPay() {
        var tries = 0;
        (function tick() {
            var button = document.querySelector(
                "#basket-cta-slot [data-gvm-bind-pay]"
            );
            if (button) {
                button.click();
                return;
            }
            if (++tries > 120) {
                setCheckoutNote(
                    "The payment dialog did not open. Reload and try again.",
                    true
                );
                return;
            }
            setTimeout(tick, 40);
        })();
    }

    function checkout() {
        if (totalCents() <= 0 || state.opening) return;

        // gvm.js already bound an older signature → reload with the new basket.
        if (state.gvmLoaded && signature() !== state.boundSignature) {
            persist();
            var url = new URL(location.href);
            url.searchParams.set(CHECKOUT_PARAM, "1");
            location.assign(url.pathname + url.search);
            return;
        }

        state.opening = true;
        setCheckoutBusy(true);
        track("basket_checkout", {
            value: money(totalCents()),
            currency: "PLN",
            reference: reference(),
            items: selectedIds().join(",")
        });

        if (!state.gvmLoaded) {
            bindTrigger();
            loadGvm();
        }
        clickInjectedPay();

        setTimeout(function () {
            state.opening = false;
            setCheckoutBusy(false);
        }, 1600);
    }

    /* ------------------------------------------------------------------ */
    /* payment lifecycle                                                   */
    /* ------------------------------------------------------------------ */

    // Referenced by `data-gvm-callback="basketPaymentCallback"` on <body>.
    window.basketPaymentCallback = function (error, payload) {
        if (error) {
            setCheckoutNote(
                error.message || "Payment could not be started.",
                true
            );
            return;
        }
        var status = payload && payload.status;
        if (status === "resolved" || status === "duplicated") {
            closeDialogs();
            showSuccess(payload);
        } else if (status === "rejected" || status === "expired") {
            setCheckoutNote(
                payload && payload.message
                    ? payload.message
                    : "Payment " + status + ".",
                true
            );
        }
    };

    function closeDialogs() {
        var dialogs = document.querySelectorAll("dialog[open]");
        for (var i = 0; i < dialogs.length; i++) {
            try {
                dialogs[i].close();
            } catch (err) {
                dialogs[i].remove();
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /* UI: brief form                                                      */
    /* ------------------------------------------------------------------ */

    function fillSelect(select, options, value) {
        select.innerHTML = "";
        options.forEach(function (option) {
            var opt = document.createElement("option");
            opt.value = option.value;
            opt.textContent = option.label;
            if (option.value === value) opt.selected = true;
            select.appendChild(opt);
        });
    }

    function bindBrief() {
        var company = byId("lk-company");
        var tagline = byId("lk-tagline");
        var industry = byId("lk-industry");
        var mood = byId("lk-mood");
        var palette = byId("lk-palette");

        fillSelect(industry, INDUSTRIES.map(function (name) {
            return { value: name, label: name };
        }), state.industry);
        fillSelect(mood, MOODS.map(function (m) {
            return { value: m.id, label: m.name };
        }), state.mood);
        fillSelect(palette, PALETTES.map(function (p) {
            return { value: p.id, label: p.name };
        }), state.palette);

        company.value = state.company;
        tagline.value = state.tagline;

        company.addEventListener("input", function () {
            state.company = company.value;
            onBriefChange();
        });
        tagline.addEventListener("input", function () {
            state.tagline = tagline.value;
            onBriefChange();
        });
        industry.addEventListener("change", function () {
            state.industry = industry.value;
            renderPreview();
            persist();
        });
        mood.addEventListener("change", function () {
            state.mood = mood.value;
            onBriefChange();
        });
        palette.addEventListener("change", function () {
            state.palette = palette.value;
            onBriefChange();
        });
    }

    function onBriefChange() {
        markDirtyIfBooted();
        renderPreview();
        persist();
    }

    /* ------------------------------------------------------------------ */
    /* UI: catalog + basket                                                */
    /* ------------------------------------------------------------------ */

    function renderCatalog() {
        var root = byId("lk-catalog");
        if (!root) return;
        root.innerHTML = "";

        GROUPS.forEach(function (group) {
            var items = CATALOG.filter(function (item) {
                return item.group === group;
            });
            if (items.length === 0) return;

            var section = document.createElement("div");
            section.className = "lk-group";

            var title = document.createElement("p");
            title.className = "lk-group__title";
            title.textContent = group;
            section.appendChild(title);

            items.forEach(function (item) {
                section.appendChild(buildCatalogItem(item));
            });

            root.appendChild(section);
        });
    }

    function buildCatalogItem(item) {
        var label = document.createElement("label");
        label.className = "lk-item";
        label.setAttribute("data-item", item.id);

        var input = document.createElement("input");
        input.type = "checkbox";
        input.value = item.id;
        input.checked = !!state.selected[item.id];

        var body = document.createElement("span");
        body.className = "lk-item__body";

        var name = document.createElement("span");
        name.className = "lk-item__name";
        name.textContent = item.name;

        var desc = document.createElement("span");
        desc.className = "lk-item__desc";
        desc.textContent = item.desc;

        body.appendChild(name);
        body.appendChild(desc);

        var price = document.createElement("span");
        price.className = "lk-item__price";
        price.textContent = item.price.toFixed(2) + " PLN";

        label.appendChild(input);
        label.appendChild(body);
        label.appendChild(price);

        input.addEventListener("change", function () {
            toggleItem(item, input.checked, label);
        });

        label.classList.toggle("is-selected", input.checked);
        return label;
    }

    function toggleItem(item, checked, label) {
        if (checked) {
            state.selected[item.id] = true;
        } else {
            delete state.selected[item.id];
        }
        if (label) label.classList.toggle("is-selected", checked);
        markDirtyIfBooted();
        renderBasket();
        renderAssets();
        persist();
        track(checked ? "basket_item_add" : "basket_item_remove", {
            item: item.id,
            value: item.price.toFixed(2),
            currency: "PLN"
        });
    }

    function renderBasket() {
        var list = byId("lk-basket-list");
        var totalEl = byId("lk-total");
        var totalTerms = byId("lk-total-terms");
        var checkoutTotal = byId("lk-checkout-total");
        var checkout = byId("lk-checkout");
        var ids = selectedIds();
        var total = totalCents();

        if (list) {
            list.innerHTML = "";
            if (ids.length === 0) {
                var empty = document.createElement("li");
                empty.className = "lk-basket__empty";
                empty.textContent =
                    "Basket is empty — pick at least one deliverable.";
                list.appendChild(empty);
            } else {
                ids.forEach(function (id) {
                    var item = findItem(id);
                    var row = document.createElement("li");
                    row.className = "lk-basket__row";

                    var name = document.createElement("span");
                    name.className = "lk-basket__name";
                    name.textContent = item.name;

                    var price = document.createElement("span");
                    price.className = "lk-basket__price";
                    price.textContent = item.price.toFixed(2);

                    row.appendChild(name);
                    row.appendChild(price);
                    list.appendChild(row);
                });
            }
        }

        if (totalEl) totalEl.textContent = money(total);
        if (totalTerms) totalTerms.textContent = money(total);
        if (checkoutTotal) checkoutTotal.textContent = money(total);
        if (checkout) checkout.disabled = total <= 0;
    }

    function setCheckoutBusy(busy) {
        var button = byId("lk-checkout");
        if (!button) return;
        button.setAttribute("aria-busy", busy ? "true" : "false");
        var label = byId("lk-checkout-label");
        if (label) {
            label.textContent = busy ? "Opening checkout" : "Pay";
        }
    }

    function setCheckoutNote(message, isError) {
        var note = byId("lk-checkout-note");
        if (!note) return;
        note.textContent = message || "";
        note.classList.toggle("is-error", !!isError);
        note.hidden = !message;
    }

    function markDirtyIfBooted() {
        if (!state.gvmLoaded) return;
        if (signature() !== state.boundSignature) {
            state.dirty = true;
            setCheckoutNote(
                "Basket changed. Pay again to refresh the amount with the new configuration.",
                false
            );
        } else {
            state.dirty = false;
            setCheckoutNote("", false);
        }
    }

    /* ------------------------------------------------------------------ */
    /* UI: live preview                                                    */
    /* ------------------------------------------------------------------ */

    function renderPreview() {
        var preview = byId("lk-preview");
        var logo = byId("lk-logo");
        if (!preview || !logo) return;

        var pal = paletteOf(state.palette);

        preview.style.setProperty("--lk-ink", pal.ink);
        preview.style.setProperty("--lk-accent", pal.accent);
        preview.style.setProperty("--lk-soft", pal.soft);
        preview.style.setProperty("--lk-paper", pal.paper);

        logo.setAttribute("data-mood", state.mood);
        logo.setAttribute("data-palette", pal.id);

        var name = state.company.trim() || "Your Company";
        var tagline = state.tagline.trim() || "brand & identity";
        var mark = initials(state.company) || "YC";

        setText("lk-name", name);
        setText("lk-tagline-preview", tagline);
        setText("lk-mark", mark);

        renderSwatches(pal);
        renderAssets();
    }

    function setText(id, value) {
        var el = byId(id);
        if (el) el.textContent = value;
    }

    function renderSwatches(pal) {
        var root = byId("lk-swatches");
        if (!root) return;
        var colors = [
            { hex: pal.ink, role: "Ink" },
            { hex: pal.accent, role: "Accent" },
            { hex: pal.soft, role: "Surface" },
            { hex: pal.paper, role: "Paper" }
        ];
        root.innerHTML = "";
        colors.forEach(function (color) {
            var chip = document.createElement("span");
            chip.className = "lk-swatch";
            chip.style.background = color.hex;

            var label = document.createElement("span");
            label.className = "lk-swatch__label";
            label.textContent = color.hex.toUpperCase();

            var wrap = document.createElement("span");
            wrap.className = "lk-swatch__wrap";
            wrap.appendChild(chip);
            wrap.appendChild(label);
            root.appendChild(wrap);
        });
    }

    function renderAssets() {
        var root = byId("lk-assets");
        if (!root) return;
        var name = state.company.trim() || "Your Company";
        var tagline = state.tagline.trim() || "brand & identity";
        var mark = initials(state.company) || "YC";
        root.innerHTML = "";

        root.appendChild(buildMockCard(name, tagline, mark));
        root.appendChild(buildMockSocial(name, mark));
        root.appendChild(buildMockLetter(name, tagline, mark));
    }

    function buildMockCard(name, tagline, mark) {
        var card = document.createElement("div");
        card.className = "lk-mock lk-mock--card";
        card.innerHTML =
            '<span class="lk-mock__mark">' +
            escapeHtml(mark) +
            "</span>" +
            '<span class="lk-mock__name">' +
            escapeHtml(name) +
            "</span>" +
            '<span class="lk-mock__tagline">' +
            escapeHtml(tagline) +
            "</span>" +
            '<span class="lk-mock__rule"></span>' +
            '<span class="lk-mock__lines"><i></i><i></i><i></i></span>' +
            '<span class="lk-mock__caption">Business card</span>';
        return card;
    }

    function buildMockSocial(name, mark) {
        var social = document.createElement("div");
        social.className = "lk-mock lk-mock--social";
        social.innerHTML =
            '<span class="lk-mock__mark">' +
            escapeHtml(mark) +
            "</span>" +
            '<span class="lk-mock__name">' +
            escapeHtml(name) +
            "</span>" +
            '<span class="lk-mock__caption">Social post</span>';
        return social;
    }

    function buildMockLetter(name, tagline, mark) {
        var letter = document.createElement("div");
        letter.className = "lk-mock lk-mock--letter";
        letter.innerHTML =
            '<span class="lk-mock__head"><span class="lk-mock__mark">' +
            escapeHtml(mark) +
            '</span><span class="lk-mock__name">' +
            escapeHtml(name) +
            "</span></span>" +
            '<span class="lk-mock__lines"><i></i><i></i><i></i><i></i><i></i></span>' +
            '<span class="lk-mock__foot">' +
            escapeHtml(tagline) +
            "</span>" +
            '<span class="lk-mock__caption">Letterhead</span>';
        return letter;
    }

    /* ------------------------------------------------------------------ */
    /* success + mock delivery                                             */
    /* ------------------------------------------------------------------ */

    function showSuccess(payload) {
        persist();
        var panel = byId("lk-success");
        if (!panel) return;

        var ids = selectedIds();
        setText("lk-success-company", state.company.trim() || "Your brand");
        setText("lk-success-reference", reference());
        setText(
            "lk-success-total",
            money(totalCents()) + " PLN"
        );
        setText(
            "lk-success-count",
            ids.length + (ids.length === 1 ? " deliverable" : " deliverables")
        );

        var list = byId("lk-success-list");
        if (list) {
            list.innerHTML = "";
            ids.forEach(function (id) {
                var item = findItem(id);
                var li = document.createElement("li");
                li.textContent = item.name + " · " + item.price.toFixed(2) + " PLN";
                list.appendChild(li);
            });
        }

        var logo = byId("lk-success-logo");
        if (logo) {
            var pal = paletteOf(state.palette);
            logo.style.setProperty("--lk-ink", pal.ink);
            logo.style.setProperty("--lk-accent", pal.accent);
            logo.style.setProperty("--lk-soft", pal.soft);
            logo.style.setProperty("--lk-paper", pal.paper);
            logo.innerHTML = "";
            var clone = byId("lk-logo");
            if (clone) logo.appendChild(clone.cloneNode(true));
            logo.setAttribute("data-mood", state.mood);
        }

        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });

        track("basket_paid", {
            reference:
                (payload && (payload.reference_id || payload.reference)) ||
                reference(),
            status: payload && payload.status,
            value: money(totalCents()),
            currency: "PLN",
            items: ids.join(",")
        });
    }

    function buildLogoSvg() {
        var pal = paletteOf(state.palette);
        var name = state.company.trim() || "Your Company";
        var tagline = state.tagline.trim() || "brand & identity";
        var mark = initials(state.company) || "YC";
        var font =
            state.mood === "mono"
                ? "IBM Plex Mono, monospace"
                : state.mood === "grotesk" || state.mood === "round"
                  ? "Source Sans 3, sans-serif"
                  : "Newsreader, Georgia, serif";
        var radius = state.mood === "round" ? 28 : 0;
        var letterSpacing = state.mood === "mono" ? 4 : 0;
        var upper = state.mood === "mono";

        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="240" viewBox="0 0 720 240">' +
            '<rect width="720" height="240" fill="' + pal.paper + '"/>' +
            '<rect x="40" y="60" width="120" height="120" rx="' + radius + '" fill="' + pal.ink + '"/>' +
            '<text x="100" y="134" text-anchor="middle" font-family="' + font + '" font-size="46" font-weight="700" fill="' + pal.paper + '" letter-spacing="' + letterSpacing + '">' + escapeHtml(mark) + '</text>' +
            '<text x="190" y="122" font-family="' + font + '" font-size="42" font-weight="600" fill="' + pal.ink + '" letter-spacing="' + letterSpacing + '">' + escapeHtml(upper ? name.toUpperCase() : name) + '</text>' +
            '<text x="192" y="156" font-family="Source Sans 3, sans-serif" font-size="20" fill="' + pal.accent + '">' + escapeHtml(tagline) + '</text>' +
            "</svg>"
        );
    }

    function downloadBlob(filename, mime, content) {
        try {
            var blob = new Blob([content], { type: mime });
            var url = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(function () {
                URL.revokeObjectURL(url);
            }, 1000);
        } catch (err) {
            setCheckoutNote("Download failed in this browser.", true);
        }
    }

    function bindSuccessActions() {
        var logoButton = byId("lk-download-logo");
        if (logoButton) {
            logoButton.addEventListener("click", function () {
                downloadBlob(
                    (slugify(state.company) || "brand") + "-logo.svg",
                    "image/svg+xml",
                    buildLogoSvg()
                );
                track("basket_download_logo", {});
            });
        }

        var specButton = byId("lk-download-spec");
        if (specButton) {
            specButton.addEventListener("click", function () {
                var spec = {
                    brand: state.company.trim() || "Your brand",
                    tagline: state.tagline.trim(),
                    industry: state.industry,
                    typeStyle: state.mood,
                    palette: paletteOf(state.palette),
                    deliverables: selectedIds().map(function (id) {
                        var item = findItem(id);
                        return { id: item.id, name: item.name, price: item.price };
                    }),
                    total: money(totalCents()) + " PLN",
                    reference: reference(),
                    generatedBy: "GetViaMsg LogoKit showcase",
                    mock: true
                };
                downloadBlob(
                    (slugify(state.company) || "brand") + "-brand.json",
                    "application/json",
                    JSON.stringify(spec, null, 2)
                );
                track("basket_download_spec", {});
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /* init                                                                */
    /* ------------------------------------------------------------------ */

    function cleanCheckoutParam() {
        try {
            var url = new URL(location.href);
            if (!url.searchParams.has(CHECKOUT_PARAM)) return;
            url.searchParams.delete(CHECKOUT_PARAM);
            var query = url.searchParams.toString();
            history.replaceState(
                null,
                "",
                url.pathname + (query ? "?" + query : "") + url.hash
            );
        } catch (err) {
            /* keep the param if replaceState is unavailable */
        }
    }

    function bindCheckout() {
        var button = byId("lk-checkout");
        if (button) button.addEventListener("click", checkout);

        // Reset the busy state if the customer cancels the dialog.
        window.addEventListener("gvm:cancel", function () {
            state.opening = false;
            setCheckoutBusy(false);
        });
    }

    function init() {
        restore();
        if (selectedIds().length === 0 && !state.company) {
            // Friendly starting basket on a first visit (no stored state).
            state.selected["logo-primary"] = true;
            state.selected["color-palette"] = true;
        }

        bindBrief();
        renderCatalog();
        renderBasket();
        renderPreview();
        bindCheckout();
        bindSuccessActions();

        var checkoutIntent =
            new URLSearchParams(location.search).get(CHECKOUT_PARAM) === "1";

        if (checkoutIntent && totalCents() > 0) {
            bindTrigger();
            loadGvm();
            clickInjectedPay();
            cleanCheckoutParam();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
