# gvm-examples — stan i plan showcase

> Jedno źródło prawdy: jak zbudowany jest showcase, co jest zrobione, a co
> zostało. Decyzje projektowe i historia na końcu.

---

## 0. Stan realizacji

**Build:** `npm run build` → `dist/`, **46 stron** + `sitemap.xml`, `robots.txt`,
`llms.txt`. Zero brakujących linków wewnętrznych, zero błędnych
`data-gvm-template-inject-to`, zero polskiego tekstu na stronach EN.

**Zrobione:**

- [x] Nowy layout, partiale i e11y jako fundament: skip-link, landmarki,
      poprawny `lang`, focus w dialogu, `inert` na stronie pod dialogiem,
      Escape, `prefers-reduced-motion`.
- [x] i18n PL/EN: PL na `/`, EN pod `/en/`, `hreflang` + `x-default` w `<head>`,
      przełącznik języka. Tekst prawny zgody zawsze po polsku (`lang="pl"`).
- [x] Jeden formularz płatności (drawer) + modal / simple / circle jako warianty
      w sekcji Templates. Consent jest w drawerze, paywall pokazuje tylko cenę.
- [x] Siedem wariantów paywalla jako osobne partiale + strony demo pod
      `/templates/placements/`: inline, overlay, sticky-bottom, sticky-right,
      widget, banner, drawer.
- [x] Use case'y pogrupowane w trzy obszary (patrz §2) — na stronie głównej
      i w sekcjach kategorii.
- [x] **Digital commerce**: landing + dwie podstrony — `/digital-ecommerce/download/`
      (e-book, raport PDF, muzyka, zdjęcie HD) i `/digital-ecommerce/streaming/`
      (audiobook, wideo). Miniatura pay-per-view pochodzi z YouTube (`ytThumb`).
- [x] **SaaS** (`/saas/`): uproszczona strona planów (wybór planu → SMS →
      koniec, bez e-maila i kodów aktywacyjnych) + konfigurator dodatków
      z dynamicznym koszykiem.
- [x] **Bez reklam**: pełny inwentarz slotów reklamowych, brak mignięcia
      (check w `<head>` przed pierwszym renderem), dzień bez reklam
      w `localStorage`, baner statusu z licznikiem, SDK nieładowany, gdy pass
      jest aktywny.
- [x] Sekcja **Overlay** (`/overlay/`) na `gvm-overlay.js` — trzy artykuły
      (blur / hide / mangle-blur), treść EN-only.
- [x] SEO/maszyny: `sitemap.xml`, `robots.txt`, `llms.txt`, hreflang.
- [x] **Light mode**: jasna paleta obok ciemnej, domyślnie wg preferencji
      systemu + ręczny przełącznik w headerze (`theme.css` / `theme.js`,
      pre-paint bez mignięcia, podmiana logotypu, `theme-color`).
- [x] **Quality gate**: `npm run build && npm run gate` — skrypt
      `scripts/quality-gate.mjs` (copy na `src/`, struktura na `dist/`).
- [x] Copy pass: usunięte meta-badge („Live · hide”, „10 pozycji”, „1 SMS”),
      żargon („paywall”, „tenant”, „partial”, „gvm.js”) i teksty-logi
      („Do Twojej sesji dojdzie:”) ze wszystkich stron.
- [x] Archiwum `src/archive/` **usunięte** — wszystkie use case'y odtworzone na
      nowej architekturze (historia gita je trzyma).

**Następne:**

- [ ] Wizualny QA na desktopie i mobile (kontrast w obu motywach, długie
      teksty, sticky placements, pełny flow płatności).

---

## 1. Narracja

> Jesteśmy **GetViaMsg** i dajemy nowoczesne możliwości monetyzacji treści
> (mikropłatności).

Showcase jest dwujęzyczny (PL/EN), a każdy przykład to działająca strona:
można przejść cały proces płatności (tenant QA, bez prawdziwego obciążenia).

---

## 2. Mapa URL i informacja architektoniczna

```
/                                        /en/
  # Use cases
    ## Wydawcy           /publisher/          /en/publisher/
       /publisher/unlock-article/             (hide + paywall inline)
       /publisher/remove-ads/                 (redirect + dzień bez reklam)
    ## E-commerce cyfrowy /digital-ecommerce/  (landing)
       /digital-ecommerce/download/           (e-book, raport PDF, muzyka, zdjęcie)
       /digital-ecommerce/streaming/          (audiobook, wideo)
    ## SaaS              /saas/                /en/saas/
       /saas-licenses/                        (plany: wybór → SMS)
       /add-ons/                              (konfigurator + koszyk)
  # Overlay              /overlay/             /en/overlay/
       /overlay/article-1|2|3/                (EN-only: blur / hide / mangle-blur)
  # Szablony (sekcja na stronie głównej, bez osobnego landingu)
       /templates/{drawer,modal,simple,circle}/  (warianty formularza)
       /templates/placements/                 (7 położeń paywalla)
  /ppv/player.html                          — wstrzykiwany iframe (bez strony)
```

Zasady: myślniki w URL-ach, jeden język na stronę, PL domyślnie na `/`.

---

## 3. Architektura

- `src/` = źródła (`.njk`, dane, CSS, JS, obrazki), `dist/` = output.
- `npm run build` czyści `dist/` i uruchamia Eleventy; `npm run serve` = dev.
- `templateFormats: ["njk", "11ty.js"]`, `htmlTemplateEngine: "njk"`.
- `content/` = materiały redakcyjne (artykuł, PDF, EPUB, audio, plakaty),
  czytane w buildzie przez `src/_data/catalog.js`; binaria kopiowane do
  `dist/content/`.

### Layouty i partiale

| Plik | Odpowiedzialność |
|---|---|
| `layouts/base.njk` | `<html lang>`, `<head>`, skip-link, `main`, footer, opcjonalny a11y-glue |
| `partials/head.njk` | meta, hreflang, CSS, bootstrap SDK, agg |
| `partials/header.njk` / `footer.njk` | mały header + mały footer |
| `partials/lang-switch.njk` | PL/EN na podstawie `lang` + `altUrl` |
| `partials/example-bar.njk` | pasek „przykład" z breadcrumbem |
| `gvm/payment-drawer.njk` | **jeden** formularz płatności (drawer) |
| `gvm/payment-dialog.njk` | wariant modal (tylko Templates) |
| `gvm/raw-payment-{simple,circle}.njk` | surowe warianty (tylko Templates) |
| `gvm/consent.njk` | cena + link do terms + checkbox zgody (§ 11 ust. 2) |
| `gvm/dialog-a11y.njk` | `inert`, focus, Escape dla natywnego `<dialog>` |
| `gvm/paywall-{inline,overlay,sticky-bottom,sticky-right,widget,banner,drawer}.njk` | 7 miejsc CTA |
| `gvm/download-trigger.njk` | strategia `download` |

---

## 4. Konwencje

- **Front matter strony:** `lang`, `title`, `description`, `altUrl`, `crumb?`,
  `mainClass?`, `legacyCss?` i jedna z flag:
  - `gvm: true` — SDK w `<head>`, drawer CSS, a11y-glue, agg. Cena i referencja
    są znane w HTML.
  - `gvmLazy: true` — drawer CSS, a11y-glue, agg i `data-gvm-*` na `<body>`, ale
    **bez SDK**. Strona sama ładuje gvm.js po ustawieniu ceny/referencji
    (dynamiczny koszyk, przekierowanie, plan zależny od danych).
- **Cena/referencja:** gvm.js czyta `data-gvm-price` / `data-gvm-reference`
  raz, przy starcie. Dlatego wszystko, co liczy kwotę w przeglądarce, używa
  `gvmLazy`.
- **Paywall vs formularz:** paywall (`data-gvm-bind-pay`) tylko otwiera
  dialog — checkbox zgody jest w dialogu. Paywall pokazuje linię ceny + terms.
- **CSS:** `gvm.css` to fundament (tokeny 1:1 z getviamsg.com). Drawer ma własny
  `gvm-drawer.css`. Każdy przykład z własnym UI dokłada **swój** plik CSS
  (`saas-licenses.css`, `add-ons.css`, `remove-ads.css`, `paywalls.css`,
  `digital-ecommerce.css`) — nie dopisujemy do `gvm.css`.
- **Proza:** `--measure` ≈ 68ch, `line-height` 1.72, `text-wrap: pretty`,
  bez justowania (rivers) — patrz `gvm.css` `.article-body`.

---

## 5. e11y

- Skip-link jako pierwszy focusable; landmarki `header`/`nav`/`main`/`footer`.
- `<html lang>` zgodny z językiem strony.
- Dialogi: natywny `<dialog>`, focus trap, `aria-labelledby`, Escape → anulowanie,
  powrót focusu na trigger, `inert` na resztę strony.
- Gated treść: `aria-hidden`/`inert` przez `.gvm-cloak` do startu SDK.
- Kontrast: `#909090` na `#232526` ≈ 4.8:1; `#ffba00` na `#232526` ≈ 9:1.
- Obrazki z sensownym `alt`; dekoracyjne `alt=""`.
- `prefers-reduced-motion` wyłącza animacje (overlay, licznik, transition).

---

## 6. Decyzje (rozstrzygnięte)

1. Gałąź: kontynuujemy na `new` (dziś `main`).
2. Język domyślny: PL na `/`, EN pod `/en/`.
3. CSS: własny `gvm.css`, bez `pico.css`.
4. Nazewnictwo: myślniki w URL-ach.
5. Archiwum: stare płaskie przykłady usunięte (były referencją w trakcie
   przebudowy).
6. Sekcja overlay: URL **`/overlay/`** (zgodny ze starą ścieżką i konfiguracją
   overlay) — nie `/no-code/`.
7. Artykuły overlay: EN-only, `lang="en"`, bez tłumaczenia.
8. Showcase jest dla **nietechnicznych** odbiorców — brak bloków „Developer Kit"
   i snippetów kodu na stronach.

---

## 7. Archiwum vs obecne use case'y

Porównanie zakresu funkcjonalnego (szczegóły w README / historii sesji):

| Obszar | Archiwum | Obecnie |
|---|---|---|
| Plany (`/saas-licenses/`) | `/plan`: e-mail→referencja, kod aktywacyjny, panel sukcesu, FAQ | Uproszczone świadomie: 3 plany → SMS → koniec, porównanie + FAQ. Bez e-maila i kodów. |
| Dodatki (`/add-ons/`) | `/app-basket`: konfigurator, ~10 pozycji, koszyk w groszach, dynamiczny trigger, dostawa | Konfigurator + dynamiczny koszyk odtworzone (patrz `src/archive/app-basket/`). |
| Bez reklam (`/publisher/remove-ads/`) | `/ads`: masthead + sloty + pass 24 h + brak mignięcia | Sloty, pass 24 h, brak mignięcia, baner statusu. Masthead usunięty (był „stroną w stronie"). |
| Paywalle | `templates/{inline,overlay,sticky-*,widget,banner,drawer}` | 7 partiali + strony demo pod `/templates/placements/`. |

---

## 8. Źródła

- `README.md` w repo (struktura, URL-e, consent/terms, flow gvm.js).
- `getviamsg.com/llms.txt` (narracja: mikropłatności SMS, grupy docelowe).
- `getviamsg.com` → `assets/impuls/css/impuls.css` (tokeny kolorów, `Inter`).
- Archiwum w `src/archive/` (plan, app-basket, ads, templates, …) — pierwotne
  implementacje i README opisujące intencję.
