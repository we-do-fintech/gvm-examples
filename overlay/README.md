# `gvm-overlay.js` Example

A minimal demo of the **config-driven** paywall layer (`gvm-overlay.js`). Each
article page marks its content with a single `data-gvm-reference`; loading
`gvm-overlay.js` (instead of `gvm.js`) turns on overlay mode, and the config URL
is derived from `data-gvm-env` + `data-gvm-tenant`.

```
overlay/
  index.html        hub with links to the 3 articles
  article-1.html    reference "article-1" — blur, 2.99 PLN
  article-2.html    reference "article-2" — hide, 0.75 PLN
  article-3.html    reference "article-3" — mangle-blur, 4.99 PLN
  config/
    wdft_showcase.json   seed config (source of truth for the dev backend)
  assets/
    gvm.js, gvm-overlay.js, gvm-admin.js   (copied by build.sh)
  build.sh          copies the built scripts from the sibling repos
```

## Configuration model

The body only declares the essentials:

```html
<body data-gvm
      data-gvm-tenant="wdft_showcase"
      data-gvm-env="dev">
```

Loading `gvm-overlay.js` is the overlay signal — no extra flag. The overlay then
derives, by convention, from `env` + `tenant`:

| env  | config (read)                                | admin (editor + API)                  |
| ---- | -------------------------------------------- | ------------------------------------- |
| prod | `https://cfg.gvm.wdft.ovh/<t>.json`          | `https://overlay.gvm.wdft.ovh`        |
| qa   | `https://cfg.qa.gvm.wdft.ovh/<t>.json`       | `https://overlay.qa.gvm.wdft.ovh`     |
| dev  | `https://cfg.dev.gvm.wdft.ovh/<t>.json`      | `https://overlay.dev.gvm.wdft.ovh`    |

The explicit `data-gvm-config`, `data-gvm-admin-src` and `data-gvm-admin-api`
are still supported as overrides.

## Run

```sh
# 1. Build the client scripts (from the gvm-examples repo root, i.e. ..)
cd ../../gvm-sdk && pnpm build:overlay
cd ../../gvm-sdk-admin && pnpm build:admin

# 2. Copy them into the demo
cd ../../gvm-examples/overlay && ./build.sh

# 3. Serve (from the gvm-examples repo root, so /assets works)
cd .. && npx live-server .
```

Open `http://localhost:8080/overlay/`.

> The overlay fetches the config cross-origin from
> `https://cfg.dev.gvm.wdft.ovh/…`, so that host must allow CORS for
> `localhost`.

## Seed the config

`config/wdft_showcase.json` is the source of truth. Push it to the dev backend
once (or edit it via the admin panel):

```sh
cd ../../gvm-sdk-admin
pnpm bootstrap:tenant dev wdft_showcase ../../gvm-examples/overlay/config/wdft_showcase.json
```

## What to test

### Reader view

- Open `/overlay/article-1.html` → intro visible, premium body blurred
  (`blur`), paywall box injected into the article with the 2.99 PLN price.
- `/overlay/article-2.html` → hidden content removed (`hide`), 0.75 PLN.
- `/overlay/article-3.html` → blurred + shuffled words (`mangle-blur`), 4.99 PLN.
- Click **unlock** → payment flow against the `dev` API.

### Admin mode

Append `?gvm_admin=1` to an article URL. The overlay lazy-loads the editor from
`https://overlay.dev.gvm.wdft.ovh/gvm-admin.js`, passes it the resolved
config/API via `window.__GVM_ADMIN__`, and prompts for the admin JWT. Edits are
saved via `PUT https://overlay.dev.gvm.wdft.ovh/config/wdft_showcase`.

## Switching environments later

Change `data-gvm-env` (and, if needed, `data-gvm-tenant`) on the pages — nothing
else. The overlay re-derives the config and admin URLs.

## Notes

- `gvm.js` is loaded dynamically by the overlay (sibling of `gvm-overlay.js` in
  `assets/`); the editor is loaded from the `dev` overlay host, not from
  `assets/` (the local copy is kept as an offline fallback).
- There is a brief flash of full content before the overlay fetches the config
  and boots `gvm.js`. For production, gate content server-side or use the
  redirect/download/inject strategies.
