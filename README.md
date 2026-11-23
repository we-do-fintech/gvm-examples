# GetViaMsg showcase (`gvm-examples`)

A bilingual (PL/EN) showcase of GetViaMsg — micropayments for single pieces of
content. Every example is a working page: you can click through the whole
payment flow (QA tenant, no real charge).

Live: [showcase.getviamsg.com](https://showcase.getviamsg.com) · Docs:
[docs.wdft.ovh/gvm-js](https://docs.wdft.ovh/gvm-js)

---

## Quick start

```sh
pnpm install        # or npm install
pnpm build          # Eleventy -> dist/
pnpm serve          # dev server with live reload
```

`build` wipes `dist/` first, so stale pages never survive a rebuild. Nothing
outside `dist/` is served — deploy that directory.

## Structure

```
src/
  index.njk                 showcase index (PL) -> /
  en/index.njk              showcase index (EN) -> /en/
  publisher/                category: publishers
    unlock-article.njk      hide strategy, inline paywall
    download-hi-res-pic.njk download strategy, poster previews
  digital-ecommerce/        category: digital goods
    download-ebook.njk      download strategy
    download-music-file.njk one trigger per track
    pay-per-view.njk        hide strategy, video
    audiobook.njk           download strategy
  en/                       English mirrors of the pages above
  archive/                  previous flat examples (reference only, NOT built)
  assets/                   css, logos, favicon, agg bridge
  _includes/
    layouts/base.njk        html, head, skip link, header, main, footer
    partials/               head, header, footer, lang-switch, example-bar
    gvm/                    payment dialog, consent, paywall, dialog a11y
  _data/
    site.js                 tenant, env, currency, SDK + outbound URLs
    i18n/pl.json, en.json   shared chrome + payment/paywall strings
    catalog.js              build-time catalogue of ./content
```

## URL map

| PL | EN |
| --- | --- |
| `/` | `/en/` |
| `/publisher/` | `/en/publisher/` |
| `/publisher/unlock-article/` | `/en/publisher/unlock-article/` |
| `/publisher/download-hi-res-pic/` | `/en/publisher/download-hi-res-pic/` |
| `/digital-ecommerce/` | `/en/digital-ecommerce/` |
| `/digital-ecommerce/download-ebook/` | `/en/digital-ecommerce/download-ebook/` |
| `/digital-ecommerce/download-music-file/` | `/en/digital-ecommerce/download-music-file/` |
| `/digital-ecommerce/pay-per-view/` | `/en/digital-ecommerce/pay-per-view/` |
| `/digital-ecommerce/audiobook/` | `/en/digital-ecommerce/audiobook/` |

Planned next: `/publisher/remove-ads/`, `/saas-licenses/`, `/add-ons/`.
Hyphens in URLs, one language per page.

## Content (`content/`)

Editorial files live outside `src/` and are read at build time by
`src/_data/catalog.js`. Drop a file in and the next build picks it up
(`npm run serve` watches the directory).

```
content/
  pl/       Polish copy: article_txt.md, vod.md, *.pdf, *.epub, *.mp3
  en/       English copy; anything missing falls back to pl/
  common/   shared binaries: posterN.jpg + posterN_small.jpg, lofi_*.ogg
```

Resolution rules:

- `<lang>/` wins, then `pl/`, then `common/`.
- Markdown: the file matching `article*.md` is the article; a `.md` holding
  only a URL is the VOD link. The first heading becomes the page `<h1>`, the
  rest is re-levelled to h2/h3 and rendered to HTML.
- The free preview ends right before the first section heading; the word count
  is passed to gvm.js as `data-gvm-hide-words`.
- `.pdf`, `.epub`, `.mp3`, `.ogg`, `.jpg` are copied to `dist/content/` so the
  download strategy has real URLs. Durations (ffprobe) and image sizes are read
  at build time for the file metadata.

The article page sets `lang="{{ article.contentLang }}"` on the body, so an EN
page still using PL copy keeps correct language metadata.

## How examples are built

Pages set `lang` (and optionally `crumb`, `altUrl`, `gvm: true`) in front
matter and then compose shared pieces:

```njk
{% extends "layouts/base.njk" %}
{% from "gvm/payment-dialog.njk" import paymentDialog %}
{% from "gvm/paywall-inline.njk" import paywallInline %}

{% block content %}
  <div id="article" data-gvm-price="1.99" data-gvm-reference="…"
       data-gvm-hide-strategy="hide" data-gvm-hide-sections="6"
       data-gvm-template-name="payment" data-gvm-hide-template-name="paywall">
    …content…
  </div>
  {{ paymentDialog({ t: i18n[lang], termsUrl: site.termsUrl,
                     termsVersion: site.termsVersion }) }}
  {{ paywallInline({ t: i18n[lang], termsUrl: site.termsUrl }) }}
{% endblock %}
```

Rules of thumb:

- **One `payment` dialog**, shared by every example. It reads the amount and
  the content reference from the gated element, so the markup never changes.
- **One partial per paywall layout** (inline, overlay, sticky bottom/right,
  widget, banner, drawer). They differ in markup and in where they are
  injected, so sharing a single template would fight itself.
- Examples that compute the price at runtime (basket, plans) keep the SDK out
  of `<head>` and import `gvm.js` after writing `data-gvm-price`.

## Consent and terms (mandatory)

Since the terms of 23.10.2026 every payment dialog that binds QR / SMS / unlock
must contain, above the call to action:

- the price + terms line linking to <https://getviamsg.com/terms>, and
- an **unchecked** `<input type="checkbox" data-gvm-accept-terms="…"
  data-gvm-accept-terms-version="pl-2026-10-23">` whose label carries the
  § 11 ust. 2 consent wording (Polish, always `lang="pl"`).

Both live in `_includes/gvm/consent.njk`; `paymentDialog` pulls them in.
The paywall itself (the button that only opens the dialog) shows the price
line without a checkbox.

## gvm.js flow in the article example

1. The full text is in the DOM inside `#article` with `.wait-for-script`.
2. `gvm.js` (module, runs before `DOMContentLoaded`) hides the content after
   `data-gvm-hide-sections` and injects the `paywall` template into `#article`.
3. The page reveals `.wait-for-script` on `DOMContentLoaded`; `<noscript>` lets
   the text show without JS.
4. `data-gvm-bind-pay` opens the shared `payment` dialog, the consent checkbox
   unlocks the QR, and the SMS resolves the commitment.
5. `_includes/gvm/dialog-a11y.njk` makes the non-modal `<dialog>` behave: the
   page behind it becomes `inert`, focus moves inside and returns to the pay
   button, Escape maps to gvm’s cancel button.

## Styling

`src/assets/gvm.css` is written from scratch (no pico.css). Tokens follow
getviamsg.com: `#232526` background, white ink, `#909090` muted, `#ffba00`
accent, Inter.

The legacy examples and their stylesheets (`pico.css`, `showcase.css`) live in
`src/archive/` and are not part of the build.

## Analytics

Traffic and the paywall funnel go to a self-hosted agg instance:

```html
<script async src="https://agg.tfdw.ovh/agg.js" data-site="pk_tkajj6iaq6xz4vyuhop4"></script>
```

Pages that boot gvm also load `/assets/agg-gvm-bridge.js`, which forwards
`gvm_render`, `gvm_pay_click`, `gvm_qr`, `gvm_resolved`, `gvm_rejected` with
`reference`, `value` and `currency`.

## Content sources

The article example uses public-domain text so the page keeps real context
without shipping lorem ipsum:

- PL: Henryk Sienkiewicz, *Latarnik* (1881), [wolnelektury.pl](https://wolnelektury.pl/katalog/lektura/latarnik.html)
- EN: *The Light-House Keeper of Aspinwall*, transl. Jeremiah Curtin (1893), [Wikisource](https://en.wikisource.org/wiki/Stories_by_Foreign_Authors_(Polish-Greek-Belgian-Hungarian)/The_Light-House_of_Aspinall)

Both are in the public domain and are used unchanged.

## Archive

`src/archive/` holds the previous flat examples (hide, blur, overlay, templates,
plan, ads, app-basket, …) and their legacy CSS (`pico.css`, `showcase.css`).
Eleventy ignores the whole directory: it is a reference library to mine layouts
and use cases from, not part of the build.
