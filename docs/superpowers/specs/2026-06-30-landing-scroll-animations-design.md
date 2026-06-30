# Landing scroll animations — design

## Goal
Add tasteful scroll-reveal animations to the Café Franca landing page (`index.html`).
Vanilla JS + CSS only, no dependencies.

## Approach
`IntersectionObserver`-driven reveals. Elements start hidden/offset and animate
into place once scrolled into view. Fires once per element.

## Components

### 1. `js/reveal.js` (new, ~25–40 lines)
- One `IntersectionObserver`, threshold ~0.15.
- Observes all `.reveal` elements; on intersect adds `.in`, then unobserves.
- Stat counter: for elements marked `data-count`, animate number from 0 to the
  target on reveal. Preserve prefix/suffix (e.g. `+`, `★`) and decimals (`4.7`).
  Non-numeric stats (`München`) just fade — no counter.
- Respect `prefers-reduced-motion`: if reduced, skip observer and reveal everything
  immediately (no transform, no counting).

### 2. `css/style.css`
- `.reveal` → `opacity:0; transform:translateY(24px);` + `transition: opacity .6s ease-out, transform .6s ease-out;`
- `.reveal.in` → `opacity:1; transform:none;`
- Stagger: `transition-delay` steps (0/80/160/240ms) on grouped children
  (about-stats, menu preview cards).
- `@media (prefers-reduced-motion: reduce)` → disable transition/transform.

### 3. `index.html`
- Add `class="reveal"` to: about block + its stats, see-menu section, menu preview
  cards, contact info + form, footer.
- Add `data-count` to numeric about-stats.
- Include `<script src="js/reveal.js">` before `</body>`.

## Scope / YAGNI
- Hero (first screen) is NOT animated — visible immediately on load.
- No parallax, no library, no per-element config beyond `data-count`.

## Success
- Sections fade+slide up as you scroll to them, once each.
- About numbers count up on first view.
- Reduced-motion users see static content.
