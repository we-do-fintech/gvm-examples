# gvm-examples — plan przebudowy showcase

> Dokument zbiera cały wątek (prompt + późniejsze ustalenia) i stan repo po poprzednim agencie.
> Cel: jedno źródło prawdy, żeby nie przepalać tokenów na budowanie czegoś, co zaraz będziemy orać.

---

## 0. Status realizacji (na teraz)

**Zrobione:**

- [x] Build działa: `npm run build` → `dist/`, 34 strony, brak martwych `pico.css` w nowych stronach.
- [x] Stare przykłady przeniesione do `src/archive/` jako **biblioteka referencyjna** (Eleventy ignoruje cały katalog - nie budujemy archiwum, służy do odzyskiwania layoutów i use case'ów).
- [x] Layout + e11y: skip-link, landmarki, poprawny `lang`, focus w dialogu,
      `inert` na stronie pod dialogiem, Escape → anulowanie, `prefers-reduced-motion`.
- [x] Partiale: `head`, `header`, `footer`, `example-bar`, `lang-switch`,
      `gvm/consent` (info + checkbox), `gvm/payment-dialog` (jeden, z propsami),
      `gvm/paywall-inline`, `gvm/dialog-a11y`.
- [x] i18n PL/EN: PL na `/`, EN pod `/en/`, `hreflang` na przełączniku;
      tekst prawny zgody zawsze po polsku z `lang="pl"`.
- [x] Pierwszy use case pionowo: `/publisher/unlock-article/` (hide + inline paywall),
      przetestowany pełny flow: paywall → consent → QR → „Czekamy na SMS”.
- [x] Treść z publicznego źródła: Sienkiewicz, „Latarnik” (PL, wolnelektury.pl)
      i „The Light-House Keeper of Aspinwall” (EN, tłum. Curtin 1893, Wikisource).
- [x] Nowy `gvm.css` bez pico.css (tokeny 1:1 z getviamsg.com).

**Następne:** kolejne use case'y, warianty paywalla, `remove-ads`,
`download-hi-res-pic`, e-commerce, SaaS, dodatki; potem domknięcie CSS i
usunięcie `showcase.css`/`pico.css`.

---

---

## 1. W skrócie — czego chcemy

Przebudować `showcase.getviamsg.com` **od nowa**, jako dwujęzyczny (PL/EN) showcase
GetViaMsg, który opowiada jedną spójną narrację:

> Jesteśmy **GetViaMsg** i dajemy nowoczesne możliwości monetyzacji treści (mikropłatności).

Zamiast miliona przeklejonych plików robiących to samo:

1. **Build**: `src/` (źródła) → `npm run build` → `dist/` (to, co na produkcję).
2. **e11y** (dostępność) jako fundament, nie dodatek na końcu.
3. **Partiale**: layout, header, footer, `head`, skrypty + **jeden** partial szablonu
   płatności (z propsami) i **osobne** partiale na każdy wariant paywalla.
4. **Przepisujemy example po example** — z zachowaniem sensu, na nowym layoucie.
5. **Layout/CSS od nowa**: bez `pico.css` (za „kanciasty”), tokeny 1:1 z getviamsg.com.
6. Mały, spokojny footer („to getviamsg”), **nie** wielki header na samej górze.

---

## 2. Stan repo (stan faktyczny)

### 2.1 Gałęzie

| Gałąź | Co tam jest |
|---|---|
| `origin/main` | Stan „stary”: flat repo, `assets/pico.css` + `assets/showcase.css` (2889 linii), `BRAND.md`, 25 plików HTML w katalogach najwyższego poziomu. |
| `new` (**aktualna**) | Próba poprzedniego agenta: `src/` + `dist/`, Eleventy, dane w `src/_data/`, nowy ciemny `showcase.css`. |
| `origin/audit-fixes` | Gałąź z PR-a #1 (consent checkbox / terms) — już zmergowana w `main`. |

`git status`: czysto. Brak stashy, brak `node_modules`, brak `dist`.

### 2.2 Co zdążył zrobić poprzedni agent (commit `3ea6f71` + `39eadf8`)

- Wszystko przeniósł do `src/` (foldery przykładów + `src/assets`).
- Dodał `eleventy.config.js` + `package.json` (`build` → `dist/`, `serve`).
- Dodał `src/_data/site.js`, `src/_data/examples.js`, `src/_data/articles.js`.
- Zadeklarował passthrough copy dla `*.js`, `*.data`, `*.png` i `inject/swan.html`.
- Napisał **nowy** `src/assets/showcase.css` (1055 linii, ciemny motyw z tokenami
  zgodnymi z getviamsg.com) — w miejsce `pico.css` + starego CSS.
- Dodał `src/plan/*`, `src/_data/*`, zmienił pojedyncze linie w kilku przykładach.
- Usunął `BRAND.md` (o to prosił użytkownik).

### 2.3 Co jest zepsute / dlaczego to nie działa

1. **Nic się nie renderuje.** `eleventy.config.js` ma `templateFormats: ["njk"]`,
   a wszystkie strony to `.html`. Eleventy ich nie przetwarza → `dist/` nie zawiera
   ani jednej strony (tylko to, co leci passthrough copem).
2. **`/assets/pico.css` nie istnieje** (usunięte w `3ea6f71`), a **20 plików HTML
   nadal go linkuje** → każda strona po ewentualnym buildzie jest bez stylu/rozjechana.
3. **Zero partiali / layoutów.** Nie ma `src/_includes`. Header, footer, `<head>`,
   dialog płatności i blok consent są **kopiowane ręcznie** w każdym pliku.
   - `src/_data/*` i `examples.js` są napisane, ale **nieużywane** przez żaden szablon.
4. **Duplikacja potwierdzona liczbowo**: szablon `data-gvm-template="payment"`
   występuje w 17 plikach, w tym **11 identycznych kopii** (ten sam md5 treści,
   4861 znaków), plus 3 warianty. Header `.site-header` powtarza się w każdym pliku.
5. **Brak i18n.** Wszystkie strony mają `lang="en"`, ale legalna treść (consent
   § 11 ust. 2, teksty paywalla) jest po polsku. Mieszanka PL/EN w jednym `<html>`.
6. **Brak e11y**: brak skip-linku, `aria-hidden`/`inert` na zamaskowanej treści
   przed bootem SDK, brak `prefers-reduced-motion`, ikony bez etykiet itd.
7. Eleventy nie ma skonfigurowanego `njk`/layoutów, brak pluginów (np. `@11ty/eleventy-plugin-rss` nie jest potrzebny, ale `markdown`/`i18n` do przemyślenia).

> Wniosek: poprzedni agent wykonał 80% „przestawienia katalogów” i 0% „złożenia strony”.
> Struktura `src/`/`dist/` + nowy CSS jest wartościowa, ale strony trzeba napisać od zera.

---

## 3. Ustalenia z rozmowy (decyzje)

### 3.1 Kolejność prac (z promptu)

1. **e11y** — dostępność jako pierwsza.
2. **Partiale** — ustalić, jakie są i co dziedziczy propsy.
3. **Przepisywanie przykładów** po kolei, z zachowaniem sensu.
4. **Layout + CSS od nowa** — bez `pico.css`; „szukamy czegoś nowego i fajnego”;
   mały footer zamiast wielkiego headera.

### 3.2 Pivot (późniejsza korekta)

> „A może zaczniemy inaczej? Najpierw zrobimy layout, stare wpisy przesuniemy do
> archiwum i będziemy budować po kolei na nowym layoucie. Konkretne use case’y?”

Czyli **odwracamy kolejność**: nowy layout + jeden pionowy use case, dopiero potem
hurtowe przepisywanie reszty. Sens: najpierw walidujemy fundament na najprostszym
przypadku, nie przepalamy tokenów na masowe przenoszenie.

### 3.3 Najprostszy use case na start

**Odblokowanie artykułu** (`/publisher/unlock-article/`): hide strategy,
paywall inline, jeden partial płatności, PL + EN.

### 3.4 Mapa docelowa (z promptu)

```
/showcases                          → index showcase
  /publisher                        → wydawcy
    /remove-ads
    /unlock-article                 ← START
    /download-hi-res-pic
  /digital_ecommerce                → e-commerce cyfrowy
    /download_ebook
    /download_music_file
  /saas_licenses
  /add_ons
```

Zasady:

- Piszemy **dwujęzycznie** (PL i EN).
- Narracja: getviamsg = nowoczesna monetyzacja treści / mikropłatności.
- Kolorystyka: **1:1 z getviamsg.com**.

### 3.5 TODO produktowe (do rozpisania w późniejszych use case’ach)

- [ ] księgarnia („wyślij na Kindle”)
- [ ] audiobooki
- [ ] pay-per-view
- [ ] app
- [ ] in-game payments

---

## 4. Architektura docelowa

### 4.1 Build

- `src/` = źródła (njk, dane, css, js, obrazki), `dist/` = output.
- `npm run build` = `eleventy`, `npm run serve` = `eleventy --serve`.
- **Poprawka krytyczna**: `templateFormats: ["njk", "html", "11ty.js"]` +
  `htmlTemplateEngine: "njk"`, żeby `.njk` faktycznie renderował layouty.
  (Albo konwersja stron na `.njk` — do decyzji; prościej: rozszerzyć templateFormats.)
- `passthroughCopy`: `src/assets` (bez CSS-owego src, bo ten przetwarza build),
  `src/**/*.js`, `src/**/*.data`, `src/**/*.png`, `src/inject/swan.html`.
- Nowe CSS/JS tylko przez `addPassthroughCopy` lub prosty bundling (do decyzji:
  natywny CSS + `<link>`, bez PostCSS/NPM-bundlera na start).

### 4.2 Layouty (Eleventy `_includes/layouts`)

| Plik | Odpowiedzialność |
|---|---|
| `layouts/base.njk` | `<html lang>`, `<head>`, skip-link, `<body>`, bloki `content` |
| `layouts/showcase.njk` | base + `header` + `footer` showcase’u |
| `layouts/example.njk` | showcase + rama „przykład” (tytuł, opis, kod/badge strategii) |
| `layouts/article.njk` | editorial: treść artykułu + slot na paywall |

### 4.3 Partiale — konkretna lista

**Struktura strony** (`src/_includes/partials/`):

- `head.njk` — meta, title, favicon, `<link rel=stylesheet>`, agg analytics,
  `defer` bridge. Props: `title`, `description`, `lang`, `noindex?`.
- `header.njk` — **mały**: logo + link do getviamsg.com + przełącznik PL/EN.
  Bez „wielkiego hero”.
- `footer.njk` — **mały**: „getviamsg — mikropłatności za treści”, linki
  (github / docs / terms / kontakt), rok. Bez brand-md.
- `skip-link.njk` / w `base.njk`.
- `lang-switch.njk` — PL/EN na podstawie `page.lang` + `page.altUrl`.
- `breadcrumbs.njk` — dla `/showcases/...`.

**gvm** (`src/_includes/gvm/`):

- `gvm/cloak.njk` — wrapper `.gvm-cloak` + inline `<style>` (no-flash).
- `gvm/scripts.njk` — bootstrap `gvm.js` / `gvm-overlay.js`, `data-gvm-*` na `<body>`,
  `window.wdftDebug`, zdejmowanie `.wait-for-script`.
- `gvm/consent.njk` — checkbox `data-gvm-accept-terms` + tekst § 11 ust. 2 (wersja
  `pl-2026-10-23`) — **wymagane** w każdym dialogu płatności.
- `gvm/terms-line.njk` — linia cena + link do `getviamsg.com/terms`.
- **`gvm/payment-dialog.njk`** — JEDEN partial, dziedziczy propsy (patrz §7).
  Zastępuje 11 identycznych kopii.
- Paywalle (każdy osobny, bo mają inny markup/inject-target):
  `paywall-inline.njk`, `paywall-overlay.njk`, `paywall-sticky-bottom.njk`,
  `paywall-sticky-right.njk`, `paywall-widget.njk`, `paywall-banner.njk`,
  `paywall-drawer.njk`.

Zasada z promptu: *„jak example ma płatność ale różne skutki i ten sam template
płatniczy, to ten template jako osobny jeden partial ale dziedziczy propsy; a jak
mamy różne templates, to osobne partiale per template, żeby się nie gryzło.”*

### 4.4 i18n

- Dane: `src/_data/i18n/pl.json`, `src/_data/i18n/en.json` (+ `t` helper w Eleventy).
- Routing: **PL domyślnie na `/`**, EN pod `/en/...` (getviamsg.com jest PL).
- `lang` na `<html>` zgodny z językiem strony; `hreflang` + `alternate` na parę PL/EN.
- Wersje legalne (consent) zawsze z wersją `pl-...` — tekst prawny zostaje PL,
  UI może być EN.

### 4.5 CSS / design system

- **Rezygnujemy z `pico.css`** (decyzja użytkownika: „too squared”).
- Piszemy własny, mały CSS od podstaw, oparty na tokenach z getviamsg.com:

| Token | Wartość |
|---|---|
| `--bg` | `#232526` |
| `--ink` | `#ffffff` |
| `--ink-2` | `#c9ccce` |
| `--muted` | `#909090` |
| `--line` | `#434343` / `#3c3f40` |
| `--accent` | `#ffba00` (amber; na getviamsg.com to `--mint`/`--coral`) |
| `--accent-ink` | `#232526` |
| font | `Inter`, mono: `ui-monospace, SFMono-Regular, Menlo, Consolas` |

- Struktura plików CSS (do decyzji: tokeny / base / layout / components / gvm / examples),
  ładowane jednym `<link>` do zbudowanego `showcase.css` (albo kilka linków).
- „Wszystkie fonty, odstępy są bardzo duże” → skala typografii i spacingu do
  przepisania od zera (mniejsza, gęstsza).
- `prefers-reduced-motion`, `prefers-color-scheme` (opcjonalnie jasny wariant) —
  do decyzji; na teraz jeden ciemny motyw zgodny z getviamsg.com.

### 4.6 e11y — konkretna lista wymagań

- Skip-link „Przejdź do treści” jako pierwszy focusable.
- Landmarki: `<header>`, `<nav aria-label>`, `<main id="main">`, `<footer>`.
- `<html lang>` poprawny per język (nie `en` przy polskim copy).
- Dialogi: natywny `<dialog>` + focus trap, `aria-labelledby`, `Esc`, focus wraca
  na trigger; consent checkbox ma realne `<label>`.
- Gated treść: `aria-hidden`/`inert` na `.gvm-cloak`, dopóki SDK nie wystartuje
  (żeby screen reader nie czytał zamaskowanego premium).
- Kontrast: `#909090` na `#232526` ≈ 4.8:1 (OK dla tekstu ≥ 16px),
  `#ffba00` na `#232526` ≈ 9:1 (OK) — trzymać te wartości.
- Obrazki: sensowne `alt`, dekoracyjne `alt=""`.
- Formularze: `label`, `autocomplete`, komunikaty błędów powiązane z polem.
- `prefers-reduced-motion`: wyłączyć animacje blur/scroll.
- Nawigacja klawiaturą po całym flow płatności (QR/SMS/consent).

---

## 5. Docelowa mapa URL (PL → EN)

```
/                                   /en/
/showcases/                         /en/showcases/
/publisher/                         /en/publisher/
/publisher/unlock-article/          /en/publisher/unlock-article/     ← pierwszy pion
/publisher/remove-ads/              /en/publisher/remove-ads/
/publisher/download-hi-res-pic/     /en/publisher/download-hi-res-pic/
/digital-ecommerce/                 /en/digital-ecommerce/
/digital-ecommerce/download-ebook/  ...
/digital-ecommerce/download-music-file/
/saas-licenses/                     /en/saas-licenses/
/add-ons/                           /en/add-ons/
/archive/...                        — stare przykłady (hide/blur/templates/overlay/plan/ads/app-basket)
```

Uwaga: w prompcie zapisano `digital_ecommerce` i `download_ebook` z podkreśleniami.
Proponuję myślniki w URL (`digital-ecommerce`, `download-ebook`); katalogi w `src/`
mogą zostać z podkreśleniami — do potwierdzenia.

---

## 6. Etapy

### Etap 0 — decyzje + naprawa buildu
- [ ] Decyzja: kontynuujemy na `new` czy startujemy z `origin/main` (patrz §8).
- [ ] `npm install`, `npm run build` faktycznie produkuje strony w `dist/`.
- [ ] `templateFormats` naprawione; `.njk` renderują layouty.
- [ ] Usunięcie martwych referencji `pico.css`.
- [ ] `README.md` zaktualizowany o strukturę `src/`/`dist/`.

### Etap 1 — e11y (fundament)
- [ ] `base.njk` z landmarkami, skip-linkiem, `lang`.
- [ ] Checklist e11y z §4.6 wpięta w layout i dialogi.
- [ ] Test: klawiatura + screen reader na jednej stronie.

### Etap 2 — partiale
- [ ] `head/header/footer/lang-switch/cloak/scripts/consent/terms-line`.
- [ ] `payment-dialog.njk` z propsami (§7) — redukcja 11 kopii do 1.
- [ ] 7 partiali paywalla.
- [x] Stare przykłady w `src/archive/` (niebudowane, referencyjne).

### Etap 3 — pierwszy use case pionowo
- [ ] `/publisher/unlock-article/` PL + EN, strategia `hide`, paywall inline.
- [ ] Pełny flow: preview → paywall → consent → QR/SMS → unlock.
- [ ] Sensowna treść (nie „lorem”), nawiązująca do narracji getviamsg.

### Etap 4 — layout + CSS od nowa
- [ ] Nowy CSS bez pico.css, gęstsza typografia/spacing, mały footer.
- [x] Główna strona = lista przykładów (jak `/showcases/`), tylko jedno zdanie o środowisku testowym, bez powielania treści z getviamsg.com.
- [ ] Wizualna weryfikacja na desktop + mobile.

### Etap 5 — kolejne use case’y
- [ ] `/publisher/remove-ads/`, `/publisher/download-hi-res-pic/`.
- [ ] `/digital-ecommerce/download-ebook/`, `/download-music-file/`.
- [ ] `/saas-licenses/`, `/add-ons/`.
- [ ] TODO produktowe §3.5 (księgarnia/Kindle, audiobooki, pay-per-view, app, in-game).

### Etap 6 — domknięcie
- [ ] Analitics (agg + bridge) wpięty przez partial, nie kopiowany.
- [ ] `llms.txt` / sitemap / hreflang.
- [ ] Usunięcie archiwum, gdy ostatni przykład zostanie przepisany.

---

## 7. Kontrakt `payment-dialog.njk` (props)

```
{% from "gvm/payment-dialog.njk" import paymentDialog %}

{{ paymentDialog({
  lang:        "pl",              // pl | en
  price:       "1.99",
  currency:    "PLN",
  reference:   "article_1987_flood",
  strategy:    "hide",            // hide | blur | mangle-blur
  methods:     ["qr", "sms"],     // qr | sms | pwa-unlock
  env:         "qa",              // qa | demo | prod
  tenant:      "wdft_showcase_qa",
  termsVersion:"pl-2026-10-23",
  title:       "Odblokuj w kilka sekund",
  description: "Wyślij SMS, żeby uzyskać dostęp.",
  payload:     {}                 // np. e-mail / kod dla /plan
}) }}
```

Zasady:

- **Consent jest obowiązkowy** w każdym dialogu (`data-gvm-bind-qr|send-sms|unlock`).
  Wariant `demo` używa mockowanych płatności.
- Paywall (sam `data-gvm-bind-pay`) **nie ma** checkboxa — tylko linia ceny + terms.
- Paywalle są osobne per layout, bo różnią się miejscem wstrzyknięcia
  (`data-gvm-template-inject-to`) i markupem.
- Reference / price są dynamiczne: strony, które je liczą (np. koszyk, plan),
  dalej bootują SDK po ustawieniu wartości — ten mechanizm zostaje (patrz
  `src/plan/plan.js`, `src/app-basket/app-basket.js`).

---

## 8. Otwarte pytania / decyzje

1. **Gałąź**: **rozstrzygnięte — kontynuujemy na `new`.**
2. **Język domyślny**: **rozstrzygnięte — PL na `/`, EN pod `/en/`.**
3. **CSS**: **rozstrzygnięte — własny `gvm.css` od zera, bez pico.css.**
4. **Nazewnictwo katalogów**: **rozstrzygnięte — myślniki w URL-ach**
   (`digital-ecommerce`, `download-ebook`).
5. **Archiwum**: przeniesione do `src/archive/` i nadal budowane pod `/archive/…`;
   usuwamy dopiero po przepisaniu ostatniego przykładu.
6. **Wersja SDK**: `@wdft/gvm-sdk@latest` (obecnie 0.3.0). PWA unlock wymaga
   `>= 0.2.1`; przy przepisywaniu `blur-pwa` wróci temat pinu wersji.

---

## 9. Źródła

- `README.md` w repo (wymagania dot. consent/terms, PWA unlock, strategii).
- `getviamsg.com/llms.txt` (narracja: mikropłatności SMS, grupy docelowe).
- `getviamsg.com` → `assets/impuls/css/impuls.css` (tokeny kolorów, `Inter`).
- Historia gita: `3ea6f71`, `39eadf8` (praca poprzedniego agenta).
