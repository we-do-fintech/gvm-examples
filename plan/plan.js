/**
 * /plan — app plans & activation (gvm.js showcase)
 *
 * Two flows on one page:
 *
 *  1. "Buy a plan"  — the customer types the e-mail they use in the app. We
 *     derive `plan_<tier>_<emailHash>` and write it onto each plan card, then
 *     load gvm.js. gvm.js reads the reference once at boot, so the module is
 *     loaded *after* the e-mail is known (not in <head>).
 *     A resolved commitment → planPaymentCallback() → mock activation code.
 *
 *  2. "Activate a code" — front-end mock: the code is a deterministic
 *     12-character hash of the e-mail, so the full loop is testable without a
 *     backend.
 *
 * Everything except the QA payment call is mocked on purpose: this is a
 * showcase. In production the e-mail reconciliation and the activation code
 * live in your backend (verify the commitment signature, then activate the
 * app account and/or return `unlock_url`).
 */
(function () {
    "use strict";

    var GVM_URL = "https://esm.sh/@wdft/gvm-sdk@latest/gvm.js";
    var STORAGE_EMAIL = "gvm_plan_email";

    var PLANS = [
        { id: "basic", name: "Basic", price: "9.99" },
        { id: "plus", name: "Plus", price: "19.99" },
        { id: "pro", name: "Pro", price: "29.99" }
    ];

    var state = {
        email: "",
        pendingPlan: null,
        gvmLoaded: false
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

    function isEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());
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

    /**
     * Deterministic, non-cryptographic hash. MOCK ONLY — production activation
     * codes are issued by the backend after the commitment signature check.
     */
    function hashHex(input, length) {
        var source = String(input || "").trim().toLowerCase();
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
        var out = (
            hex(h1) +
            hex(h2) +
            hex(h1 ^ h2) +
            hex((h1 + h2) >>> 0)
        ).toUpperCase();
        return out.slice(0, length);
    }

    function emailHash(email) {
        return hashHex(email, 10);
    }

    function referenceFor(tier, email) {
        return "plan_" + tier + "_" + emailHash(email);
    }

    function activationCode(email) {
        var hash = hashHex(email, 12);
        return hash.slice(0, 4) + "-" + hash.slice(4, 8) + "-" + hash.slice(8, 12);
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    /* ------------------------------------------------------------------ */
    /* payment lifecycle                                                   */
    /* ------------------------------------------------------------------ */

    // Referenced by `data-gvm-callback="planPaymentCallback"` on <body>.
    window.planPaymentCallback = function (error, payload) {
        if (error) {
            setEmailHint(error.message || "Payment could not be started.", true);
            return;
        }
        var status = payload && payload.status;
        if (status === "resolved" || status === "duplicated") {
            closeDialogs();
            showSuccess(payload);
        } else if (status === "rejected" || status === "expired") {
            setEmailHint(
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

    function showSuccess(payload) {
        var plan = state.pendingPlan || PLANS[0];
        var panel = document.getElementById("plan-success");
        if (!panel) return;

        setText("plan-success-plan", plan.name);
        setText("plan-success-email", state.email);
        setText("plan-success-code", activationCode(state.email));

        var unlock = document.getElementById("plan-success-unlock");
        if (unlock && payload && payload.unlock_url) {
            unlock.href = payload.unlock_url;
            unlock.hidden = false;
        }

        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "center" });

        track("plan_activated", {
            reference:
                (payload && (payload.reference_id || payload.reference)) ||
                undefined,
            status: payload && payload.status,
            plan: plan.id,
            value: plan.price,
            currency: "PLN"
        });
    }

    /* ------------------------------------------------------------------ */
    /* e-mail gate + plan cards                                            */
    /* ------------------------------------------------------------------ */

    function setEmailHint(message, isError) {
        var hint = document.getElementById("plan-email-hint");
        if (!hint) return;
        hint.innerHTML = escapeHtml(message);
        hint.classList.toggle("is-error", !!isError);
    }

    function updateEmailUi() {
        var hint = document.getElementById("plan-email-hint");
        if (!hint) return;
        if (!state.email) {
            hint.classList.remove("is-error");
            hint.textContent =
                "We use this e-mail in the payment reference, so the plan lands on the right app account.";
            return;
        }
        hint.classList.remove("is-error");
        hint.innerHTML =
            "Linked to <strong>" +
            escapeHtml(state.email) +
            "</strong>. Payment reference: <code>plan_&lt;tier&gt;_" +
            escapeHtml(emailHash(state.email)) +
            "</code>";
    }

    function persistEmail(value) {
        try {
            localStorage.setItem(STORAGE_EMAIL, value);
        } catch (err) {
            /* private mode — e-mail just won't survive a reload */
        }
    }

    function readStoredEmail() {
        try {
            return localStorage.getItem(STORAGE_EMAIL) || "";
        } catch (err) {
            return "";
        }
    }

    function activatePlanCards() {
        PLANS.forEach(function (plan) {
            var card = document.querySelector(
                '[data-plan-id="' + plan.id + '"]'
            );
            if (!card) return;
            card.setAttribute(
                "data-gvm-reference",
                referenceFor(plan.id, state.email)
            );
            card.setAttribute("data-gvm-price", plan.price);
            card.setAttribute(
                "data-gvm-metadata-title",
                plan.name + " plan"
            );
            var slot = document.getElementById("plan-cta-" + plan.id);
            if (slot) slot.innerHTML = "";
        });
    }

    function loadGvm() {
        if (state.gvmLoaded) return;
        state.gvmLoaded = true;
        track("plan_gvm_load", { env: "qa", tenant: "wdft_showcase_qa" });

        var script = document.createElement("script");
        script.type = "module";
        script.src = GVM_URL;
        script.addEventListener("error", function () {
            state.gvmLoaded = false;
            setEmailHint(
                "Could not load gvm.js. Check your connection and reload.",
                true
            );
        });
        document.head.appendChild(script);
    }

    function bindEmailForm() {
        var form = document.getElementById("plan-email-form");
        if (!form) return;
        var input = document.getElementById("plan-email");

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var value = String((input && input.value) || "")
                .trim()
                .toLowerCase();

            if (!isEmail(value)) {
                setEmailHint("Enter a valid e-mail address.", true);
                if (input) input.focus();
                return;
            }

            if (state.gvmLoaded && value !== state.email) {
                // References are read once, at gvm.js boot — reload to rebind.
                persistEmail(value);
                location.reload();
                return;
            }

            if (state.gvmLoaded && value === state.email) {
                setEmailHint("Plans already use this e-mail. Choose one below.", false);
                return;
            }

            state.email = value;
            persistEmail(value);
            activatePlanCards();
            updateEmailUi();
            loadGvm();
            track("plan_email_set", {});
        });
    }

    function bindPlanGrid() {
        var grid = document.getElementById("plan-grid");
        if (!grid) return;
        grid.addEventListener("click", function (event) {
            var target = event.target;
            var button =
                target && target.closest
                    ? target.closest("[data-gvm-bind-pay]")
                    : null;
            if (!button) return;
            var card = button.closest("[data-plan-id]");
            if (!card) return;
            var id = card.getAttribute("data-plan-id");
            state.pendingPlan =
                PLANS.filter(function (plan) {
                    return plan.id === id;
                })[0] || null;
            track("plan_pay_click", {
                plan: id,
                value: card.getAttribute("data-gvm-price"),
                reference: card.getAttribute("data-gvm-reference")
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /* activation code (mock)                                              */
    /* ------------------------------------------------------------------ */

    function setActivateMessage(message, isError) {
        var el = document.getElementById("plan-activate-message");
        if (!el) return;
        el.textContent = message;
        el.classList.toggle("is-error", !!isError);
        el.classList.toggle("is-ok", !isError);
    }

    function bindActivateForm() {
        var form = document.getElementById("plan-activate-form");
        if (!form) return;
        var emailInput = document.getElementById("plan-activate-email");
        var codeInput = document.getElementById("plan-activate-code");
        var demoButton = document.getElementById("plan-demo-code");

        if (demoButton) {
            demoButton.addEventListener("click", function () {
                var email = String((emailInput && emailInput.value) || "")
                    .trim()
                    .toLowerCase();
                if (!isEmail(email)) {
                    setActivateMessage(
                        "Type an e-mail first, then generate its demo code.",
                        true
                    );
                    return;
                }
                if (codeInput) codeInput.value = activationCode(email);
                setActivateMessage(
                    "Demo code generated for " + email + ".",
                    false
                );
            });
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var email = String((emailInput && emailInput.value) || "")
                .trim()
                .toLowerCase();
            var raw = String((codeInput && codeInput.value) || "")
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "");

            if (!isEmail(email)) {
                setActivateMessage("Enter the e-mail you use in the app.", true);
                return;
            }
            if (raw.length !== 12) {
                setActivateMessage(
                    "Activation codes are 12 characters (XXXX-XXXX-XXXX).",
                    true
                );
                return;
            }
            var expected = activationCode(email).replace(/-/g, "");
            if (raw !== expected) {
                setActivateMessage(
                    "This code does not match that e-mail. In the mock the code is a hash of the e-mail — use “Show demo code”.",
                    true
                );
                return;
            }

            setActivateMessage(
                "Plan activated for " + email + ". Open the app to see it.",
                false
            );
            track("plan_code_activated", {});
        });
    }

    function bindCopyCode() {
        var button = document.getElementById("plan-copy-code");
        if (!button) return;
        button.addEventListener("click", function () {
            var code = document.getElementById("plan-success-code");
            if (!code) return;
            var value = code.textContent || "";
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard
                    .writeText(value)
                    .then(function () {
                        button.textContent = "Copied";
                        setTimeout(function () {
                            button.textContent = "Copy";
                        }, 1600);
                    })
                    .catch(function () {
                        button.textContent = "Copy manually";
                    });
            } else {
                button.textContent = value;
            }
            track("plan_code_copy", {});
        });
    }

    /* ------------------------------------------------------------------ */
    /* init                                                                */
    /* ------------------------------------------------------------------ */

    function init() {
        bindEmailForm();
        bindPlanGrid();
        bindActivateForm();
        bindCopyCode();

        var stored = readStoredEmail().trim().toLowerCase();
        if (isEmail(stored)) {
            state.email = stored;
            var input = document.getElementById("plan-email");
            if (input) input.value = stored;
            activatePlanCards();
            updateEmailUi();
            loadGvm();
        } else {
            updateEmailUi();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
