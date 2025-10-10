-- Phase 3 · Citizen Dashboard schema
-- Creates preference persistence, AQ metric tables, and ingestion audit scaffolding.

set search_path = public;

create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.dashboard_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tracked_city_ids text[] not null default array[]::text[],
  favorite_city_ids text[] not null default array[]::text[],
  last_synced_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create trigger dashboard_preferences_set_updated_at
  before update on public.dashboard_preferences
  for each row execute function public.set_updated_at();

alter table public.dashboard_preferences enable row level security;

drop policy if exists "dashboard_preferences_select_self" on public.dashboard_preferences;
create policy "dashboard_preferences_select_self"
  on public.dashboard_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "dashboard_preferences_upsert_self" on public.dashboard_preferences;
create policy "dashboard_preferences_upsert_self"
  on public.dashboard_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "dashboard_preferences_update_self" on public.dashboard_preferences;
create policy "dashboard_preferences_update_self"
  on public.dashboard_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.tracked_cities (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  city_id text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists tracked_cities_user_city_key
  on public.tracked_cities(user_id, city_id);

alter table public.tracked_cities enable row level security;

drop policy if exists "tracked_cities_read_self" on public.tracked_cities;
create policy "tracked_cities_read_self"
  on public.tracked_cities
  for select
  using (auth.uid() = user_id);

drop policy if exists "tracked_cities_mutate_self" on public.tracked_cities;
create policy "tracked_cities_mutate_self"
  on public.tracked_cities
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.city_aqi_metrics (
  city_id text primary key,
  aqi numeric,
  dominant_pollutant text,
  pollutants jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create trigger city_aqi_metrics_set_updated_at
  before update on public.city_aqi_metrics
  for each row execute function public.set_updated_at();

alter table public.city_aqi_metrics enable row level security;

drop policy if exists "city_aqi_metrics_public_select" on public.city_aqi_metrics;
create policy "city_aqi_metrics_public_select"
  on public.city_aqi_metrics
  for select
  using (true);

drop policy if exists "city_aqi_metrics_service_insert" on public.city_aqi_metrics;
create policy "city_aqi_metrics_service_insert"
  on public.city_aqi_metrics
  for insert
  with check (auth.role() = 'service_role');

drop policy if exists "city_aqi_metrics_service_update" on public.city_aqi_metrics;
create policy "city_aqi_metrics_service_update"
  on public.city_aqi_metrics
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.aq_measurements (
  id bigserial primary key,
  city_id text not null,
  aqi numeric,
  dominant_pollutant text,
  pollutants jsonb,
  recorded_at timestamptz not null default timezone('utc', now()),
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists aq_measurements_city_id_recorded_at_idx
  on public.aq_measurements(city_id, recorded_at desc);

alter table public.aq_measurements enable row level security;

drop policy if exists "aq_measurements_service_insert" on public.aq_measurements;
create policy "aq_measurements_service_insert"
  on public.aq_measurements
  for insert
  with check (auth.role() = 'service_role');

drop policy if exists "aq_measurements_service_select" on public.aq_measurements;
create policy "aq_measurements_service_select"
  on public.aq_measurements
  for select
  using (auth.role() = 'service_role');

create table if not exists public.aq_ingestion_audit (
  id bigserial primary key,
  city_id text,
  status text not null,
  error_message text,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.aq_ingestion_audit enable row level security;

drop policy if exists "aq_ingestion_audit_service_insert" on public.aq_ingestion_audit;
create policy "aq_ingestion_audit_service_insert"
  on public.aq_ingestion_audit
  for insert
  with check (auth.role() = 'service_role');

drop policy if exists "aq_ingestion_audit_service_select" on public.aq_ingestion_audit;
create policy "aq_ingestion_audit_service_select"
  on public.aq_ingestion_audit
  for select
  using (auth.role() = 'service_role');
