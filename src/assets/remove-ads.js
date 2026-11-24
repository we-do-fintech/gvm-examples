/**
 * /publisher/remove-ads/ — ad-free day pass (redirect strategy).
 *
 * Restored from the archived flat example (src/archive/ads/ads.js). The page
 * loads gvm.js **itself** (front matter `gvmLazy: true`), and only when there
 * is no active ad-free day — so a reader who already paid fetches neither the
 * SDK nor a single ad.
 *
 *   1. `?noads=1` + `gvm-status=resolved|duplicated` → grant 24 h in
 *      localStorage (`gvm_ads_free_until`). The same grant also runs inline in
 *      <head> before the first paint (see the page `{% block head %}`), which
 *      is what prevents the flash of ads on the redirect landing.
 *   2. `html.ads-free` hides every `.ad-slot` and swaps the pass card for the
 *      status banner.
 *   3. `noads` / `gvm-*` are stripped from the address bar with
 *      `history.replaceState`.
 *
 * MOCK NOTE: the grant trusts the query string. In production verify
 * `gvm-signature` (HMAC of the params + your tenant secret) server-side before
 * issuing the pass, exactly like the redirect/download backend examples.
 */
(function () {
    "use strict";

    var STORE_KEY = "gvm_ads_free_until";
    var DAY_MS = 24 * 60 * 60 * 1000;
    var PASS_PRICE = "1.49";
    var PASS_REFERENCE = "ads_free_day";
    var URL_PARAMS = [
        "noads",
        "gvm-status",
        "gvm-commitment-id",
        "gvm-reference",
        "gvm-tenant",
        "gvm-signature",
        "gvm-signed-at"
    ];

    var state = {
        gvmLoaded: false,
        expiryTimer: null,
        tickTimer: null
    };

    /* ------------------------------------------------------------------ */
    /* helpers                                                             */
    /* ------------------------------------------------------------------ */

    function config() {
        var el = document.querySelector("script[data-gvm-sdk]");
        return {
            sdk: (el && el.getAttribute("data-gvm-sdk")) || "",
            lang: (el && el.getAttribute("data-gvm-lang")) || undefined
        };
    }

    /** Reuse the archive's agg helper: never let analytics break the page. */
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

    function readExpiry() {
        try {
            var value = parseInt(localStorage.getItem(STORE_KEY) || "0", 10);
            return Number.isFinite(value) && value > 0 ? value : 0;
        } catch (err) {
            return 0;
        }
    }

    function setAdFreeUntil(until) {
        try {
            localStorage.setItem(STORE_KEY, String(until));
        } catch (err) {
            /* private mode — the pass lasts for this page view only */
        }
    }

    function clearAdFree() {
        try {
            localStorage.removeItem(STORE_KEY);
        } catch (err) {
            /* ignore */
        }
    }

    function formatUntil(ts) {
        try {
            return new Date(ts).toLocaleString(config().lang, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (err) {
            return "later";
        }
    }

    function reduceMotion() {
        try {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        } catch (err) {
            return false;
        }
    }

    /* ------------------------------------------------------------------ */
    /* state <-> DOM                                                       */
    /* ------------------------------------------------------------------ */

    function renderCountdown() {
        var el = document.getElementById("ads-free-countdown");
        if (!el) return;
        var left = readExpiry() - Date.now();
        if (left <= 0) {
            el.textContent = "";
            return;
        }
        var hours = Math.floor(left / 3600000);
        var minutes = Math.floor((left % 3600000) / 60000);
        var seconds = Math.floor((left % 60000) / 1000);
        el.textContent =
            hours + " h " + minutes + " min " + seconds + " s";
    }

    /**
     * Sync the DOM with the stored pass. Returning `false` means the day
     * expired while the page was open.
     */
    function applyAdFreeState() {
        var until = readExpiry();
        var active = until > Date.now();
        document.documentElement.classList.toggle("ads-free", active);

        var label = document.getElementById("ads-free-until");
        if (label) {
            label.textContent = active ? formatUntil(until) : "";
        }
        if (!active && until) {
            clearAdFree();
        }
        return active;
    }

    function readLanding() {
        var params = new URLSearchParams(location.search);
        var status = params.get("gvm-status");
        var noAds = params.get("noads") === "1";
        var paid =
            noAds &&
            (!status || status === "resolved" || status === "duplicated");
        return { noAds: noAds, status: status, paid: paid };
    }

    function cleanUrl() {
        try {
            var url = new URL(location.href);
            URL_PARAMS.forEach(function (key) {
                url.searchParams.delete(key);
            });
            var query = url.searchParams.toString();
            history.replaceState(
                null,
                "",
                url.pathname + (query ? "?" + query : "") + url.hash
            );
        } catch (err) {
            /* keep the params if replaceState is unavailable */
        }
    }

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
    /* gvm.js loading (skipped while the pass is active)                   */
    /* ------------------------------------------------------------------ */

    function loadGvm() {
        if (state.gvmLoaded) return;
        var url = config().sdk;
        if (!url) return;
        state.gvmLoaded = true;

        var script = document.createElement("script");
        script.type = "module";
        script.src = url;
        script.addEventListener("error", function () {
            state.gvmLoaded = false;
            var button = document.getElementById("ads-free-button");
            if (button) {
                button.disabled = true;
                button.textContent = "Payment module unavailable — reload";
            }
            track("ads_gvm_error", {});
        });
        document.head.appendChild(script);
    }

    /* ------------------------------------------------------------------ */
    /* sticky bottom banner                                                */
    /* ------------------------------------------------------------------ */

    function bindSticky() {
        var close = document.getElementById("ads-sticky-close");
        var slot = document.getElementById("ads-sticky");
        if (!close || !slot) return;
        close.addEventListener("click", function () {
            slot.classList.add("is-dismissed");
            track("ads_dismiss", {
                unit: slot.getAttribute("data-ad-unit") || "sticky-bottom"
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /* lifecycle                                                           */
    /* ------------------------------------------------------------------ */

    function startExpiryWatch() {
        if (state.expiryTimer) return;
        state.expiryTimer = setInterval(function () {
            if (!applyAdFreeState()) {
                clearInterval(state.expiryTimer);
                state.expiryTimer = null;
                track("ads_free_expired", {});
                loadGvm();
            }
        }, 30000);
    }

    function startCountdown() {
        if (state.tickTimer) return;
        var period = reduceMotion() ? 30000 : 1000;
        renderCountdown();
        state.tickTimer = setInterval(renderCountdown, period);
    }

    function init() {
        bindSticky();

        var landing = readLanding();
        if (landing.paid) {
            setAdFreeUntil(Date.now() + DAY_MS);
            track("ads_free_activated", {
                value: PASS_PRICE,
                currency: "PLN",
                reference: PASS_REFERENCE,
                status: landing.status || "unknown"
            });
            closeDialogs();
            cleanUrl();
        } else if (landing.noAds) {
            cleanUrl();
        }

        if (applyAdFreeState()) {
            startCountdown();
            startExpiryWatch();
        } else {
            loadGvm();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
