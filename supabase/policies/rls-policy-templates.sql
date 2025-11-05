-- Supabase RLS Policy Templates for Air Quality Tracker
-- Updated: 2025-11-05
--
-- Apply these templates after running the schema migrations under
-- supabase/schema/ to guarantee columns exist. Adjust the role gating
-- as required for your Supabase project (e.g. add custom JWT claims).

-- Identity surfaces --------------------------------------------------

alter table public.profiles enable row level security;
create policy if not exists "Profiles: owner can read"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "Profiles: owner can update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table public.otp_requests enable row level security;
create policy if not exists "OTP: owner can read"
  on public.otp_requests for select
  using (auth.uid() = user_id);

create policy if not exists "OTP: owner can insert"
  on public.otp_requests for insert
  with check (auth.uid() = user_id);

alter table public.tracked_cities enable row level security;
create policy if not exists "Tracked cities: owner read"
  on public.tracked_cities for select
  using (auth.uid() = user_id);

create policy if not exists "Tracked cities: owner write"
  on public.tracked_cities for insert
  with check (auth.uid() = user_id);

create policy if not exists "Tracked cities: owner update"
  on public.tracked_cities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Tracked cities: owner delete"
  on public.tracked_cities for delete
  using (auth.uid() = user_id);

-- Government portal datasets ---------------------------------------

alter table public.gov_live_metrics enable row level security;
create policy if not exists "Gov live metrics: read"
  on public.gov_live_metrics for select
  using (auth.role() in ('authenticated','service_role'));

alter table public.gov_historical_series enable row level security;
create policy if not exists "Gov historical: read"
  on public.gov_historical_series for select
  using (auth.role() in ('authenticated','service_role'));

alter table public.gov_pollutant_breakdown enable row level security;
create policy if not exists "Gov pollutant: read"
  on public.gov_pollutant_breakdown for select
  using (auth.role() in ('authenticated','service_role'));

alter table public.gov_heatmap_points enable row level security;
create policy if not exists "Gov heatmap: read"
  on public.gov_heatmap_points for select
  using (auth.role() in ('authenticated','service_role'));

alter table public.gov_policy_impacts enable row level security;
create policy if not exists "Gov policy impacts: read"
  on public.gov_policy_impacts for select
  using (auth.role() in ('authenticated','service_role'));

alter table public.gov_notes enable row level security;
create policy if not exists "Gov notes: read"
  on public.gov_notes for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists "Gov notes: manage"
  on public.gov_notes for all
  using (auth.uid() = created_by or auth.role() = 'service_role')
  with check (auth.uid() = created_by or auth.role() = 'service_role');

alter table public.gov_incidents enable row level security;
create policy if not exists "Gov incidents: insert"
  on public.gov_incidents for insert
  with check (auth.role() in ('authenticated','service_role'));

create policy if not exists "Gov incidents: modify"
  on public.gov_incidents for update
  using (auth.uid() = created_by or auth.role() = 'service_role')
  with check (auth.uid() = created_by or auth.role() = 'service_role');

create policy if not exists "Gov incidents: delete"
  on public.gov_incidents for delete
  using (auth.uid() = created_by or auth.role() = 'service_role');

alter table public.incident_activity enable row level security;
create policy if not exists "Incident activity: read"
  on public.incident_activity for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists "Incident activity: write"
  on public.incident_activity for insert
  with check (auth.role() in ('authenticated','service_role'));

alter table public.gov_measurement_uploads enable row level security;
create policy if not exists "Gov uploads: read"
  on public.gov_measurement_uploads for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists "Gov uploads: manage"
  on public.gov_measurement_uploads for all
  using (auth.uid() = created_by or auth.role() = 'service_role')
  with check (auth.uid() = created_by or auth.role() = 'service_role');

alter table public.gov_report_subscriptions enable row level security;
create policy if not exists "Gov report subscriptions: read"
  on public.gov_report_subscriptions for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists "Gov report subscriptions: manage"
  on public.gov_report_subscriptions for all
  using (auth.uid() = created_by or auth.role() = 'service_role')
  with check (auth.uid() = created_by or auth.role() = 'service_role');

alter table public.gov_report_dispatch_log enable row level security;
create policy if not exists "Gov dispatch log: read"
  on public.gov_report_dispatch_log for select
  using (auth.role() in ('authenticated','service_role'));

create policy if not exists "Gov dispatch log: service"
  on public.gov_report_dispatch_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Audit logging is insert-only for service role clients ----------------

alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from authenticated;
revoke all on table public.audit_logs from anon;
grant insert on table public.audit_logs to service_role;
