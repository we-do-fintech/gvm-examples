# `gvm-overlay.js` Example

A minimal demo of the **config-driven** paywall layer (`gvm-overlay.js`). Each
article page marks its content with a single `data-gvm-reference`; loading
`gvm-overlay.js` (instead of `gvm.js`) turns on overlay mode, and the config URL
is derived from `data-gvm-env` + `data-gvm-tenant`.

```
overlay/
  index.html        hub with links to the 3 articles
  article-1.html    "The invisible checkout" — blur, 2.99 PLN
  article-2.html    "The town that read the fine print" — hide, 0.75 PLN
  article-3.html    "The last hand-made page" — mangle-blur, 4.99 PLN

Each article is written as a realistic long-form editorial piece — headline,
standfirst, byline, lead, inline SVG image placeholders, section heads, pull
quotes, tags and an author box — with well over two A4 pages of body copy.
The free intro (headline → first paragraphs → first image) stays visible;
the premium half sits inside `.gvm-cloak` and is gated by the overlay.

> The demo pages reference `https://esm.sh/@wdft/gvm-sdk@latest/gvm-overlay.js`
> directly — the overlay dynamically imports the sibling `gvm.js` from the same
> CDN path. The seed config (`wdft_showcase.json`) lives in git history and is
> bootstrapped into the `qa` backend as tenant `wdft_showcase_qa` via
> `gvm-sdk-admin` (see below); there is no `config/` or `assets/` directory in
> this repo anymore.
```

## Configuration model

Integration is a one-liner — the `data-gvm-*` attributes go on the `<script>` tag, not the body:

```html
<script type="module"
        src="https://esm.sh/@wdft/gvm-sdk@latest/gvm-overlay.js"
        data-gvm-tenant="wdft_showcase_qa"
        data-gvm-env="qa"></script>
```

Loading `gvm-overlay.js` is the overlay signal — no extra flag. The overlay injects the root
attributes onto `<body>` and then derives, by convention, from `env` + `tenant`:

| env  | config (read)                                | admin (editor + API)                  |
| ---- | -------------------------------------------- | ------------------------------------- |
| prod | `https://cfg.gvm.wdft.ovh/<t>.json`          | `https://overlay.gvm.wdft.ovh`        |
| qa   | `https://cfg.qa.gvm.wdft.ovh/<t>.json`       | `https://overlay.qa.gvm.wdft.ovh`     |
| dev  | `https://cfg.dev.gvm.wdft.ovh/<t>.json`      | `https://overlay.dev.gvm.wdft.ovh`    |

The explicit `data-gvm-config`, `data-gvm-admin-src` and `data-gvm-admin-api`
are still supported as overrides. Templates (paywall + payment) come from the config
(`templates.paywall` / `templates.payment`) — the overlay ships no built-in markup.

## No-flash (gvm-cloak)

While the overlay fetches the config and boots `gvm.js`, the gated content would
otherwise be fully visible (flash of unpaid content). To prevent that, wrap the
**gated content** in `.gvm-cloak` and declare the rule in `<head>` **before** the
content renders:

```html
<head>
    <!-- zero-flash: rule is active before the first paint -->
    <style>
        .gvm-cloak {
            visibility: hidden;
        }
    </style>
</head>

...

<div class="gvm-cloak">
    <p>...paywalled content...</p>
</div>
```

How it works:

- The overlay injects the same `.gvm-cloak { visibility: hidden }` rule on load
  (so the class also works without the `<head>` rule, at the cost of a tiny
  window before the module evaluates).
- Once it has finished — config fetched, `data-gvm-*` applied, `gvm.js` booted
  and the hide/blur strategy applied — the overlay **removes** the `.gvm-cloak`
  class. The free intro becomes visible while the gated part stays blurred or
  hidden.
- The class is removed even when no paywall applies to the page (no config, no
  reference match), so content is never left hidden.

> Use `visibility: hidden` (not `display: none`) so layout and text length stay
> stable while the overlay loads. Exactly one element per reference should carry
> the class — the same element the config `selector`/`data-gvm-reference` targets.

## Run

The demo loads `gvm-overlay.js` from the CDN (`@latest`), which in turn
imports `gvm.js` from the same CDN path — no local build or copy step needed:

```sh
# Serve (from the gvm-examples repo root, so /assets works)
cd .. && npx live-server .
```

Open `http://localhost:8080/overlay/`.

> The overlay fetches the config cross-origin from
> `https://cfg.qa.gvm.wdft.ovh/…`, so that host must allow CORS for
> `localhost`.
> To test a local build instead of the CDN, build the bundles in `gvm-sdk`
> (`pnpm build:overlay`, `pnpm build:gvm`) / `gvm-sdk-admin` (`pnpm build:admin`)
> and serve them locally via `data-gvm-config`/`data-gvm-admin-src` overrides.

## Seed the config

The seed (`wdft_showcase.json`) is already bootstrapped into the `qa` backend
as tenant `wdft_showcase_qa` (`bootstrap:tenant qa wdft_showcase_qa` in
`gvm-sdk-admin`). If you need to
re-push it, extract the historical seed and use the gvm-sdk-admin script:

```sh
cd ../../gvm-sdk-admin
pnpm bootstrap:tenant qa wdft_showcase_qa <path-to-wdft_showcase.json>
```

You can also edit the config live in `?gvm_admin=1` mode (see below).

## What to test

### Reader view

- Open `/overlay/article-1.html` (“The invisible checkout”) → intro visible,
  premium body blurred (`blur`), paywall box injected into the article at
  2.99 PLN. The gated half starts at “The ringtone hangover”.
- `/overlay/article-2.html` (“The town that read the fine print”) → hidden
  content removed (`hide`), 0.75 PLN. The body disappears from the DOM below
  the first figure.
- `/overlay/article-3.html` (“The last hand-made page”) → blurred + shuffled
  words (`mangle-blur`), 4.99 PLN. Try selecting the blurred text to see the
  mangle in action.
- Click **unlock** → payment flow against the `qa` API.

### Admin mode

Append `?gvm_admin=1` to an article URL. The overlay lazy-loads the editor from
`https://overlay.qa.gvm.wdft.ovh/gvm-admin.js`, passes it the resolved
config/API via `window.__GVM_ADMIN__`, and prompts for the admin JWT. Edits are
saved via `PUT https://overlay.qa.gvm.wdft.ovh/config/wdft_showcase_qa`.

## Switching environments later

Change `data-gvm-env` (and, if needed, `data-gvm-tenant`) on the pages — nothing
else. The overlay re-derives the config and admin URLs.

## Notes

- `gvm.js` is loaded dynamically by the overlay (sibling of `gvm-overlay.js` on
the CDN); the editor is loaded from the `qa` overlay host, not from `assets/`.
- All three demo articles wrap their gated body in `.gvm-cloak` (rule declared
in `<head>`) — see **No-flash (gvm-cloak)** above for the client pattern and
the exact sequence (text invisible → overlay applied → text visible).
- The article layout styles (`.col`, `.byline`, `.demo-strip`, `.article-body`,
`.article-figure`, `.img-placeholder`, `.pull-quote`, `.author-box`, …) live in
`assets/showcase.css`. Image placeholders are inline SVGs (photo / chart
variants), so the pages are fully self-contained — no external image files.
