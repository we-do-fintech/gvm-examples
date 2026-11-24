/**
 * Light/dark theme switch.
 *
 * The pre-paint snippet in `partials/head.njk` applies the stored choice before
 * the first render (no flash). This file wires up the button in the site bar.
 *
 * Precedence: explicit choice (localStorage) → OS preference (CSS @media) →
 * the dark palette from gvm.css.
 */
(function () {
    "use strict";

    var KEY = "gvm-theme";
    var root = document.documentElement;
    var query = window.matchMedia("(prefers-color-scheme: light)");

    function current() {
        var explicit = root.getAttribute("data-theme");
        if (explicit === "light" || explicit === "dark") return explicit;
        return query.matches ? "light" : "dark";
    }

    function refreshLabels() {
        var button = document.querySelector("[data-theme-toggle]");
        if (!button) return;
        var theme = current();
        var next = theme === "light" ? "dark" : "light";
        var label = button.getAttribute(
            next === "light" ? "data-label-light" : "data-label-dark"
        );
        if (label) button.setAttribute("aria-label", label);
        button.setAttribute("aria-pressed", String(theme === "light"));
    }

    function apply(theme) {
        root.setAttribute("data-theme", theme);
        try {
            localStorage.setItem(KEY, theme);
        } catch (err) {
            /* private mode — the choice just will not persist */
        }
        refreshLabels();
    }

    document.addEventListener("click", function (event) {
        var button = event.target.closest && event.target.closest("[data-theme-toggle]");
        if (!button) return;
        apply(current() === "light" ? "dark" : "light");
    });

    // Keep the button honest if the visitor changes the OS setting.
    query.addEventListener("change", refreshLabels);
    refreshLabels();
})();
