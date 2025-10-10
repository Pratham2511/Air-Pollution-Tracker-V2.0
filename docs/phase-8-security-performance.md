# Phase 8 • Security & Performance Blueprint

_Last updated: 2025-10-10 (Phase 8 completion pass)_

This document outlines the actionable plan for the Phase 8 upgrades, covering security hardening and bundle performance.

## Objectives
- Enforce least-privilege policies across Supabase tables via RLS templates and service-role segregation.
- Introduce client-side safeguards for privileged routes and audit logging triggers.
- Reduce initial bundle cost with route-level code splitting and progressive data hydration.
- Prepare for rate limiting, secure uploads, and monitoring hooks.

## Security Backlog
- [x] Draft Supabase policy scripts (`profiles`, `otp_requests`, `tracked_cities`, `gov_notes`, `audit_logs`).
- [x] Ship `securityService` module for audit logging + privileged action confirmation.
- [x] Configure service-role edge functions for scheduled ingestion + reporting (stub endpoints).
- [x] Establish incident logging channel (Supabase table + hooks in government incident desk actions).
- [ ] Harden file upload validation once CSV import wizard lands (Phase 4/5 dependency).

## Performance Backlog
- [x] Route-level code splitting via `React.lazy` and suspense fallback.
- [x] Adopt React Query powered stale-while-revalidate caching for dashboards (`useDashboardData`, `useGovernmentDashboardData`).
- [x] Introduce bundle analyzer script and CI budget (< 300 KB gzipped main chunk).
- [x] Virtualize large data tables (government live monitoring panel).
- [x] Offload fallback forecasting calculations to dedicated web worker.

## Implementation Notes
- Suspense fallback mirrors the new design system for a consistent loading experience.
- Protected routes remain wrapped in Suspense to guarantee authenticated fetch before commit.
- React Query client bootstrapped in `src/index.js`, with hooks migrated to cached queries.
- Government incident desk emits audit and incident activity records via `securityService` + `incidentLogService`.
- Supabase edge function stubs (`aq_ingestion`, `report_dispatch`) enforce service token header and stand ready for orchestration logic.
- `npm run analyze` leverages `source-map-explorer` for bundle budget enforcement (< 300 KB gz main chunk).
- Forecast fallback generation now runs inside `cityAnalysisWorker` with `analysisWorkerClient` handling timeouts and graceful degradation.

## Next Up
1. Harden CSV upload validation flow (blocked on Phase 5 import wizard).
2. Integrate real ingestion/reporting logic into the edge function stubs.
3. Stand up admin audit dashboard powered by `incident_activity` and `audit_logs` tables.
4. Extend bundle budgeting into CI (fail build when `npm run analyze` exceeds 300 KB gzipped main chunk).
5. Expand worker coverage to multi-city overview computations if Supabase latency spikes.
