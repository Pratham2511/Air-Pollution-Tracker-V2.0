# Phase 7 · Accessibility & UX Polish Checklist

_Last run: 2025-11-05_

## Automated guardrails

- ✅ Added `jest-axe` smoke test (`src/__tests__/accessibility.test.js`) covering the root `<App />` render.
- ✅ `npm test -- accessibility.test.js` passes in CI mode.
- Key console notes:
  - Supabase credentials warning is expected for test runs without env vars.
  - React Router v7 future-flag warnings were observed; no actionable errors today.
  - Suspense hydration logs appear during async data resolution but do not fail the suite; keep an eye on them if they grow noisy.

## Manual audit steps

Run these once per release (or when major layout changes land):

1. **Lighthouse (Chrome DevTools)**
   - Open the landing page, citizen dashboard, and government portal.
   - Run Lighthouse in "Accessibility" mode.
   - Target score ≥ 95; capture a screenshot of each report.
2. **axe DevTools (browser extension)**
   - Scan `landing`, `analysis`, and `dashboard` routes.
   - Log any violations in the issue tracker. Classify as `critical`, `serious`, `moderate`, or `minor`.
3. **Keyboard navigation sweep**
   - Tab through top-level navigation, dialogs/modals, and toast interactions.
   - Confirm focus rings are visible and skip link (`Alt+Shift+S`) surfaces correctly.
4. **Screen reader smoke test**
   - With NVDA/VoiceOver, verify that hero sections, card headings, and tab controls announce expected labels.
   - Note any missing `aria-label`s for map controls or chart toggles.
5. **Color contrast**
   - Spot-check primary and accent combinations using the Tailwind palette in `tailwind.config.js`.
   - Ensure animated gradients maintain ≥ 4.5:1 ratio for body text.

## Open follow-ups

- [ ] Consider silencing the test-time Suspense warning by wrapping data mocks in `act()` when feasible.
- [ ] Document React Router future flags in the roadmap and decide when to opt into the v7 behaviors.
- [ ] Capture Lighthouse report artifacts in the repo (`/docs/reports/`) or QA SharePoint after the next UI pass.
