# `gvm.js` Examples

Explore examples of `gvm.js` integration. Each strategy is contained in its own
directory. Full documentation is available at
[docs.wdft.ovh](https://docs.wdft.ovh/gvm-js).

You can either browse the source code or test it using **live-server**:

```sh
# Install live-server if you don't have it
# npm install -g live-server
live-server .  # Then open your browser to view the examples
```

See this repo live at:
[showcase.getviamsg.com](https://showcase.getviamsg.com)

---

## Consent checkbox + terms link (mandatory)

Since the terms of 23.10.2026 (regulamin):

- **Payment dialog** — every `<template>` with `data-gvm-bind-qr`,
  `data-gvm-bind-send-sms` or `data-gvm-bind-unlock` **must** contain, above
  the call-to-action, the price/terms info line with a link to
  [getviamsg.com/terms](https://getviamsg.com/terms) and an **unchecked**
  `<input type="checkbox" data-gvm-accept-terms="…"
  data-gvm-accept-terms-version="pl-2026-10-23">` whose `<label>` contains
  only the § 11 ust. 2 consent text. Without it the SDK does not create a
  commitment (no QR, no SMS link, no unlock). The QR is gated with
  `.payment-qr-gate` (blurred until consent).
- **Paywall** (the `data-gvm-bind-pay` button that only opens the dialog) —
  no checkbox; it shows the same price info line with the terms link.

The Polish wording is the legal text bound to the consent version, so copy
it verbatim from any example here (e.g. `./blur/index.html`). Styles live in
`assets/showcase.css` (`.consent`, `.consent-info`, `.consent-terms`).

---

## PWA unlock (experimental)

`./blur-pwa` is a copy of the blur example that additionally offers an
**“Unlock in the app”** button (`data-gvm-bind-unlock`) next to the SMS flow.
The button opens the portal claim link (`unlock_url`) returned by backends with
`GVM_PWA_ENABLED`; it binds **only** when that URL is present, so the legacy SMS
path (`data-gvm-bind-qr` / `data-gvm-bind-send-sms`) is unchanged. Requires
`@wdft/gvm-sdk >= 0.2.1` (button is inert on older builds / without the flag).

---

## Hide Strategy

The simplest, all-in-one file solution check: `./hide`. Includes only
declarations and script injection.

**Note:** This has commented `data-gvm-cond` for mobile and portrait mode -
check it in source, and turn on!

---

## Proxy Strategies

The `./download` directory showcase proxy strategy. These strategies typically
require a backend server or a load balancer with middleware to handle requests
before redirecting to a persistent or temporary address.

There is also `./inject` and `./redirect` strategy that has same way of
configuration, and logic. Check docs for available `data-gvm-*` attributes.

**Note:** In these examples, the server/proxy part is not included. They
demonstrate direct access to files or downloads.

---

## Ads (publisher page + ad-free day pass)

`./ads` is a newspaper-style publisher front page monetized with display ad
placeholders (leaderboard, in-article, native, rail, sticky bottom). The paid
button uses the **redirect** strategy (`data-gvm-http-redirect-to="/ads/?noads=1"`):
after a resolved payment gvm.js sends the reader back with signed query params,
the page stores a 24-hour pass in `localStorage` and `html.ads-free` hides every
ad slot before the first paint. Runs in `data-gvm-env="qa"` with tenant
`wdft_showcase_qa`, so the payment flow talks to the QA API without a real
charge. See `./ads/README.md`.

---

## App plans & activation (`/plan`)

`./plan` is a pricing page for the **“GetViaMsg for apps”** use case: three
monthly plans (9.99 / 19.99 / 29.99 PLN), a `data-gvm-env="qa"` SMS/QR checkout,
and a mock activation-code step.

The interesting bit is the e-mail → reference link: gvm.js reads
`data-gvm-reference` once at boot, so the page collects the e-mail used in the
app *first*, writes `plan_<tier>_<email-hash>` onto every plan card, and only
then imports `gvm.js` (so the module is not in `<head>`). A resolved commitment
shows an activation code derived from the e-mail; the code can be entered in the
“Activate a code” panel. All of that is front-end mock — production would mint a
price token, verify the commitment signature and issue the code server-side. See
[`./plan/README.md`](./plan/README.md).

---

## App basket (`/app-basket`)

`./app-basket` is an **in-app configurator** mockup (“LogoKit”): the customer
names a brand, picks a type style and a palette, and toggles up to 10 priced
deliverables (0.99–5.99 PLN). The basket total — at most 29.90 PLN for all
options — becomes the GetViaMsg amount. It reuses the `qa` tenant from the
other examples (`wdft_showcase_qa`).

The interesting bit is the **dynamic amount**: gvm.js reads `data-gvm-price` /
`data-gvm-reference` once at boot, so the page keeps the SDK out of `<head>`,
computes the total, writes it on `#basket-trigger` and only then imports the
module. The trigger uses the `hide` strategy with no split config (nothing is
hidden — gvm.js only injects the bound CTA) and the page clicks that CTA to open
the dialog. If the basket changes after boot, the reference is reloaded with
`?checkout=1` and a fresh trigger is bound, so the charged amount is never
stale. A resolved commitment renders a mock delivery panel in the browser. See
[`./app-basket/README.md`](./app-basket/README.md).

---

## Analytics (agg)

Traffic and paywall funnels are collected by a self-hosted
[agg](https://agg.worotyns.ovh) instance. Every full page loads the 3 KB SDK
before `</head>`:

```html
<script
    async
    src="https://agg.tfdw.ovh/agg.js"
    data-site="pk_tkajj6iaq6xz4vyuhop4"
></script>
```

Page views are automatic (site `showcase_getviamsg_com`). On pages that boot
`gvm.js`, the markup also opts into gvm's custom tracker
(`data-gvm-analytics="custom"`) and `assets/agg-gvm-bridge.js` forwards gvm's
lifecycle events (`gvm_render`, `gvm_pay_click`, `gvm_qr`, `gvm_resolved`,
`gvm_rejected`, …) to agg together with their `reference`, `value` and
`currency`. The matching aggregates and formulas are `paywall_views`,
`paywall_clicks`, `payments`, `paywall_ctr` and `paywall_conversion`.

To disable only the funnel bridge, drop `data-gvm-analytics="custom"` and the
`/assets/agg-gvm-bridge.js` script tag — page views keep working. The
`inject/swan.html` fragment is intentionally not tracked; it is injected into
an already-tracked page.

---

## Questions?

These examples are intended as simple showcases for developers. For more complex
use cases or custom examples, post new issue on github or contact our
[dev team](mailto:mateusz@wdft.ovh).
