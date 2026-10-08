/**
 * agg <-> gvm.js bridge
 *
 * gvm.js can emit its lifecycle events as DOM CustomEvents when a page opts in
 * with `data-gvm-analytics="custom"` (on the `[data-gvm]` element, or on the
 * `gvm-overlay.js` <script>). This file forwards those events to the
 * self-hosted agg instance as custom events, so the paywall funnel shows up
 * next to automatic page views.
 *
 * Events are forwarded as `gvm_<name>` with the gvm payload as props
 * (`value`, `currency`, `reference`, `tenant`, ...): render, initializing,
 * waiting, resolved, duplicated, expired, rejected, error, cancel, pay_click,
 * qr, sms_click, reveal, redirect, download, inject, terms-blocked.
 *
 * Loaded with `defer`, before gvm.js runs. Calls fall back to agg's pre-init
 * queue stub so nothing is lost while `agg.js` (async) is still loading.
 */
(function () {
    "use strict";

    var EVENTS = [
        "render",
        "initializing",
        "waiting",
        "resolved",
        "duplicated",
        "expired",
        "rejected",
        "error",
        "cancel",
        "pay_click",
        "qr",
        "sms_click",
        "reveal",
        "redirect",
        "download",
        "inject",
        "terms-blocked",
    ];

    function track(name, props) {
        var api = window.agg;
        if (api && typeof api.track === "function") {
            api.track(name, props);
            return;
        }
        if (!api) {
            api = window.agg = {};
        }
        if (!api.q) {
            api.q = [];
        }
        api.q.push(["track", name, props]);
    }

    EVENTS.forEach(function (name) {
        window.addEventListener("gvm:" + name, function (event) {
            track("gvm_" + name, event.detail || undefined);
        });
    });
})();
