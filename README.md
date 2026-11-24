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
  index.njk                 showcase index (PL) -> / (use cases, overlay, templates)
  en/index.njk              showcase index (EN) -> /en/
  sitemap.njk robots.njk llms.njk   -> /sitemap.xml, /robots.txt, /llms.txt
  publisher/                category: publishers
    index.njk               category landing (unlock, remove-ads)
    unlock-article.njk      hide strategy, inline paywall
    remove-ads.njk          ad slots + 24h ad-free pass (redirect strategy)
  digital-ecommerce/        the digital shop
    index.njk               landing: downloads + streaming
    download.njk            e-book, PDF report, music file, high-res photo
    streaming.njk           audiobook, pay-per-view video
  saas/index.njk            SaaS landing (plans + add-ons)
  saas-licenses/index.njk   plan cards -> SMS (no e-mail, no activation codes)
  add-ons/                  configurator with a dynamic basket
  templates/                the payment forms and the paywall placements
    drawer.njk              default form (drawer)
    modal.njk               legacy <dialog> form, kept as a variant only
    simple.njk circle.njk   raw, hand-rolled variants
    placements/             seven paywall placements, one page each
  overlay/                  gvm-overlay.js demos (English copy)
    index.njk               overlay landing page
    article-1.njk           blur (1.45 PLN)
    article-2.njk           hide (2.50 PLN)
    article-3.njk           mangle-blur (2.00 PLN)
  ppv-player.njk            permalink /ppv/player.html — injected iframe
  en/                       English mirrors of the pages above
  assets/                   css, logos, favicon, agg bridge
    gvm.css                 foundation: chrome, content, cards, prose, PPV
    gvm-drawer.css          payment drawer (default form), linked when gvm: true
    legacy.css              overlay pages only (front matter: legacyCss: true)
    <page>.css / <page>.js  page-specific styles and scripts
  _includes/
    layouts/base.njk        html, head, skip link, header, main, footer
    partials/               head, header, footer, lang-switch, example-bar
    gvm/                    payment drawer + dialog, consent, 7 paywall
                            placements, download trigger, dialog a11y
  _data/
    site.js                 tenant, env, currency, baseUrl, SDK + outbound URLs
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
| `/digital-ecommerce/download/` | `/en/digital-ecommerce/download/` |
| `/digital-ecommerce/streaming/` | `/en/digital-ecommerce/streaming/` |
| `/saas-licenses/` | `/en/saas-licenses/` |
| `/add-ons/` | `/en/add-ons/` |
| `/templates/drawer/` | `/en/templates/drawer/` |
| `/templates/modal/` | `/en/templates/modal/` |
| `/templates/simple/` | `/en/templates/simple/` |
| `/templates/circle/` | `/en/templates/circle/` |
| `/templates/placements/{inline,overlay,sticky-bottom,sticky-right,widget,banner,drawer}/` | `/en/templates/placements/…` |
| `/saas/` | `/en/saas/` |
| `/overlay/` | `/en/overlay/` |
| `/overlay/article-1/` | — (English-only article) |
| `/overlay/article-2/` | — (English-only article) |
| `/overlay/article-3/` | — (English-only article) |
| `/ppv/player.html` | — (injected iframe, no page) |

Hyphens in URLs, one language per page. The overlay articles are English-only
(see below), so they live at `/overlay/article-N/` with no EN mirror.

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

Pages that only know the amount at runtime (the add-ons basket, the ad-free
pass, anything derived from user input) set `gvmLazy: true` instead of
`gvm: true`: `partials/head.njk` then ships the drawer CSS, the a11y glue and
the agg bridge, but **not** the SDK — the page appends `site.sdk` itself once
`data-gvm-price` / `data-gvm-reference` are written.

The legacy modal (`_includes/gvm/payment-dialog.njk`, styled by `gvm.css`) is
kept **only** for the Templates section, where the point is to show the variant
side by side with `simple`, `circle` and the drawer itself.

Where the unlock call-to-action sits is a separate axis: `_includes/gvm/`
carries seven paywall placements (`paywall-inline`, `paywall-overlay`,
`paywall-sticky-bottom`, `paywall-sticky-right`, `paywall-widget`,
`paywall-banner`, `paywall-drawer`), each demoed under `/templates/placements/`.
They are separate partials because they differ in markup and in the element
they are injected into; all of them open the same drawer.

Because these are two separate files, do not restyle `.gvm-payment-drawer*`
from `gvm.css`: the drawer carries its own tokens (`--gvm-*`) and the showcase
only overrides them at `:root` when needed.

## Overlay (`/overlay/`)

The overlay pages under `src/overlay/` are a different beast from the rest of
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
and translating them would add pages nobody links to. They live at
`/overlay/article-N/`; only `/en/overlay/` mirrors the landing page copy.

The URL is `/overlay/`, not `/no-code/`: it matches the path the overlay tenant
config was originally written against, so no reconfiguration is needed.

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

Each example that needs more than the foundation adds its own stylesheet
(`saas-licenses.css`, `add-ons.css`, `remove-ads.css`, `paywalls.css`,
`digital-ecommerce.css`) linked from its `{% block head %}`, so page-specific
rules never leak into `gvm.css`.

Long-form prose (`.article-body`) gets a `--measure` of about 68ch, a 1.72
line-height, `text-wrap: pretty` and no justification — ragged-left text is
much easier to read in a narrow column, in either theme.

## Theme (light / dark)

The dark palette is inherited from getviamsg.com, but the showcase is not bound
to it. `assets/theme.css` adds a light palette and a switch in the site bar,
re-mapping the tokens of `gvm.css` and `gvm-drawer.css` without editing either
file.

Resolution order:

1. an explicit choice, stored by `assets/theme.js` under `gvm-theme`
   (`<html data-theme="light|dark">`),
2. otherwise the operating-system preference (`@media (prefers-color-scheme)`),
3. otherwise the dark palette.

`partials/head.njk` applies the stored choice before the first paint, so the
wrong palette never flashes, and `theme.css` is loaded last so it wins the
cascade. Both brand logos ship (a white one and a dark one) and exactly one is
shown.

Rules for new CSS: use the tokens, never a colour literal; translucent shades
use `color-mix(in srgb, var(--accent) 12%, transparent)`. The one exception is
the QR container, which stays pure white in both themes (a QR code needs a
white quiet zone).

## Quality gate

`npm run build && npm run gate` runs `scripts/quality-gate.mjs`. It has two
independent halves:

- **Copy** (on `src/`): page templates, the shared i18n strings and the site
  metadata are checked for implementation jargon (`paywall`, `partial`,
  `tenant`, `gvm.js`, `SDK`, `strategia`, `data-gvm`), meta badges (`Live ·`,
  `Krok N`, `N pozycji`, `N wariantów`, `Podgląd na żywo`) and robotic copy
  (`Do Twojej sesji dojdzie:`). Front matter `title`/`crumb` are included —
  they are visible in the tab and the example bar — while `description` is not.
- **Structure** (on `dist/`): duplicate ids, a `data-gvm-template-inject-to`
  selector that does not exist on the page (the template would then land on
  `<body>`, behind the footer), dead internal links, and leftover
  developer-kit blocks.

Deliberately excluded from the copy half: `src/llms.njk` (machine-readable) and
the overlay article bodies (real editorial prose, where "paywall" is an ordinary
word).

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

The previous flat examples (hide, blur, overlay, templates, plan, ads,
app-basket, …) and their legacy CSS (`pico.css`, `showcase.css`) were kept for a
while under `src/archive/` as a reference library. Every use case has since been
rebuilt on the current architecture, so the directory is gone — the git history
still has it.
