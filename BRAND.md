# Brand Guidelines

## Brand Direction
- Style: modern newspaper / editorial product.
- Tone: clear, credible, practical, conversion-oriented.
- Visual principles: flat surfaces, sharp edges, high text readability, no decorative gradients or glow effects.

## Typography
- Primary serif: `Newsreader` (headlines and body emphasis).
- Supporting sans: `Source Sans 3` (optional UI/body support).
- Monospace: `IBM Plex Mono` (eyebrows, code, technical labels).

### Type usage
- `h1`: `Newsreader`, `clamp(2.05rem, 4.9vw, 3.8rem)`, line-height `1.08`, slight negative tracking.
- `h2`: `Newsreader`, `clamp(1.15rem, 2.2vw, 1.82rem)`, line-height `1.28`.
- Lead paragraphs: `clamp(1.05rem, 1.7vw, 1.2rem)`, max-width `72ch`.
- Eyebrow labels: `IBM Plex Mono`, uppercase, tracking `0.09em`, ~`0.74rem`.

## Color System
Defined in `:root` in [assets/showcase.css](/Users/wdft/code/wdft-org/gvm-examples/assets/showcase.css):
- Background paper: `--paper #f4f1e8`
- Surface paper: `--paper-soft #faf8f1`
- Primary ink: `--ink #1d1d1b`
- Secondary text: `--ink-muted #4a4a46`
- Borders: `--line #bcb6a4`, `--line-strong #7a7463`
- Accent surface: `--accent-soft #ece8dc`
- CTA dark: `--cta #1f1f1d`, hover `--cta-hover #000000`, text `--cta-ink #f4f1e8`

### Color rules
- Use dark text on light backgrounds.
- Keep CTA/buttons monochrome and high contrast.
- Avoid bright/saturated marketing gradients.

## Layout & Spacing
- Max content width: `1140px` (`.container`).
- Main shell vertical rhythm: `.showcase-shell { padding-block: 1.65rem 2.8rem; }`.
- Cards (`.hero-card`, `.section-card`) padding: `clamp(1.15rem, 2.5vw, 2.2rem)`.
- Small spacing units:
  - `0.35rem` to `0.58rem` for dense UI spacing.
  - `0.8rem` to `1rem` for block padding and section gaps.

## Shapes, Borders, Effects
- Border radius: always square (`0`) for cards, buttons, code, modal, paywall.
- Borders: thin editorial rules (`1px`) in muted warm gray tones.
- Top card rule: solid dark line (`2px`) for section hierarchy.
- Shadows: none.
- Gradients: none.

## Components
- Header: sticky, light paper background, subtle bottom border.
- Quick links: flat blocks with simple hover state (border darkening + slight background shift only).
- Developer kit/code blocks: flat paper-like boxes, mono code text.
- Action chips (`[data-gvm-http-*]`): flat white with black border and black text.
- Payment modal:
  - Flat paper surfaces.
  - Dark primary CTA, light neutral cancel button.
  - QR container with hard corners and thin border.

## Motion
- Keep motion minimal and functional.
- Existing `cardEnter` animation is subtle; do not introduce strong transitions/parallax.
- Respect `prefers-reduced-motion`.

## Responsive Behavior
- Desktop/tablet: preserve two-column feel where available.
- Mobile breakpoints:
  - `860px`: reduce card/header spacing.
  - `640px`: stack header content and payment actions vertically.
- Maintain readable line lengths and touch-friendly action areas.

## Copy & Messaging Guidelines
- Audience: publishers and product/engineering teams.
- Voice: professional, specific, benefit-led.
- Explain both:
  - What the strategy does technically.
  - Why it helps business outcomes (conversion, testing speed, controlled rollout).
- Avoid slang, filler, and vague labels.
- CTA labels should include price and currency when action is paid.

## Do / Don't
- Do: keep pages calm, text-first, and structured like editorial product docs.
- Do: reuse shared tokens and classes from `assets/showcase.css`.
- Do: prioritize clarity over visual novelty.
- Don't: add rounded corners, glass effects, or colorful gradients.
- Don't: mix unrelated visual styles between landing pages.
