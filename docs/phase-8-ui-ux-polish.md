# Phase 8 · UI/UX Polish Progress Log

_Last updated: 2025-11-05_

## Automated checks

- ✅ `docs/phase-7-accessibility.md` details the manual sweep.
- ✅ `src/__tests__/accessibility.test.js` (jest-axe) guards initial App render.
- ⚠️ `npm audit` reports 9 vulnerabilities tied to legacy CRA dependencies (`react-scripts`). Auto-fix would downgrade the toolchain, so we’re tracking this for an upstream upgrade/migration.

## Manual accessibility audit (2025-11-05)

| Route | Lighthouse Accessibility | Notes |
|-------|--------------------------|-------|
| `/` (Landing) | _Not Yet Run_ | Pending manual pass |
| `/dashboard` | _Not Yet Run_ | |
| `/government` | _Not Yet Run_ | |
| `/analysis/delhi` | _Not Yet Run_ | |

**Action:** run Lighthouse (Accessibility only) on the paths above, attach screenshots, and log violations here.

### axe Browser Extension
- [ ] Landing
- [ ] Dashboard
- [ ] Government
- [ ] Analysis overview & detail

Log any findings with severity, component, and remediation plan.

## Interaction polish checklist

- [ ] Confirm skip-link works with keyboard and screen readers.
- [ ] Validate focus rings (Tailwind `focus-ring`) on buttons, tabs, map controls.
- [ ] Ensure toasts announce correctly in assistive tech (`aria-live="polite"`).
- [ ] Verify motion-safe fallbacks (prefers-reduced-motion).
- [ ] Confirm skeleton loaders differentiate from active content (contrast & animation).

## Open UX enhancements

1. **Landing page** – consider progressive image loading or hero video fallback.
2. **Dashboard** – polish draggable tracked-city cards with haptics (optional).
3. **Government portal** – add print-friendly stylesheet for reports.
4. **Dark mode** – currently out of scope but flagged as future enhancement.

---

_Use this log to capture manual QA evidence (screenshots, notes) and track polish tasks._
