-- Phase 4 · Government Portal Schema
-- ------------------------------------------------------------
-- This migration provisions the analytics, reporting, incident
-- management, and data ingestion tables required by the
-- Government Portal experience. Run after phase2-auth.sql and
-- phase3-dashboard.sql have been applied.

begin;

create extension if not exists "uuid-ossp";

-- Lookup tables ------------------------------------------------

create table if not exists public.gov_live_metrics (
  id uuid primary key default uuid_generate_v4(),
  city_id text not null,
  city text not null,
  state text,
  aqi numeric not null,
  dominant_pollutant text not null,
  delta numeric default 0,
  status text default 'Stable',
  updated_at timestamptz not null default now()
);

create index if not exists gov_live_metrics_city_idx on public.gov_live_metrics (city);
create index if not exists gov_live_metrics_status_idx on public.gov_live_metrics (status);
create index if not exists gov_live_metrics_updated_at_idx on public.gov_live_metrics (updated_at desc);

create table if not exists public.gov_historical_series (
  id uuid primary key default uuid_generate_v4(),
  city_id text not null,
  window text not null check (window in ('24h','7d','30d','90d')),
  points jsonb not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists gov_historical_series_city_window_idx
  on public.gov_historical_series (city_id, window);

create table if not exists public.gov_pollutant_breakdown (
  id uuid primary key default uuid_generate_v4(),
  pollutant text not null,
  share numeric not null,
  classification text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.gov_heatmap_points (
  id uuid primary key default uuid_generate_v4(),
  city_id text not null,
  city_name text not null,
  lat double precision not null,
  lng double precision not null,
  intensity numeric not null,
  aqi numeric not null,
  updated_at timestamptz not null default now()
);

create index if not exists gov_heatmap_points_intensity_idx
  on public.gov_heatmap_points (intensity desc);

create table if not exists public.gov_policy_impacts (
  id uuid primary key default uuid_generate_v4(),
  city_id text not null,
  window text not null check (window in ('24h','7d','30d','90d')),
  title text not null,
  summary text,
  status text not null default 'monitoring',
  impact_score numeric,
  confidence numeric,
  effective_from timestamptz,
  effective_to timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gov_policy_impacts_city_idx
  on public.gov_policy_impacts (city_id);

create index if not exists gov_policy_impacts_window_idx
  on public.gov_policy_impacts (window);

-- Incident response -------------------------------------------

create table if not exists public.gov_incidents (
  id uuid primary key,
  title text not null,
  severity text not null check (severity in ('high','medium','low')),
  summary text,
  status text not null default 'open',
  tags text[] default array[]::text[],
  assigned_to text default 'Operations',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists gov_incidents_status_idx on public.gov_incidents (status);
create index if not exists gov_incidents_created_at_idx on public.gov_incidents (created_at desc);

create table if not exists public.incident_activity (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid references public.gov_incidents(id) on delete cascade,
  event_action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  context jsonb default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists incident_activity_incident_id_idx
  on public.incident_activity (incident_id);

create index if not exists incident_activity_recorded_at_idx
  on public.incident_activity (recorded_at desc);

create table if not exists public.gov_notes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category text,
  tags text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Measurement uploads -----------------------------------------

create table if not exists public.gov_measurement_uploads (
  id uuid primary key default uuid_generate_v4(),
  filename text not null,
  status text not null default 'received',
  total_rows integer not null default 0,
  accepted_rows integer not null default 0,
  rejected_rows integer not null default 0,
  summary jsonb default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists gov_measurement_uploads_created_at_idx
  on public.gov_measurement_uploads (created_at desc);

-- Reporting subscriptions -------------------------------------

create table if not exists public.gov_report_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cadence text not null,
  audience text,
  delivery_channel text default 'email',
  status text not null default 'active',
  last_run_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.gov_report_dispatch_log (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid references public.gov_report_subscriptions(id) on delete set null,
  status text not null default 'queued' check (status in ('queued','delivered','failed','no_audience','no_data')),
  summary jsonb not null,
  metrics jsonb,
  audience text,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists gov_report_dispatch_log_status_idx
  on public.gov_report_dispatch_log (status);

create index if not exists gov_report_dispatch_log_created_at_idx
  on public.gov_report_dispatch_log (created_at desc);

-- helper to maintain updated_at columns on stateful tables
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists gov_notes_touch_updated_at on public.gov_notes;
create trigger gov_notes_touch_updated_at
  before update on public.gov_notes
  for each row execute function public.touch_updated_at();

drop trigger if exists gov_incidents_touch_updated_at on public.gov_incidents;
create trigger gov_incidents_touch_updated_at
  before update on public.gov_incidents
  for each row execute function public.touch_updated_at();

-- Row Level Security ------------------------------------------

alter table public.gov_live_metrics enable row level security;
alter table public.gov_historical_series enable row level security;
alter table public.gov_pollutant_breakdown enable row level security;
alter table public.gov_heatmap_points enable row level security;
alter table public.gov_policy_impacts enable row level security;
alter table public.gov_incidents enable row level security;
alter table public.gov_notes enable row level security;
alter table public.gov_measurement_uploads enable row level security;
alter table public.gov_report_subscriptions enable row level security;
alter table public.gov_report_dispatch_log enable row level security;
alter table public.incident_activity enable row level security;

-- read policies for authenticated users (citizens do not hit portal UI)
create policy if not exists gov_live_metrics_read
  on public.gov_live_metrics for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_historical_series_read
  on public.gov_historical_series for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_pollutant_breakdown_read
  on public.gov_pollutant_breakdown for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_heatmap_points_read
  on public.gov_heatmap_points for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_policy_impacts_read
  on public.gov_policy_impacts for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_notes_read
  on public.gov_notes for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_incidents_read
  on public.gov_incidents for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_measurement_uploads_read
  on public.gov_measurement_uploads for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_report_subscriptions_read
  on public.gov_report_subscriptions for select
  using (auth.role() in ('authenticated','service_role'));

-- write policies restricted to service_role (edge functions)
create policy if not exists gov_live_metrics_write
  on public.gov_live_metrics for insert
  with check (auth.role() = 'service_role');

create policy if not exists gov_live_metrics_update
  on public.gov_live_metrics for update
  using (auth.role() = 'service_role');

create policy if not exists gov_historical_series_write
  on public.gov_historical_series for insert
  with check (auth.role() = 'service_role');

create policy if not exists gov_historical_series_update
  on public.gov_historical_series for update
  using (auth.role() = 'service_role');

create policy if not exists gov_pollutant_breakdown_write
  on public.gov_pollutant_breakdown for insert
  with check (auth.role() = 'service_role');

create policy if not exists gov_pollutant_breakdown_update
  on public.gov_pollutant_breakdown for update
  using (auth.role() = 'service_role');

create policy if not exists gov_heatmap_points_write
  on public.gov_heatmap_points for insert
  with check (auth.role() = 'service_role');

create policy if not exists gov_heatmap_points_update
  on public.gov_heatmap_points for update
  using (auth.role() = 'service_role');

create policy if not exists gov_policy_impacts_write
  on public.gov_policy_impacts for insert
  with check (auth.role() = 'service_role');

create policy if not exists gov_policy_impacts_update
  on public.gov_policy_impacts for update
  using (auth.role() = 'service_role');

create policy if not exists gov_incidents_manage
  on public.gov_incidents for insert
  with check (auth.role() in ('service_role','authenticated'));

create policy if not exists gov_incidents_update
  on public.gov_incidents for update
  using (auth.uid() = created_by or auth.role() = 'service_role')
  with check (auth.uid() = created_by or auth.role() = 'service_role');

create policy if not exists gov_incidents_delete
  on public.gov_incidents for delete
  using (auth.uid() = created_by or auth.role() = 'service_role');

create policy if not exists gov_notes_manage
  on public.gov_notes for all
  using (auth.role() in ('authenticated','service_role'))
  with check (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_measurement_uploads_insert
  on public.gov_measurement_uploads for insert
  with check (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_measurement_uploads_update
  on public.gov_measurement_uploads for update
  using (auth.role() in ('authenticated','service_role'))
  with check (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_report_subscriptions_manage
  on public.gov_report_subscriptions for all
  using (auth.role() in ('authenticated','service_role'))
  with check (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_report_dispatch_log_read
  on public.gov_report_dispatch_log for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists gov_report_dispatch_log_write
  on public.gov_report_dispatch_log for insert
  with check (auth.role() = 'service_role');

create policy if not exists gov_report_dispatch_log_update
  on public.gov_report_dispatch_log for update
  using (auth.role() = 'service_role');

create policy if not exists incident_activity_read
  on public.incident_activity for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists incident_activity_insert
  on public.incident_activity for insert
  with check (auth.role() in ('authenticated','service_role'));

create policy if not exists incident_activity_update
  on public.incident_activity for update
  using (auth.role() = 'service_role');

-- ensure new columns exist when upgrading an existing environment
alter table public.gov_report_subscriptions add column if not exists delivery_channel text default 'email';
alter table public.gov_report_subscriptions add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.gov_notes add column if not exists tags text[] default array[]::text[];
alter table public.gov_notes add column if not exists updated_at timestamptz not null default now();

-- helper view mapping incidents to audit summary
create or replace view public.gov_incident_summary as
  select
    i.id,
    i.title,
    i.severity,
    i.status,
    coalesce(array_length(i.tags, 1), 0) as tag_count,
    i.created_at,
    i.updated_at,
    i.assigned_to
  from public.gov_incidents i;

commit;
