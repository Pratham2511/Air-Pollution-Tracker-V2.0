# Phase 3 · Citizen Dashboard

_Last updated: 2025-10-10_

## Overview
Phase 3 brings the citizen dashboard to feature parity with the roadmap goals. The dashboard now persists user preferences, renders the full global city catalog with AQI overlays, and delivers actionable insights that hydrate from OpenAQ snapshots when available. Supabase tables and policies have been provisioned to support multi-device sync and future historical analytics.

## Feature Highlights
- **Three-panel layout** – Map, Tracking, and Insights tabs orchestrated via animated tab control (`DashboardTabs`).
- **Global AQI map** – React-Leaflet cluster map renders 200+ catalog cities with AQI-derived coloring, tracked-city emphasis, and Mapbox tiles when a token is configured.
- **Watchlist management** – Add, remove, reorder, and inspect tracked cities. Preferences persist to Supabase (`dashboard_preferences`) with local `usePersistentState` fallback for offline mode.
- **Analysis handoff** – Tracking cards and city detail modal route directly to `/analysis/:cityId` for deeper exploration.
- **Insights surface** – Summary stat cards, rolling AQI area chart, and pollutant leader bar chart generated from tracked city metrics.
- **Snapshot caching** – `useOpenAqSnapshotCache` hydrates map and insight data instantly while remote metrics resolve; successful fetches are upserted via `openAqIngestionService`.

## Supabase Setup
Execute the schema migration at `supabase/schema/phase3-dashboard.sql`:

```sql
psql $SUPABASE_DB_URL -f supabase/schema/phase3-dashboard.sql
```

This script provisions:
- `dashboard_preferences` (per-user tracked/favorite city arrays) with RLS for owner-only access.
- `tracked_cities` helper table for future relational queries.
- `city_aqi_metrics` public read table for the SPA, restricted to service-role writes.
- `aq_measurements` (raw OpenAQ snapshot storage) and `aq_ingestion_audit` (scheduler telemetry) with service-role policies.

### Environment variables
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_MAPBOX_TOKEN` (optional – enables Mapbox tiles; falls back to OpenStreetMap if unset)

## QA Checklist
- `npm run test:ci` – unit and integration suites (includes new `useDashboardData` hook test).
- Manual: verify map renders with clustered pins both with and without tracked cities.
- Manual: add/remove/reorder cities and refresh – persisted order should be retained after page reload.
- Manual: click markers and modal `View full analysis` – ensure navigation to `/analysis/:cityId` and modal dismissal.
- Manual: revoke Supabase credentials (unset env vars) – UI should fall back to static catalog data without crashing; toasts notify when cached catalog data is used.

## Observability & Follow-ups
- Publish Supabase Edge Function described in `docs/openaq-scheduler.md` to populate `aq_measurements` and `city_aqi_metrics`.
- Consider recording view preferences (active tab, map bounding box) once analytics requirements land.
- Phase 4+ work will reuse `tracked_cities` and AQI metrics for government modules—validate RLS alignment before expanding scope.
