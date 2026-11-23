# `/app-basket` — in-app configurator ("LogoKit") with a dynamic basket amount

A mockup of an **app screen**, not a paywall: the customer configures how their
brand kit should look (company name, type style, palette) and picks priced
deliverables. The basket total is exactly the amount that goes to GetViaMsg when
they check out — 10 add-ons between 0.99 and 5.99 PLN, **at most 29.90 PLN for
all options**, so a full basket stays well under the 50 PLN commitment limit.

```
app-basket/
  index.html       app layout, catalog, live preview, payment dialog, templates
  app-basket.js    configurator state, basket total, lazy gvm.js boot, mock delivery
```

Open `/app-basket/` from the repo root (`npx live-server .`).

## What the page shows

| Section | Purpose |
| --- | --- |
| Hero | The pitch: configure a kit, the basket becomes the payment amount |
| Brief (step 1) | Company name, tagline, industry, type style, palette |
| Deliverables (step 2) | 10 optional items in 4 groups, each with its own price |
| Live preview | Logo, color swatches and mock business card / social / letterhead |
| Basket | Item list, running total, price/terms line, **Pay** button |
| Delivery | After a resolved commitment: the kit, deliverables, SVG/JSON download |
| Developer Kit | Why the amount is dynamic and how the trigger is bound |

## The hard part: a *dynamic* amount with a declarative SDK

gvm.js reads `data-gvm-price` / `data-gvm-reference` **once, at boot**
(`GvmProvider.processPaymentElements`). There is no re-scan, so a price that
changes after the module has loaded would be frozen.

`app-basket.js` therefore keeps the SDK **out of `<head>`**:

1. The configurator runs with plain DOM/JS and keeps the basket in minor units
   (cents) to avoid float drift.
2. On checkout it writes the total, a deterministic reference and a title onto
   the hidden `#basket-trigger`:

   ```html
   <div id="basket-trigger" hidden
        data-gvm-template-name="payment"
        data-gvm-hide-template-name="basket-cta"
        data-gvm-hide-strategy="hide"></div>
   ```

   ```js
   trigger.setAttribute("data-gvm-price", total.toFixed(2));
   trigger.setAttribute("data-gvm-reference", "logokit_" + slug + "_" + hash);
   ```

3. Only then does it append `https://esm.sh/@wdft/gvm-sdk@latest/gvm.js`.
4. The `hide` strategy is declared with **no split config**
   (`-sections` / `-percent` / `-words`), so nothing is hidden — gvm.js only
   injects the bound CTA from the `basket-cta` template into
   `#basket-cta-slot`.
5. The page clicks that CTA programmatically, which opens the standard QR + SMS
   dialog for the basket amount.

If the basket changes **after** gvm.js has booted, the bound price is stale, so
the page persists the basket and reloads with `?checkout=1`; on that landing it
binds a fresh trigger and boots the module again. The reference (and therefore
the commitment) changes with the basket.

## Reference & mock data

- Reference: `logokit_<company-slug>_<8 hex>`, max 60 chars. The hash is a
  deterministic, non-cryptographic hash of the basket fingerprint (mock only).
- The logo, swatches and asset previews are generated in the browser from the
  brief; “downloads” build an SVG/JSON `Blob` — no files are stored.
- Post-payment delivery is a front-end mock. In production your backend would
  verify the commitment signature before handing over the real assets (or an
  `unlock_url` back into the app).

## Environment

- `data-gvm-tenant="wdft_showcase_qa"`, `data-gvm-env="qa"`,
  `data-gvm-currency="PLN"` — the SMS/QR flow talks to the QA API, no real
  charge. Same tenant as the other examples.
- Switch `data-gvm-env` to `demo` to make the dialog resolve by itself while
  developing a theme.
- `data-gvm-analytics="custom"` + `assets/agg-gvm-bridge.js` forward the funnel
  events to agg. The page adds `basket_item_add`, `basket_item_remove`,
  `basket_checkout`, `basket_paid`, `basket_gvm_load` and the download events.

## Consent (regulamin 23.10.2026)

The payment dialog carries the mandatory price/terms info line and the
**unchecked** consent checkbox (`pl-2026-10-23`) that gates the QR and the
send-SMS button. The basket summary repeats the price info + terms link next to
the total (updated live), and the injected `basket-cta` template does too — the
checkbox itself lives in the dialog.

## Production note (`data-gvm-price-token`)

The basket is computed in the browser, so the amount could be tampered with. A
real app computes the total server-side and mints a signed
`data-gvm-price-token` for it, then verifies the commitment signature before
delivering the assets. See the gvm.js documentation → **Price token**.
