# `/ads` — publisher front page with ad slots & an ad-free day pass

A newspaper-style publisher page monetized the other way around: the content is
free and supported by **display ads**, and readers who do not want ads buy a
**24-hour ad-free day** in one SMS. When the payment resolves, every ad
placeholder on the page disappears.

```
ads/
  index.html   masthead, front-page grid with a rail, ad slots, payment dialog
  ads.js       redirect landing → 24 h pass in localStorage, sticky banner, SDK load
```

Open `/ads/` from the repo root (`npx live-server .`).

## What the page shows

| Section | Purpose |
| --- | --- |
| Masthead | Publisher nameplate + section nav, the “newspaper” frame for the ads |
| Ad-free pass | Price + terms info, the paid **Remove ads for a day** button |
| Status banner | Replaces the pass (and all ads) while the day is active |
| Ad slots | Top leaderboard `728×90`, in-article `300×250`, native feed, rail `300×600` / `300×250`, sticky bottom `970×90` |
| Lead story + grid | Realistic editorial copy so the ad layout has context |
| Developer Kit | The minimal redirect snippet |

## Strategy: `redirect`

The pass button is a plain payment trigger with a redirect target:

```html
<button
    data-gvm-price="1.49"
    data-gvm-reference="ads_free_day"
    data-gvm-template-name="payment"
    data-gvm-http-redirect-to="/ads/?noads=1"
    ...
>
    Remove ads for a day · 1.49 PLN
</button>
```

On a resolved (or duplicated) commitment, `gvm.js` appends signed query params
and navigates back:

```
/ads/?noads=1&gvm-status=resolved&gvm-commitment-id=…&gvm-reference=ads_free_day
     &gvm-tenant=…&gvm-signature=…&gvm-signed-at=…
```

The page then:

1. Reads `noads=1` + `gvm-status=resolved|duplicated` and stores the expiry
   (`now + 24 h`) under `localStorage.gvm_ads_free_until`.
2. Adds `html.ads-free`, which hides every `.ad-slot` and swaps the pass card
   for the status banner — **before the first paint** (the check is inline in
   `<head>`), so there is no flash of ads on the redirect landing.
3. Cleans `noads` / `gvm-*` from the address bar with `history.replaceState`.

No ad-free day → `/ads/ads.js` loads `gvm.js` from the CDN and the button binds
as a normal payment trigger. Active ad-free day → the SDK is never fetched, and
neither is any ad.

## Environment & data

The page runs `data-gvm-env="qa"` with tenant `wdft_showcase_qa`, so the
SMS/QR flow runs against the QA API without a real charge — the same tenant the
other examples use. Complete the QA commitment to be redirected back with
`?noads=1`, watch the ads vanish, and reload to see the pass persist for 24
hours. After the day expires the placeholders come back on their own.

## Consent (regulamin 23.10.2026)

The payment dialog carries the mandatory price/terms info line and the
**unchecked** consent checkbox (`pl-2026-10-23`) that gates the QR and the
send-SMS button. The pass card repeats the price info + terms link next to the
CTA (no checkbox there — the checkbox lives in the dialog).

## Production note

The grant here trusts the query string, which is fine for a showcase. In
production, verify `gvm-signature` server-side (HMAC of the returned params)
before issuing the pass, exactly like the `redirect` and `download` backend
examples. The e-mail/account binding is out of scope for this demo.
