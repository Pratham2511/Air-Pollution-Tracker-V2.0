# Phase 10 · Quality Assurance Program

_Last updated: 2025-10-10_

This document formalises the testing strategy and release criteria for the Air Quality Tracker. It is
organised by test type so engineering and QA can align on scope, tooling, and ownership.

---

## 1. Testing Pyramid Overview

| Layer          | Scope & Purpose                                                  | Tooling                                    | Cadence                     |
|----------------|------------------------------------------------------------------|--------------------------------------------|-----------------------------|
| Unit           | Pure functions, hooks, and lightweight components                | Jest + React Testing Library               | Run locally on each commit  |
| Integration    | Auth flows, dashboard hooks, incident workflows                  | React Testing Library (render + mock)      | CI + nightly                |
| End-to-End     | Smoke paths across landing → auth → dashboards → government hub  | Playwright (headless Chromium + Firefox)   | CI (pull requests) + weekly |
| Non-Functional | Performance budgets, accessibility, security audits              | Lighthouse CI, axe, dependency audit tools | Release branches            |

---

## 2. Unit Testing Standards

- Cover validation utilities, AQI calculators, data transformers, hooks (`useDashboardData`,
  `useGovernmentDashboardData`), and auth services.
- Target **80%+ line coverage** for `src/utils`, `src/services`, and `src/hooks`.
- New modules must ship with at least one test per critical path. Use the `test:coverage` script
  before opening a pull request.
- Mocks: favour `vi.fn()`/`jest.fn()` to stub Supabase + OpenAQ network calls. Use factories in
  `src/test-utils/` (to be created in later phases) for consistent sample data.

### Commands

```bash
npm run test:watch    # Jest in watch mode for TDD loops
npm run test:coverage # Coverage summary for pre-commit checks
```

---

## 3. Integration Test Playbook

1. **Authentication**
   - Citizen signup → OTP verify → dashboard redirect
   - Government signup → OTP → `/gov` redirect + `government_verified` flag
   - Password sign-in error states (invalid credentials, locked account placeholder)
2. **Dashboard Data Hooks**
   - `useDashboardData` should recover from OpenAQ failures and surface fallback data.
   - `useGovernmentDashboardData` must stream incident updates, allow CRUD, and log activity via
     mocked services.
3. **Security Logging**
   - Assert audit log service is invoked during access changes (already covered with spies).

*Implementation tip:* reuse the existing render helpers from `src/pages/government/GovernmentPortalPage.test.jsx`
when wiring new integration suites.

---

## 4. End-to-End Automation (Playwright)

> **Status:** To be introduced later in Phase 10.

- Scaffold tests under `tests/e2e/` (see roadmap Phase 10 tasks).
- Baseline smoke: visit landing, toggle auth tabs, complete citizen signup with mocked OTP,
  navigate to dashboard cards.
- Government smoke: direct to `/gov` with seeded Supabase session cookie, validate presence of live
  monitoring table and incident desk modules.
- Configure GitHub Actions workflow `ci-e2e.yml` to run Playwright with the `test:ci` script once
  the suite lands.

---

## 5. Non-Functional Checks

- **Accessibility:** Run `npm run lint:a11y` (hooked to axe once implemented) on pull requests.
- **Performance:** Execute `npm run analyze` and Lighthouse CI reports on release branches to enforce
  bundle budgets and 90+ Lighthouse scores.
- **Security:** Include dependency audits (`npm audit --production`) and ensure RLS policy checks are
  part of release readiness.

---

## 6. Release Criteria

A build can only ship when all items below are satisfied:

1. ✅ `npm run test:ci` and `npm run test:coverage` succeed without warnings.
2. ✅ Manual verification of citizen + government auth (Phase 2 checklist) completed in staging.
3. ✅ Accessibility spot checks run on landing, citizen dashboard, and government portal.
4. ✅ Audit logs monitored for anomalies during staging soak (no spikes in `outcome = 'flagged'`).
5. ✅ Deployment smoke (Phase 9) confirms primary routes load without console errors.
6. ✅ QA lead signs off on the regression spreadsheet stored in the project tracker.

---

## 7. Ownership & Reporting

- **QA Lead:** Maintains regression matrix, owns release sign-off, coordinates manual tests.
- **Feature Engineers:** Provide or update automated tests when shipping features or fixes.
- **DevOps:** Ensures CI pipelines run `test:ci`, Playwright (once implemented), and coverage
  thresholds, failing builds on regression.
- **Security:** Reviews audit log trends and RLS updates quarterly.

Weekly QA stand-ups should review automated test coverage trends, triage flaky tests, and assign any
tech debt required to keep the pyramid healthy.
