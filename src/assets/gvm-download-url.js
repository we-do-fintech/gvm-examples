/**
 * gvm.js resolves `data-gvm-http-download` as
 *
 *     [location.origin, path].join("/")
 *
 * so a root-relative path like "/content/x.epub" becomes
 * "https://host//content/x.epub". Strict static servers — including Eleventy's
 * dev server — answer that with "Cannot GET //content/…", and the browser saves
 * the error page as the "download".
 *
 * The SDK reads the attribute on DOMContentLoaded, and a classic `defer` script
 * runs before that, so we hand it an absolute URL instead. Delete this file
 * once the SDK stops inserting the extra "/".
 */
(function () {
    "use strict";

    var nodes = document.querySelectorAll("[data-gvm-http-download]");

    for (var i = 0; i < nodes.length; i += 1) {
        var value = nodes[i].getAttribute("data-gvm-http-download");
        if (value && value.charAt(0) === "/" && value.charAt(1) !== "/") {
            nodes[i].setAttribute(
                "data-gvm-http-download",
                window.location.origin + value
            );
        }
    }
})();
