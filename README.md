# Air-Pollution-Tracker-V2.0

Air Pollution Tracker is a modern React application that visualises live and historical air-quality
data for more than 200 cities worldwide. It includes differentiated experiences for citizens and government teams, map
based insights, and a suite of environmental intelligence dashboards.

## Features

- Tailwind-powered UI with glassmorphism accents and responsive layouts
- Citizen landing page with hero, feature highlights, and quick stats
- Secure authentication flows for citizens and government officials
- Government portal featuring heatmaps, incident desk, pollutant intelligence, and reporting panels
- Citizen dashboard backed by a 200+ city catalog with deterministic AQI seeds and Mapbox-enhanced clustering
- React Query powered dashboards with stale-while-revalidate caching, optimistic preference updates, and OpenAQ snapshot hydration
- Dashboard map view with 200+ clustered markers, tracked-city highlighting, optional Mapbox tiles, and user geolocation
- Phase 5 analytics suite with single-city deep dives and multi-city intelligence overviews
- Phase 6 OpenAQ data bridge with geolocation fallback and cached measurements
- Utility hooks for persistent state, OTP timers, and Supabase-backed auth services
- Offline-friendly preference persistence synced to Supabase (`dashboard_preferences`) when credentials are configured
- Virtualized government live monitoring table rendering hundreds of sensors smoothly
- Supabase-backed audit logging pipeline for secure route access and incident activity tracking

## Authentication Flow

- **Citizen onboarding** now supports both registration and direct sign-in with password validation and domain guardrails (`@gmail.com` / `@outlook.com`).
- **Government onboarding** captures designation/clearance level, applies strict `.gov` domain validation, and offers an expedited sign-in path for returning officials.
- Email OTP delivery is channel-aware: placeholders (`citizen-otp`, `government-otp`) are passed to Supabase so custom templates can be attached without code changes.
- The OTP countdown persists in `sessionStorage`, allowing users to reload or switch tabs without losing the five-minute verification window.
- Resend requests respect the timer lockout and surface contextual status messages for both roles.

## Tech Stack

- React 19 + React Router 6
- Tailwind CSS 3 with PostCSS & Autoprefixer
- React Query 5 for caching and background refreshes
- react-window for high-density list virtualization
- Supabase client for authentication
- Leaflet & React Leaflet for mapping
- Recharts for data visualisation
- Jest + Testing Library for unit tests

## Citizen Dashboard Data Engine

- `src/data/cityCatalog.js` contains a curated catalog of 200+ global cities with deterministic AQI seeds, pollutant envelopes, population metadata, and helper utilities for sampling.
- `src/services/dashboardService.js` mediates between the catalog and Supabase tables (`dashboard_preferences`, `city_aqi_metrics`).
	- When `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` are **not** provided, the service automatically falls back to the local catalog while continuing to persist user preferences in `localStorage`.
	- With credentials configured, tracked city selections and metrics upserts are synced to Supabase and rehydrated on login.
- The dashboard hook (`useDashboardData`) now hydrates the full catalog map, flags tracked cities, merges OpenAQ snapshots, and routes to the analysis pages from both tracking cards and the map modal.
- Supabase schema for these features lives in `supabase/schema/phase3-dashboard.sql`; apply it to provision `dashboard_preferences`, `tracked_cities`, `city_aqi_metrics`, and `aq_measurements` with ready-to-use RLS policies.
- Government dashboard hook (`useGovernmentDashboardData`) shares cached live metrics, incidents, and notes while streaming refreshes through Supabase fallbacks and incident audit logging.

## Phase 5 Analysis Dashboards

- `/analysis/:cityId` delivers a city-focused command center with AQI trends, pollutant breakdowns, forecast bands, health advisories, source attribution, and exposure metrics. Data is powered by `analysisService.fetchCityAnalysis`, which falls back to deterministic seeds when Supabase credentials are absent.
- `/analysis/overview` compares multiple cities at once, highlighting hotspots and healthiest regions, pollutant leaders, correlation insights, and cumulative exposure scores. Selection chips and window controls are backed by `useMultiCityAnalysisData`.
- Recharts-based visualisations (area, bar, and line charts) are wrapped in responsive containers with graceful loading states and error banners sourced from the analysis hooks.
- Deterministic generators ensure consistent charts locally while seamlessly promoting to Supabase RPCs when the environment is configured.

## Phase 6 Data Integration & APIs

- `src/services/openAqService.js` fetches live pollutant measurements from the OpenAQ v3 API, aggregates per-parameter averages, computes AQI using EPA breakpoints, and caches results in `localStorage` for 30 minutes. When Supabase is not configured, the citizen dashboard automatically hydrates tracked cities with these snapshots while falling back to seeded catalog data whenever the network fails.
- `src/services/geolocationService.js` centralises user location resolution, prioritising browser geolocation with a configurable timeout and gracefully degrading to IP-based lookup via `ipwho.is`. Responses bubble up to the dashboard map and any consumer needing approximate positioning.
- `/components/dashboard/MapViewPanel.jsx` now uses the geolocation service for the "Locate me" action, providing clearer messaging around permission denials and approximate centring.
- OpenAQ requests optionally accept `REACT_APP_OPENAQ_API_KEY`, allowing higher rate limits without altering the caching contract.

### Supabase Configuration

Create a `.env.local` file if you want cloud persistence:

```bash
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-public-anon-key
REACT_APP_OPENAQ_API_KEY=optional-openaq-key
REACT_APP_MAPBOX_TOKEN=optional-mapbox-token
```

The application gracefully degrades when these variables are absent, making it safe to run locally without Supabase.

Run the Phase 3 schema migration if you enable Supabase persistence:

```bash
psql $SUPABASE_DB_URL -f supabase/schema/phase3-dashboard.sql
```

### Supabase Edge Functions & Audit Pipeline

- Edge function stubs live under `supabase/functions/` (`aq_ingestion`, `report_dispatch`). They enforce a shared `SERVICE_ROLE_TOKEN` header and return `202 Accepted` until orchestration logic is added.
- Configure `SERVICE_ROLE_TOKEN` as a secret in Supabase (and expose via environment binding) before deploying the functions.
- `securityService` records route access outcomes to `audit_logs` while `incidentLogService` appends activity to `incident_activity`, offering an audit trail for government actions.

## Getting Started

```bash
npm install
npm start
```

> **Note:** The project includes an `.npmrc` setting `legacy-peer-deps=true` so installs succeed with React 19 and `react-window@1.8.10`. Vercel and local environments use the same setting automatically.

The development server runs at <http://localhost:3000>. Hot reload is enabled and lint errors appear in
the console.

## Testing & Production Builds

- `npm test` – run the primary Jest runner (interactive when a TTY is available)
- `npm run test:watch` – TDD loop in watch mode
- `npm run test:coverage` – emit coverage summaries; target ≥80% for services/hooks/utils
- `npm run test:ci` – deterministic CI run (`--watchAll=false --runInBand`)
- `npm run build` – create an optimised production bundle under `build/`
- `npm run analyze` – inspect bundle composition via `source-map-explorer`; keep the main JS chunk under 300 KB gzipped

See `docs/phase-10-qa-program.md` for the full testing pyramid, release criteria, and manual QA checklist.

## Project Structure

```
src/
	components/      # UI components grouped by feature
	pages/           # Route-level pages for landing, dashboard, analysis, government
	hooks/           # Custom React hooks (dashboard, analysis, auth, timers)
	context/         # Global context providers (e.g., auth)
	services/        # API and Supabase helpers (dashboard, analysis, auth, OpenAQ, geolocation)
	utils/           # Shared utilities and tests
```

## Deployment

The build output can be deployed to any static host. For quick previews:

```bash
npm install -g serve
serve -s build
```

### Deploying to Vercel

This repository includes a `vercel.json` configuration so the React router will work on Vercel without additional setup. To deploy:

1. **Connect the GitHub repo** to your Vercel account (`https://vercel.com/pratham-pansares-projects`).
2. When prompted, use the default build settings:
	- Framework preset: *Create React App*
	- Build command: `npm run build`
	- Output directory: `build`
3. In Vercel → *Settings → Environment Variables*, add the production keys:
	- `REACT_APP_SUPABASE_URL`
	- `REACT_APP_SUPABASE_ANON_KEY`
	- `REACT_APP_OPENAQ_API_KEY`
	- `REACT_APP_MAPBOX_TOKEN`
	- (Optional) leave `REACT_APP_DEV_AUTH_BYPASS` and `REACT_APP_EXPOSE_SUPABASE` unset so production stays secure.
4. Trigger a deployment; Vercel will build from the latest `main` commit and serve the static bundle.

Supabase must also contain the schema from `supabase/schema/phase2-auth.sql`, `phase3-dashboard.sql`, and `phase4-government.sql`, and your production Supabase project should have the same URL/key pair used above.

## License

This project is maintained by [Pratham Pansare](https://github.com/Pratham2511). See the repository for
licensing details.
