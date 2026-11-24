/**
 * /add-ons/ — LogoKit: in-app configurator whose basket total becomes the
 * GetViaMsg payment amount.
 *
 * Why gvm.js is NOT in <head>:
 *
 *   gvm.js reads `data-gvm-price` / `data-gvm-reference` once, at boot. The
 *   basket total only exists after the customer configures something, so this
 *   module writes the price, the reference and the title onto the hidden
 *   #basket-trigger and only then appends the gvm.js module. The trigger uses
 *   the `hide` strategy with no split config: nothing is hidden, gvm.js only
 *   injects the bound pay CTA from the `basket-cta` template into
 *   #basket-cta-slot, which the page clicks programmatically.
 *
 *   If the basket changes after gvm.js booted, the bound price is stale, so
 *   the basket is persisted and the page reloads with ?checkout=1 to bind a
 *   fresh trigger and boot the module again.
 *
 * Everything except the QA payment call is mocked in the browser: the logo,
 * swatches and stationery previews are DOM, and the "downloads" are SVG/JSON
 * Blobs. In production the total is computed server-side and minted as a
 * signed `data-gvm-price-token` (see the gvm.js docs → Price token).
 */

const root = document.getElementById("lk-app");

if (root) {
    init(root);
}

function init(root) {
    const copy = {
        pay: root.dataset.copyPay || "Pay",
        opening: root.dataset.copyOpening || "Opening checkout",
        empty: root.dataset.copyEmpty || "Basket is empty.",
        dirty: root.dataset.copyDirty || "Basket changed. Pay again to refresh the amount.",
        loadFailed: root.dataset.copyLoadFailed || "Could not load gvm.js.",
        openFailed: root.dataset.copyOpenFailed || "The payment dialog did not open.",
        remove: root.dataset.copyRemove || "Remove from basket",
        countOne: root.dataset.copyCountOne || "1 item",
        countMany: root.dataset.copyCountMany || "%s items",
        brandDefault: root.dataset.copyBrandDefault || "Your Company",
        taglineDefault: root.dataset.copyTaglineDefault || "brand & identity",
        markDefault: root.dataset.copyMarkDefault || "YC",
    };

    const sdkUrl = root.dataset.sdk;
    const unit = root.dataset.unit || "PLN";
    const decimal = root.dataset.decimal || ".";
    const storageKey = "gvm_addons_basket_state";
    const checkoutParam = "checkout";
    const maxReference = 60;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const $ = (id) => document.getElementById(id);

    const els = {
        company: $("lk-company"),
        tagline: $("lk-tagline"),
        industry: $("lk-industry"),
        mood: $("lk-mood"),
        palette: $("lk-palette"),
        catalog: $("lk-catalog"),
        list: $("lk-basket-list"),
        total: $("lk-total"),
        totalTerms: $("lk-total-terms"),
        checkout: $("lk-checkout"),
        checkoutLabel: $("lk-checkout-label"),
        checkoutTotal: $("lk-checkout-total"),
        note: $("lk-checkout-note"),
        ctaSlot: $("basket-cta-slot"),
        trigger: $("basket-trigger"),
        preview: $("lk-preview"),
        logo: $("lk-logo"),
        mark: $("lk-mark"),
        name: $("lk-name"),
        taglinePreview: $("lk-tagline-preview"),
        swatches: $("lk-swatches"),
        assets: $("lk-assets"),
        success: $("lk-success"),
        successLogo: $("lk-success-logo"),
        successCompany: $("lk-success-company"),
        successCount: $("lk-success-count"),
        successTotal: $("lk-success-total"),
        successList: $("lk-success-list"),
        successReference: $("lk-success-reference"),
        downloadLogo: $("lk-download-logo"),
        downloadSpec: $("lk-download-spec"),
    };

    const inputs = Array.from(
        (els.catalog || root).querySelectorAll('input[type="checkbox"]')
    );

    /** Label element carrying name/price for a catalogue item. */
    function labelOf(id) {
        for (const input of inputs) {
            if (input.value === id) return input.closest(".lk-item");
        }
        return null;
    }

    const state = {
        company: "",
        tagline: "",
        industry: els.industry ? els.industry.value : "",
        mood: els.mood ? els.mood.value : "editorial",
        palette: els.palette ? els.palette.value : "graphite",
        gvmLoaded: false,
        opening: false,
        delivered: false,
        boundSignature: "",
    };

    /* ---------------------------------------------------------------- */
    /* helpers                                                           */
    /* ---------------------------------------------------------------- */

    function track(name, props) {
        try {
            const api = window.agg || (window.agg = {});
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

    /** Cents -> display string (no currency), e.g. 299 -> "2.99" / "2,99". */
    function money(cents) {
        return (cents / 100).toFixed(2).replace(".", decimal);
    }

    /** Cents -> canonical amount for data-gvm-price / analytics (always a dot). */
    function amount(cents) {
        return (cents / 100).toFixed(2);
    }

    function centsOf(id) {
        const label = labelOf(id);
        return label ? Number(label.dataset.itemCents) : 0;
    }

    function nameOf(id) {
        const label = labelOf(id);
        return label ? label.dataset.itemName : id;
    }

    function selectedIds() {
        return inputs.filter((input) => input.checked).map((input) => input.value);
    }

    function totalCents() {
        return inputs.reduce(
            (sum, input) => sum + (input.checked ? Number(labelOf(input.value)?.dataset.itemCents || 0) : 0),
            0
        );
    }

    function slugify(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 18);
    }

    function initials(value) {
        const words = String(value || "").trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return "";
        if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
        return (words[0][0] + words[1][0]).toUpperCase();
    }

    /** Deterministic, non-cryptographic hash (mock only). */
    function hashHex(input, length) {
        const source = String(input || "");
        let h1 = 0x811c9dc5;
        let h2 = 0x01000193;
        for (let i = 0; i < source.length; i += 1) {
            const code = source.charCodeAt(i);
            h1 = Math.imul(h1 ^ code, 16777619);
            h2 = Math.imul(h2 ^ (code + i), 2246822519);
        }
        const hex = (n) => (n >>> 0).toString(16).padStart(8, "0");
        return (hex(h1) + hex(h2)).slice(0, length).toUpperCase();
    }

    /** Basket fingerprint: a different signature means the bound price is stale. */
    function signature() {
        return [
            selectedIds().join("+"),
            String(totalCents()),
            state.mood,
            state.palette,
            slugify(state.company),
        ].join("|");
    }

    function reference() {
        const slug = slugify(state.company) || "brand";
        return ("logokit_" + slug + "_" + hashHex(signature(), 8)).slice(0, maxReference);
    }

    /* ---------------------------------------------------------------- */
    /* persistence                                                       */
    /* ---------------------------------------------------------------- */

    function persist() {
        try {
            sessionStorage.setItem(
                storageKey,
                JSON.stringify({
                    company: state.company,
                    tagline: state.tagline,
                    industry: state.industry,
                    mood: state.mood,
                    palette: state.palette,
                    selected: selectedIds(),
                })
            );
        } catch (err) {
            /* private mode — the basket just will not survive a reload */
        }
    }

    function restore() {
        let saved;
        try {
            saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        } catch (err) {
            return false;
        }
        if (!saved || typeof saved !== "object") return false;

        state.company = typeof saved.company === "string" ? saved.company : state.company;
        state.tagline = typeof saved.tagline === "string" ? saved.tagline : state.tagline;
        if (els.industry && optionExists(els.industry, saved.industry)) state.industry = saved.industry;
        if (els.mood && optionExists(els.mood, saved.mood)) state.mood = saved.mood;
        if (els.palette && optionExists(els.palette, saved.palette)) state.palette = saved.palette;

        if (Array.isArray(saved.selected)) {
            inputs.forEach((input) => {
                input.checked = saved.selected.includes(input.value);
            });
        }
        return true;
    }

    function optionExists(select, value) {
        return Array.from(select.options).some((option) => option.value === value);
    }

    /* ---------------------------------------------------------------- */
    /* gvm.js boot                                                       */
    /* ---------------------------------------------------------------- */

    /** Write the dynamic amount + reference BEFORE any SDK code runs. */
    function bindTrigger() {
        const trigger = els.trigger;
        if (!trigger) return;
        trigger.setAttribute("data-gvm-price", amount(totalCents()));
        trigger.setAttribute("data-gvm-reference", reference());
        trigger.setAttribute(
            "data-gvm-metadata-title",
            "LogoKit — " + (state.company.trim() || "brand")
        );
        state.boundSignature = signature();
    }

    function loadGvm() {
        if (state.gvmLoaded) return;
        state.gvmLoaded = true;

        track("basket_gvm_load", {
            env: document.body.dataset.gvmEnv || "",
            tenant: document.body.dataset.gvmTenant || "",
        });

        // gvm.js resolves the payment through this global (read at boot).
        document.body.setAttribute("data-gvm-callback", "basketPaymentCallback");

        if (!sdkUrl) {
            setNote(copy.loadFailed, true);
            return;
        }

        const script = document.createElement("script");
        script.type = "module";
        script.src = sdkUrl;
        script.addEventListener("error", () => {
            state.gvmLoaded = false;
            setNote(copy.loadFailed, true);
            track("basket_gvm_error", {});
        });
        document.head.appendChild(script);
    }

    /** Wait for the CTA that the `hide` strategy injects, then click it. */
    function clickInjectedPay() {
        let tries = 0;
        (function tick() {
            const pay = document.querySelector("#basket-cta-slot [data-gvm-bind-pay]");
            if (pay) {
                pay.click();
                return;
            }
            tries += 1;
            if (tries > 120) {
                setNote(copy.openFailed, true);
                setBusy(false);
                state.opening = false;
                return;
            }
            window.setTimeout(tick, 40);
        })();
    }

    function checkout() {
        if (totalCents() <= 0 || state.opening) return;

        // gvm.js already bound an older signature -> rebind through a reload.
        if (state.gvmLoaded && signature() !== state.boundSignature) {
            persist();
            const url = new URL(window.location.href);
            url.searchParams.set(checkoutParam, "1");
            window.location.assign(url.pathname + url.search);
            return;
        }

        state.opening = true;
        setBusy(true);
        track("basket_checkout", {
            value: amount(totalCents()),
            currency: unit,
            reference: reference(),
            items: selectedIds().join(","),
        });

        if (!state.gvmLoaded) {
            bindTrigger();
            loadGvm();
        }
        clickInjectedPay();

        window.setTimeout(() => {
            state.opening = false;
            setBusy(false);
        }, 1600);
    }

    /* ---------------------------------------------------------------- */
    /* payment lifecycle                                                 */
    /* ---------------------------------------------------------------- */

    function handlePayment(error, payload) {
        if (error) {
            setNote(error.message || copy.loadFailed, true);
            return;
        }
        const status = payload && payload.status;
        if (status === "resolved" || status === "duplicated") {
            closeDialogs();
            showSuccess(payload);
            return;
        }
        if (status === "rejected" || status === "expired") {
            setNote(payload && payload.message ? payload.message : "Payment " + status + ".", true);
        }
        if (status === "cancel") {
            state.opening = false;
            setBusy(false);
        }
    }

    // Referenced by `data-gvm-callback` (set right before the SDK boots).
    window.basketPaymentCallback = handlePayment;

    // Belt and braces: the SDK also emits lifecycle events.
    ["gvm:resolved", "gvm:duplicated"].forEach((event) => {
        window.addEventListener(event, (detail) => {
            handlePayment(null, Object.assign({ status: event.replace("gvm:", "") }, detail.detail));
        });
    });
    window.addEventListener("gvm:cancel", () => {
        state.opening = false;
        setBusy(false);
    });

    function closeDialogs() {
        document.querySelectorAll("dialog[open]").forEach((dialog) => {
            try {
                dialog.close();
            } catch (err) {
                dialog.remove();
            }
        });
    }

    /* ---------------------------------------------------------------- */
    /* brief                                                             */
    /* ---------------------------------------------------------------- */

    function bindBrief() {
        if (els.company) els.company.value = state.company;
        if (els.tagline) els.tagline.value = state.tagline;
        if (els.industry) els.industry.value = state.industry;
        if (els.mood) els.mood.value = state.mood;
        if (els.palette) els.palette.value = state.palette;

        els.company?.addEventListener("input", () => {
            state.company = els.company.value;
            onBriefChange();
        });
        els.tagline?.addEventListener("input", () => {
            state.tagline = els.tagline.value;
            onBriefChange();
        });
        els.industry?.addEventListener("change", () => {
            state.industry = els.industry.value;
            renderPreview();
            persist();
        });
        els.mood?.addEventListener("change", () => {
            state.mood = els.mood.value;
            onBriefChange();
        });
        els.palette?.addEventListener("change", () => {
            state.palette = els.palette.value;
            onBriefChange();
        });
    }

    function onBriefChange() {
        markDirtyIfBooted();
        renderPreview();
        persist();
    }

    /* ---------------------------------------------------------------- */
    /* catalogue + basket                                                */
    /* ---------------------------------------------------------------- */

    function bindCatalog() {
        inputs.forEach((input) => {
            const label = input.closest(".lk-item");
            label?.classList.toggle("is-selected", input.checked);
            input.addEventListener("change", () => {
                label?.classList.toggle("is-selected", input.checked);
                onSelectionChange(input.value, input.checked);
            });
        });
    }

    function onSelectionChange(id, checked) {
        markDirtyIfBooted();
        renderBasket();
        renderAssets();
        persist();
        track(checked ? "basket_item_add" : "basket_item_remove", {
            item: id,
            value: amount(centsOf(id)),
            currency: unit,
        });
    }

    function renderBasket() {
        const ids = selectedIds();
        const total = totalCents();

        if (els.list) {
            els.list.textContent = "";
            if (ids.length === 0) {
                const empty = document.createElement("li");
                empty.className = "lk-basket__empty";
                empty.textContent = copy.empty;
                els.list.appendChild(empty);
            } else {
                ids.forEach((id) => {
                    const row = document.createElement("li");
                    row.className = "lk-basket__row";

                    const name = document.createElement("span");
                    name.className = "lk-basket__name";
                    name.textContent = nameOf(id);

                    const price = document.createElement("span");
                    price.className = "lk-basket__price";
                    price.textContent = money(centsOf(id));

                    const remove = document.createElement("button");
                    remove.type = "button";
                    remove.className = "lk-basket__remove";
                    remove.setAttribute("aria-label", copy.remove + ": " + nameOf(id));
                    remove.textContent = "×";
                    remove.addEventListener("click", () => {
                        const input = inputs.find((entry) => entry.value === id);
                        if (!input) return;
                        input.checked = false;
                        input.dispatchEvent(new Event("change"));
                        input.focus();
                    });

                    row.append(name, price, remove);
                    els.list.appendChild(row);
                });
            }
        }

        if (els.total) els.total.textContent = money(total);
        if (els.totalTerms) els.totalTerms.textContent = money(total);
        if (els.checkoutTotal) els.checkoutTotal.textContent = money(total);
        if (els.checkout) els.checkout.disabled = total <= 0;
    }

    function setBusy(busy) {
        if (!els.checkout) return;
        els.checkout.setAttribute("aria-busy", busy ? "true" : "false");
        if (els.checkoutLabel) els.checkoutLabel.textContent = busy ? copy.opening : copy.pay;
    }

    function setNote(message, isError) {
        if (!els.note) return;
        els.note.textContent = message || "";
        els.note.classList.toggle("is-error", Boolean(isError));
        els.note.hidden = !message;
    }

    function markDirtyIfBooted() {
        if (!state.gvmLoaded) return;
        if (signature() === state.boundSignature) {
            setNote("", false);
            return;
        }
        setNote(copy.dirty, false);
    }

    /* ---------------------------------------------------------------- */
    /* live preview                                                      */
    /* ---------------------------------------------------------------- */

    function renderPreview() {
        if (els.preview) els.preview.dataset.palette = state.palette;
        if (els.logo) els.logo.dataset.mood = state.mood;

        if (els.name) els.name.textContent = state.company.trim() || copy.brandDefault;
        if (els.taglinePreview) els.taglinePreview.textContent = state.tagline.trim() || copy.taglineDefault;
        if (els.mark) els.mark.textContent = initials(state.company) || copy.markDefault;

        if (els.swatches) {
            els.swatches.querySelectorAll("[data-palette]").forEach((set) => {
                set.hidden = set.dataset.palette !== state.palette;
            });
        }
        renderAssets();
    }

    function renderAssets() {
        if (!els.assets) return;
        const name = state.company.trim() || copy.brandDefault;
        const tagline = state.tagline.trim() || copy.taglineDefault;
        const mark = initials(state.company) || copy.markDefault;

        els.assets.textContent = "";
        els.assets.append(
            buildMock("lk-mock--card", [
                ["lk-mock__mark", mark],
                ["lk-mock__name", name],
                ["lk-mock__tagline", tagline],
                ["lk-mock__caption", es("card")],
            ]),
            buildMock("lk-mock--social", [
                ["lk-mock__mark", mark],
                ["lk-mock__name", name],
                ["lk-mock__caption", es("social")],
            ]),
            buildMock("lk-mock--letter", [
                ["lk-mock__mark", mark],
                ["lk-mock__name", name],
                ["lk-mock__caption", es("letter")],
            ])
        );
    }

    /** Preview captions come from the page so both languages stay clean. */
    function es(kind) {
        const copyMap = {
            card: root.dataset.copyMockCard || "Business card",
            social: root.dataset.copyMockSocial || "Social post",
            letter: root.dataset.copyMockLetter || "Letterhead",
        };
        return copyMap[kind];
    }

    function buildMock(className, parts) {
        const mock = document.createElement("div");
        mock.className = "lk-mock " + className;
        parts.forEach(([partClass, text]) => {
            const part = document.createElement("span");
            part.className = partClass;
            part.textContent = text;
            mock.appendChild(part);
        });
        return mock;
    }

    /* ---------------------------------------------------------------- */
    /* delivery panel + mock downloads                                   */
    /* ---------------------------------------------------------------- */

    function showSuccess(payload) {
        if (!els.success) return;
        const ids = selectedIds();

        if (els.successCompany) {
            els.successCompany.textContent = state.company.trim() || copy.brandDefault;
        }
        if (els.successReference) els.successReference.textContent = reference();
        if (els.successTotal) els.successTotal.textContent = money(totalCents()) + " " + unit;
        if (els.successCount) {
            els.successCount.textContent =
                ids.length === 1 ? copy.countOne : copy.countMany.replace("%s", String(ids.length));
        }
        if (els.successList) {
            els.successList.textContent = "";
            ids.forEach((id) => {
                const row = document.createElement("li");
                row.textContent = nameOf(id) + " · " + money(centsOf(id)) + " " + unit;
                els.successList.appendChild(row);
            });
        }
        if (els.successLogo) {
            els.successLogo.textContent = "";
            els.successLogo.dataset.mood = state.mood;
            els.successLogo.dataset.palette = state.palette;
            if (els.logo) els.successLogo.appendChild(els.logo.cloneNode(true));
        }

        persist();
        els.success.hidden = false;
        if (!state.delivered) {
            state.delivered = true;
            track("basket_paid", {
                reference:
                    (payload && (payload.reference_id || payload.reference)) || reference(),
                status: payload && payload.status,
                value: amount(totalCents()),
                currency: unit,
                items: ids.join(","),
            });
        }
        els.success.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start",
        });
    }

    function paletteColors() {
        const styles = window.getComputedStyle(els.preview || document.documentElement);
        const read = (name, fallback) => {
            const value = styles.getPropertyValue(name).trim();
            return value || fallback;
        };
        return {
            ink: read("--lk-ink", "#1d1d1b"),
            accent: read("--lk-accent", "#7a7463"),
            soft: read("--lk-soft", "#ece8dc"),
            paper: read("--lk-paper", "#f5f2ea"),
        };
    }

    function escapeXml(value) {
        return String(value).replace(/[&<>"']/g, (char) => {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
    }

    function buildLogoSvg() {
        const colors = paletteColors();
        const name = state.company.trim() || copy.brandDefault;
        const tagline = state.tagline.trim() || copy.taglineDefault;
        const mark = initials(state.company) || copy.markDefault;
        const font =
            state.mood === "mono"
                ? "monospace"
                : state.mood === "editorial"
                  ? "Georgia, serif"
                  : "Helvetica, Arial, sans-serif";
        const radius = state.mood === "round" ? 28 : 0;
        const letterSpacing = state.mood === "mono" ? 4 : 0;
        const label = state.mood === "mono" ? name.toUpperCase() : name;

        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="240" viewBox="0 0 720 240">' +
            '<rect width="720" height="240" fill="' + colors.paper + '"/>' +
            '<rect x="40" y="60" width="120" height="120" rx="' + radius + '" fill="' + colors.ink + '"/>' +
            '<text x="100" y="134" text-anchor="middle" font-family="' + font + '" font-size="46" font-weight="700" fill="' + colors.paper + '" letter-spacing="' + letterSpacing + '">' + escapeXml(mark) + '</text>' +
            '<text x="190" y="122" font-family="' + font + '" font-size="42" font-weight="600" fill="' + colors.ink + '" letter-spacing="' + letterSpacing + '">' + escapeXml(label) + '</text>' +
            '<text x="192" y="156" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="' + colors.accent + '">' + escapeXml(tagline) + '</text>' +
            "</svg>"
        );
    }

    function downloadBlob(filename, mime, content) {
        try {
            const blob = new Blob([content], { type: mime });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            setNote(copy.loadFailed, true);
        }
    }

    function bindDownloads() {
        els.downloadLogo?.addEventListener("click", () => {
            downloadBlob(
                (slugify(state.company) || "brand") + "-logo.svg",
                "image/svg+xml",
                buildLogoSvg()
            );
            track("basket_download_logo", {});
        });

        els.downloadSpec?.addEventListener("click", () => {
            const spec = {
                brand: state.company.trim() || copy.brandDefault,
                tagline: state.tagline.trim(),
                industry: state.industry,
                typeStyle: state.mood,
                palette: state.palette,
                deliverables: selectedIds().map((id) => ({
                    id,
                    name: nameOf(id),
                    price: amount(centsOf(id)),
                })),
                total: amount(totalCents()) + " " + unit,
                reference: reference(),
                generatedBy: "GetViaMsg LogoKit showcase",
                mock: true,
            };
            downloadBlob(
                (slugify(state.company) || "brand") + "-brand.json",
                "application/json",
                JSON.stringify(spec, null, 2)
            );
            track("basket_download_spec", {});
        });
    }

    /* ---------------------------------------------------------------- */
    /* init                                                              */
    /* ---------------------------------------------------------------- */

    function cleanCheckoutParam() {
        try {
            const url = new URL(window.location.href);
            if (!url.searchParams.has(checkoutParam)) return;
            url.searchParams.delete(checkoutParam);
            const query = url.searchParams.toString();
            window.history.replaceState(
                null,
                "",
                url.pathname + (query ? "?" + query : "") + url.hash
            );
        } catch (err) {
            /* keep the parameter if replaceState is unavailable */
        }
    }

    function initPage() {
        const restored = restore();

        // Friendly starting basket on a first visit (no stored state).
        if (!restored && !state.company) {
            inputs.forEach((input) => {
                input.checked = input.value === "logo-primary" || input.value === "color-palette";
            });
        }

        bindBrief();
        bindCatalog();
        renderBasket();
        renderPreview();
        bindDownloads();
        els.checkout?.addEventListener("click", checkout);

        const checkoutIntent =
            new URLSearchParams(window.location.search).get(checkoutParam) === "1";

        if (checkoutIntent && totalCents() > 0) {
            bindTrigger();
            loadGvm();
            clickInjectedPay();
            cleanCheckoutParam();
        }
    }

    initPage();
}
