# `/plan` — App plans & activation

An editorial pricing page for the **“GetViaMsg for apps”** use case: sell a plan
(or a single feature) inside your app, let the customer confirm with one SMS, and
settle every purchase in a period on a single bill.

It reuses the declarative `data-gvm-*` API from the rest of the showcase, but
adds two things a web paywall does not need: a **billing page** and an
**activation-code** step that ties the web purchase to the e-mail used in the
app.

```
plan/
  index.html   pricing layout + payment dialog + CTA templates
  plan.js      e-mail → reference, payment callback, mock activation code
```

Open `/plan/` from the repo root (`npx live-server .`).

## What the page shows

| Section | Purpose |
| --- | --- |
| Hero + switch | Two entry points: **Buy a plan** (`#get`) and **Activate a code** (`#activate`) |
| E-mail gate | The e-mail used in the app becomes the payment reference |
| Plan cards | Basic `9.99`, Plus `19.99` (featured), Pro `29.99` PLN / month — no lifetime |
| Success panel | After a resolved commitment: the activation code + a copy button (+ `unlock_url` when the backend returns one) |
| Compare + FAQ | Static editorial content |

## Key integration detail: the e-mail is part of the reference

gvm.js reads `data-gvm-reference` **once, at boot** (`processPaymentElements`).
The reference therefore has to be known before the module is imported, but the
e-mail is typed by the customer — so **gvm.js is not loaded in `<head>`**.

The flow in `plan.js`:

1. Customer types the app e-mail and submits.
2. We derive `plan_<tier>_<emailHash>` (10 hex chars, mock hash) and write it as
   `data-gvm-reference` on every plan card.
3. Only then do we append `<script type="module" src="…/gvm.js">`.
4. gvm.js boots, finds the cards (`[data-gvm-price]`), and injects a bound pay
   button into each `#plan-cta-<tier>` slot.
5. A resolved/duplicated commitment calls `planPaymentCallback`, which closes the
   dialog and renders the success panel.

Changing the e-mail after gvm.js has booted requires a reload (references are
already bound), so the form stores the new value and reloads.

> Production note: the hash and the activation code are front-end mocks. In
> production your backend mints a `data-gvm-price-token` for the plan, receives
> `{commitment_id, signature, email}` after the customer pays, verifies the
> signature (`calculateSignatureWithParams`), activates the app account, and
> returns `unlock_url` and/or e-mails the activation code.

## Payment templates

Each plan card is a `PaymentTriggerElement`: `data-gvm-price`,
`data-gvm-reference`, `data-gvm-template-name="payment"` (the dialog) plus a
**hide strategy with no split config** (`data-gvm-hide-strategy="hide"`). With no
`-sections` / `-percent` / `-words`, nothing is hidden — the strategy only
injects the bound pay button (`cta-basic` / `cta-plus` / `cta-pro`) into the
card's CTA slot. The shared `payment` template is the standard QR + SMS dialog
with the mandatory consent checkbox (`pl-2026-10-23`).

The dialog also carries an **“Open in the app”** button
(`data-gvm-bind-unlock`). It stays hidden until gvm.js binds it, which only
happens when the backend returns `unlock_url`. The success panel repeats that
link so it survives the dialog being closed.

## Environment & data

- `data-gvm-env="qa"`, `data-gvm-tenant="wdft_showcase_qa"`,
  `data-gvm-currency="PLN"` — the SMS/QR flow runs against the QA API, no real
  charge. This is the same tenant the other examples use.
- References are real for the QA tenant and look like
  `plan_plus_1a2b3c4d5e`. The last 10 chars are a **mock** hash of the e-mail.
- Activation code: 12 uppercase hex chars from the same mock hash, shown as
  `XXXX-XXXX-XXXX`. “Show demo code” on the activation form fills it in so the
  loop can be tested without buying anything.
- Because `data-gvm-analytics="custom"` is set, gvm.js funnel events are
  forwarded to agg by `assets/agg-gvm-bridge.js`. The page adds
  `plan_email_set`, `plan_pay_click`, `plan_activated`, `plan_code_activated`
  and `plan_code_copy`.

## Things that are intentionally mocked

| Concern | This showcase | Production |
| --- | --- | --- |
| E-mail → reference | 10-char hash in `plan.js` | Your backend / price token |
| Activation code | 12-char hash of the e-mail | Signed code issued by your backend |
| Code validation | `code === hash(email)` | `POST /activate {email, code}` |
| Plan activation | Success text in the browser | Update the app account, return `unlock_url` |
