/**
 * /ads — publisher front page with ad slots & an "ad-free day" pass
 *
 * The pass button is a gvm.js **redirect** trigger:
 *
 *     data-gvm-http-redirect-to="/ads/?noads=1"
 *
 * After a resolved (or duplicated) commitment gvm.js appends signed query
 * params — `gvm-status=resolved&gvm-commitment-id=…&gvm-reference=…&…` — and
 * sends the browser back to this page. Everything else is front-end:
 *
 *   1. `?noads=1` + `gvm-status=resolved|duplicated` → grant 24 h in
 *      localStorage (`gvm_ads_free_until`).
 *   2. `html.ads-free` hides every `.ad-slot` (CSS) and swaps the pass card
 *      for the status banner. The class is set before the first paint by the
 *      inline check in <head>, so there is no ad flash on the redirect landing.
 *   3. gvm.js is only loaded when there is **no** active ad-free day, so a
 *      reader who already paid fetches neither the SDK nor an ad.
 *
 * MOCK NOTE: the grant trusts the query string. In production you must verify
 * `gvm-signature` (HMAC of the params + your tenant secret) on the server
 * before issuing the day pass — the same check the redirect/download backends
 * use in the other strategies.
 */
(function () {
    "use strict";

    var GVM_URL = "https://esm.sh/@wdft/gvm-sdk@latest/gvm.js";
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
        timer: null
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

    function readExpiry() {
        try {
            var raw = localStorage.getItem(STORE_KEY);
            var value = parseInt(raw || "0", 10);
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
            return new Date(ts).toLocaleString(undefined, {
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

    /**
     * Sync the DOM with the stored pass. Also used by the 30 s watch, so
     * returning `false` means the day expired while the page was open.
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

    /**
     * Read the params gvm.js appends on the redirect landing.
     */
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
    /* gvm.js loading                                                      */
    /* ------------------------------------------------------------------ */

    function loadGvm() {
        if (state.gvmLoaded) return;
        state.gvmLoaded = true;

        var script = document.createElement("script");
        script.type = "module";
        script.src = GVM_URL;
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
    /* sticky banner                                                       */
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
        if (state.timer) return;
        state.timer = setInterval(function () {
            if (!applyAdFreeState()) {
                clearInterval(state.timer);
                state.timer = null;
                track("ads_free_expired", {});
                loadGvm();
            }
        }, 30000);
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
