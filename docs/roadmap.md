# Air Quality Tracker • Engineering Roadmap

_Last updated: 2025-10-10_

This document refines the master prompt into actionable epics, milestones, and technical contracts. Each phase includes primary deliverables, owner checklists, data contracts, and QA gates.

---

## Phase 1 · Foundation & Environment

### Objectives
- Maintain CRA scaffold with Tailwind + Bootstrap design system.
- Configure Supabase project connection, environment variables, and reusable services.
- Establish core folders, lint/test tooling, and shared UI primitives.

### Deliverables
- ✅ `src/services/supabaseClient.js` with environment guardrails.
- ✅ Tailwind design tokens (`tailwind.config.js`) and global utilities (`index.css`).
- ✅ Landing-page skeleton (`HeroSection`, `AboutSection`, `AuthTabs`).
- ✅ Jest smoke test aligned with new UX copy.

### Follow-ups
- Add ESLint/Prettier config pass (optional).
- Create component storybook (stretch).

### QA Gate
- `npm test -- --watch=false`
- CRA dev server boots without runtime warnings (aside from React Router v7 notices).

---

## Phase 2 · Authentication System

### Goals
Deliver dual-track authentication powered by Supabase Auth, OTP verification, and role dispatch.

### Functional Requirements
1. **Citizen registration/login**
   - Name ≥ 4 chars.
   - Email domain allow-list: `gmail.com`, `outlook.com`.
   - Password policy: ≥ 8 chars, upper/lower/number/symbol.
   - OTP email with 5-minute expiry.
2. **Government access**
   - Fields: official name, department, email, region, role.
   - Email domain allow-list: `.gov.in`, `.gov`, `.gouv.fr`, `.gov.uk`, `.gov.au`.
   - Role-based routing (`/gov`).
3. **Shared**
   - Supabase Row Level Security policies for profile tables.
   - Audit logging for sign-in/out.

### Data Model Sketch
```sql
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('citizen','government','admin')),
  full_name text not null,
  department text,
  jurisdiction text,
  government_verified boolean default false,
  created_at timestamptz default now()
);

create table public.otp_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
```

### React Architecture
- `src/context/AuthContext.jsx` with Supabase subscription + role dispatch.
- Routes guarded via `<ProtectedRoute role="citizen">` and `<ProtectedRoute role="government">`.
- `useOtpVerification` hook to manage resend timers (300 seconds).
- Government onboarding wizard component within `components/auth/government`.

### Supabase Tasks
- Enable email OTP templates with Outlook sender `prathampansare9@outlook.com`.
- Configure redirect URLs for Vercel preview/prod environments.
- Set RLS policies to restrict profile access by `auth.uid()`.

### QA Gate
- Unit tests for validation utilities.
- Cypress (or RTL) tests for citizen + government flows (stretch).

---

## Phase 3 · Citizen Dashboard

### Core Features
1. **Layout**
   - Tabs: Map View, Tracking, Insights.
   - Persistent preferences stored in Supabase + localStorage fallback (`usePersistentState`).
2. **Map View**
   - React-Leaflet map with Mapbox tiles.
   - 200 pinned cities; markers colored by AQI level.
   - ✅ "Get My Location" button (navigator.geolocation, fallback to IP).
   - ✅ Cluster performance for dense regions.
3. **Tracking Tab**
   - Cards showing AQI, pollutant badges (PM2.5, PM10, CO, NO₂, SO₂, O₃).
   - Add/remove/reorder tracked cities.
   - ✅ Button to open single-city analysis.
4. **Insights Tab (MVP)**
   - Highlight cards for top improvements/deteriorations.
   - Mini charts using Recharts.

### Data Contracts
- `tracked_cities` table keyed by `user_id` and `city_id`.
- Cached AQ data stored in Supabase `aq_measurements` bucket (JSON) or Postgres table.
- City metadata: lat/lng, display name, country code.

### UX Considerations
- ✅ Skeleton loaders for map & cards.
- Custom cluster styling with dynamic AQI context.
- Error toasts with retry.

### QA Gate
- Integration test mocking OpenAQ responses.
- Performance check: 60fps interactions on mid-tier laptop (manual).

### Progress (2025-10-10)
- ✅ Dashboard map renders 200+ catalog cities with tracked-city highlighting and Mapbox fallback.
- ✅ Tracked city preferences persist via Supabase `dashboard_preferences` with local cache resilience.
- ✅ Insights tab surfaces live metrics, OpenAQ snapshot hydration, and direct navigation to analysis flows.
- ✅ Supabase schema scripted in `supabase/schema/phase3-dashboard.sql` with RLS coverage for dashboard tables.

---

## Phase 4 · Government Portal

### Modules
1. **Navigation Shell**
   - Sidebar with role-based sections.
   - "Verified Government Access" badge.
   - ✅ Layout implemented with module anchor navigation and hero header.
2. **Live AQI Monitoring Table**
   - Real-time updates with hazard highlighting (AQI > 300).
   - Filters: city, state, pollutant.
   - ✅ Placeholder table with hazard styling ready for live data wiring.
3. **Historical Trend Analysis**
   - Compare 24h/7d/30d windows.
   - Multi-line Recharts with brush + tooltips.
   - ✅ Static analytics cards and chart container scaffolded.
4. **Pollutant Intelligence**
   - Dominant pollutant detection, source attribution (static rules initially).
   - ✅ Dominance matrix and attribution notes scaffolded.
5. **Heatmap Visualization**
   - Leaflet heat layer with gradient ramp.
   - ✅ Heatmap placeholder with legend and integration checklist.
6. **Export & Reporting**
   - CSV/JSON download (client-side initially).
   - PDF via headless chrome service (stretch).
   - ✅ Reporting options wired to live Supabase data with scheduled report automation surfacing run history and delivery status.
7. **Government Notes**
   - `gov_notes` table with AQI snapshot metadata.
8. **Hotspot Detection**
   - Ranking queries (top 10 AQI) + spike detection algorithm (rolling window).
9. **Incident Management**
   - CRUD operations with severity levels and timeline view.
10. **Policy Impact Analytics**
   - ✅ Policy insight feed wired to Supabase (`gov_policy_impacts`) with fallback generators.
   - Pre/post policy comparison using saved snapshots.
11. **Data Upload Interface**
    - CSV import wizard, Supabase storage pipeline, validation summary.

### Backend Notes
- Use Supabase Functions (Edge) for scheduled fetches and report automation.
- Add RLS to restrict government data by jurisdiction unless admin.

### QA Gate
- Automated tests for data imports.
- Accessibility audit (axe) on portal pages.

---

## Phase 5 · Analysis Pages

### Single City ( `/analysis/:cityId` )
Components:
1. AQI trend (line chart + forecasting overlay).
2. Pollutant concentration dashboard (bar/area charts).
3. Dominant pollutant animation (Framer Motion).
4. Health advisory cards (severity-driven copy).
5. Historical comparisons (two-range selector).
6. Weather correlation (API integration; caching).
7. Source attribution (data + descriptive text).
8. Forecast prediction (ARIMA or exponential smoothing placeholder).

### Multi-City ( `/analysis/overview` )
Components:
1. AQI comparison matrix.
2. Pollutant matrix (heatmap grid).
3. Dominant pollutant distribution chart (pie / sunburst).
4. Trend analysis (multi-series chart).
5. Pollution ranking leaderboard.
6. Correlation analysis scatterplot.
7. Temporal pattern (calendar heatmap).
8. Cumulative impact metrics.

### QA Gate
- Snapshot tests for chart configs.
- Regression tests to ensure API falls back gracefully on missing data.

---

## Phase 6 · Data Integration & APIs

### OpenAQ
- Scheduler: fetch pollutant measurements every 30 minutes.
- Cache in Supabase table `aq_measurements` with composite index `(city_id, measured_at)`.
- Rolling aggregates for quick queries (materialized view or Supabase function).

### Geolocation
- Primary: `navigator.geolocation` with permission prompts.
- Fallback: IP-based service (e.g., `ipwho.is`), stored anonymously.
- Respect privacy: allow opt-out, store only city-level location.

### Map Integration
- React-Leaflet + Mapbox tiles (`REACT_APP_MAPBOX_TOKEN` to add later).
- Custom `AQIMarker` component for color-coded icons.
- Marker clustering via `react-leaflet-cluster`.
- Offline support: prefetch baseline tiles for tracked cities (stretch).

### QA Gate
- Unit tests for data transformers.
- Manual API load test (throttled) to ensure rate limits respected.

### Progress (2025-10-10)
- ✅ Client-side OpenAQ integration delivers live pollutant snapshots with deterministic caching fallbacks.
- ✅ Geolocation service unifies GPS/IP lookup for map centering and future modules.
- ✅ Supabase ingestion stubs, local cache hook, and scheduler runbook published (`docs/openaq-scheduler.md`).

---

## Phase 7 · UI/UX Polish

### Tasks
- Formalize design tokens (spacing, typography, shadows).
- Add micro-interactions (Framer Motion) on key UI elements.
- Implement toast notifications, loading skeletons, empty states.
- Accessibility sweep (keyboard nav, focus rings, ARIA labels).

### Progress (2025-10-10)
- ✅ Expanded Tailwind design tokens, glassmorphism utilities, and motion easing presets.
- ✅ Rolled out Framer Motion interactions across hero, stats, and dashboard tabs with animated active indicators.
- ✅ Added reusable Skeleton loader system and toast notifications with context-aware messaging.
- ✅ Completed accessibility sweep including skip-link navigation, ARIA live regions, and semantic main landmarks.

### QA Gate
- Lighthouse audit ≥ 90 (Performance, Accessibility, Best Practices, SEO).

---

## Phase 8 · Security & Performance

### Security
- Supabase RLS for all tables.
- Service role separation for server-side tasks.
- Rate limiting on critical endpoints via Edge Functions.
- Secure file upload validation for CSV ingestion.
- Audit logging for admin actions and incident updates.

### Performance
- Code splitting by route using `React.lazy` + Suspense.
- Virtualization for large city tables (`react-window`).
- API response caching + SWR hooks with stale-while-revalidate.
- Worker thread (Web Worker) for heavy computations (forecasting).

### QA Gate
- Penetration test checklist.
- Bundle analyzer reports showing main bundle < 300 KB gzipped (target).

---

## Phase 9 · Deployment & Monitoring

### Vercel
- Environment variables for Supabase + OpenAQ keys.
- Build command `npm run build`, Node 18.
- Preview deployments for feature branches.

### Supabase
- CORS for Vercel domains.
- Redirect URLs for auth.
- Scheduled functions for data refresh & report emails.

### Monitoring
- Integrate error tracking (Sentry or Vercel Monitoring).
- Performance analytics (Vercel Web Analytics or PostHog).
- Uptime checks (Vercel cron or external service).

### QA Gate
- Deployment smoke checklist (see master prompt).

---

## Phase 10 · Quality Assurance

### Testing Strategy
- Unit tests: validation, reducers, hooks, utils.
- Integration tests: auth flows, dashboard interactions.
- E2E: high-value paths using Cypress or Playwright.
- Load testing: API endpoints (k6/Artillery) for OpenAQ sync.

### Documentation
- README quickstart (update post implementation).
- CONTRIBUTING.md with code style and branching strategy.
- Runbooks for incident response and data imports.

### Release Criteria
- All QA gates green.
- No Sev-1/Sev-2 defects open.
- Stakeholder sign-off for citizen and government journeys.

---

## Dependencies & Tooling Summary
- **Runtime**: React 18, React Router 6, Recharts, React-Leaflet, Framer Motion.
- **Backend**: Supabase Postgres, Storage, Auth, Edge Functions.
- **External APIs**: OpenAQ, browser geolocation, optional IP geolocation.
- **Build**: CRA (react-scripts), Tailwind, PostCSS, Bootstrap.
- **Testing**: Jest + React Testing Library (base), add Cypress/Playwright later.
- **Monitoring**: Sentry (recommended), Vercel analytics.

---

## Next Steps
1. Implement Phase 2 authentication architecture:
   - Scaffold `AuthContext`, route guards, validation utilities.
   - Create Supabase SQL migration scripts (profiles, OTP).
   - Build citizen + government onboarding forms with OTP flow.
2. Prepare Supabase RLS policy scripts.
3. Update README with setup instructions as features land.

> Track progress in `/docs/roadmap.md` by appending changelog entries as phases ship.
