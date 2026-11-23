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
  index.njk                 showcase index (PL) -> / (use cases, no-code, templates)
  en/index.njk              showcase index (EN) -> /en/
  publisher/                category: publishers
    unlock-article.njk      hide strategy, inline paywall
    download-hi-res-pic.njk download strategy, poster previews
    remove-ads.njk          ad slots + sticky adbar, 24h ad-free via localStorage
  digital-ecommerce/        category: digital goods
    download-ebook.njk      download strategy
    download-music-file.njk one trigger per track
    download-report.njk     download strategy, PDF + EPUB
    pay-per-view.njk        hide strategy, video injected after payment
    audiobook.njk           download strategy
  saas-licenses/index.njk   plan cards, SMS confirmation, one collective bill
  add-ons/                  add-on configurator, basket
  templates/                the four payment-form variants
    drawer.njk              default form (drawer)
    modal.njk               legacy <dialog> form, kept as a variant only
    simple.njk circle.njk   raw, hand-rolled variants
  no-code/                  gvm-overlay.js demos (English copy)
    index.njk               overlay landing page
    article-1.njk           blur (1.45 PLN)
    article-2.njk           hide (2.50 PLN)
    article-3.njk           mangle-blur (2.00 PLN)
  ppv-player.njk            permalink /ppv/player.html — injected iframe
  en/                       English mirrors of the pages above
  archive/                  previous flat examples (reference only, NOT built)
  assets/                   css, logos, favicon, agg bridge
    gvm.css                 foundation: chrome, content, cards, ads, PPV
    gvm-drawer.css          payment drawer (default form), linked when gvm: true
    legacy.css              overlay pages only (front matter: legacyCss: true)
  _includes/
    layouts/base.njk        html, head, skip link, header, main, footer
    partials/               head, header, footer, lang-switch, example-bar
    gvm/                    payment drawer + dialog, consent, paywall, dialog a11y
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
| `/publisher/remove-ads/` | `/en/publisher/remove-ads/` |
| `/digital-ecommerce/` | `/en/digital-ecommerce/` |
| `/digital-ecommerce/download-ebook/` | `/en/digital-ecommerce/download-ebook/` |
| `/digital-ecommerce/download-music-file/` | `/en/digital-ecommerce/download-music-file/` |
| `/digital-ecommerce/download-report/` | `/en/digital-ecommerce/download-report/` |
| `/digital-ecommerce/pay-per-view/` | `/en/digital-ecommerce/pay-per-view/` |
| `/digital-ecommerce/audiobook/` | `/en/digital-ecommerce/audiobook/` |
| `/saas-licenses/` | `/en/saas-licenses/` |
| `/add-ons/` | `/en/add-ons/` |
| `/templates/drawer/` | `/en/templates/drawer/` |
| `/templates/modal/` | `/en/templates/modal/` |
| `/templates/simple/` | `/en/templates/simple/` |
| `/templates/circle/` | `/en/templates/circle/` |
| `/no-code/` | `/en/no-code/` |
| `/no-code/article-1/` | `/en/no-code/article-1/` |
| `/no-code/article-2/` | `/en/no-code/article-2/` |
| `/no-code/article-3/` | `/en/no-code/article-3/` |
| `/ppv/player.html` | — (injected iframe, no page) |

Hyphens in URLs, one language per page. The no-code overlay articles are
English-only (see below), so only their EN path exists today.

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

## Payment form

The default payment form is the **drawer**: `_includes/gvm/payment-drawer.njk`
plus `assets/gvm-drawer.css`, linked automatically by `partials/head.njk`
whenever a page sets `gvm: true`. gvm renders it as a full-height panel on the
right on desktop and as a bottom sheet on phones, so it stays usable at 320px.
Every example — publishers, e-commerce, ads, plans, add-ons — uses this drawer.

The legacy modal (`_includes/gvm/payment-dialog.njk`, styled by `gvm.css`) is
kept **only** for the Templates section, where the point is to show the variant
side by side with `simple`, `circle` and the drawer itself.

Because these are two separate files, do not restyle `.gvm-payment-drawer*`
from `gvm.css`: the drawer carries its own tokens (`--gvm-*`) and the showcase
only overrides them at `:root` when needed.

## No-code

The overlay pages under `src/no-code/` are a different beast from the rest of
the showcase. They load `gvm-overlay.js` (`esm.sh/@wdft/gvm-sdk/gvm-overlay.js`)
instead of `gvm.js`: drop the script tag in and the service finds and locks the
content itself — no per-element `data-gvm-*` markup.

- **One script tag** in `{% block head %}`, with `data-gvm-tenant`,
  `data-gvm-env` and `data-gvm-analytics="custom"`.
- **`.gvm-cloak`** marks the premium block; an inline
  `<style>.gvm-cloak{visibility:hidden}</style>` hides it before the SDK boots,
  so the paid text never flashes. The SDK drops the class once it has taken
  over.
- **`legacyCss: true`** in front matter pulls in `assets/legacy.css`, the
  article layout the overlay demos were authored against (`news-article`,
  `section-card`, `article-figure`, …). It is confined to these pages.
- **Selectors come from remote config**, not from the page: the tenant decides
  which element gets locked, which strategy runs (`blur`, `hide`,
  `mangle-blur`) and the price. `?gvm_admin=1` exposes the in-page editor.

The overlay articles are **English only** — they are real editorial pieces,
and translating them would add pages nobody links to. Only `/en/no-code/`
mirrors the landing page copy.

## How examples are built

Pages set `lang` (and optionally `crumb`, `altUrl`, `gvm: true`) in front
matter and then compose shared pieces:

```njk
{% extends "layouts/base.njk" %}
{% from "gvm/payment-drawer.njk" import paymentDrawer %}

{% block content %}
  <div id="article" data-gvm-price="1.99" data-gvm-reference="…"
       data-gvm-hide-strategy="hide" data-gvm-hide-sections="6"
       data-gvm-template-name="payment" data-gvm-hide-template-name="paywall">
    …content…
  </div>
  {{ paymentDrawer({ t: i18n[lang], termsUrl: site.termsUrl,
                     termsVersion: site.termsVersion }) }}
  {{ paywallInline({ t: i18n[lang], termsUrl: site.termsUrl }) }}
{% endblock %}
```

Rules of thumb:

- **One `payment` form**, the drawer, shared by every example. It reads the
  amount and the content reference from the gated element, so the markup never
  changes. The modal in `gvm/payment-dialog.njk` is a Templates-only variant.
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
