-- Supabase RLS Policy Templates for Air Quality Tracker
-- Generated: 2025-10-10

-- Profiles table: restrict access by auth.uid()
create policy "Profiles: owner can read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles: owner can update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- OTP requests: allow owner read/insert, service role manages cleanup
create policy "OTP: owner can read"
  on public.otp_requests for select
  using (auth.uid() = user_id);

create policy "OTP: owner can insert"
  on public.otp_requests for insert
  with check (auth.uid() = user_id);

-- Tracked cities: user scoped rows
create policy "Tracked cities: owner read"
  on public.tracked_cities for select
  using (auth.uid() = user_id);

create policy "Tracked cities: owner write"
  on public.tracked_cities for insert
  with check (auth.uid() = user_id);

create policy "Tracked cities: owner update/delete"
  on public.tracked_cities for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Tracked cities: owner delete"
  on public.tracked_cities for delete
  using (auth.uid() = user_id);

-- Government notes restricted by jurisdiction or admin override
create policy "Gov notes: jurisdiction read"
  on public.gov_notes for select
  using (
    auth.uid() = author_id
    or auth.jwt()->>'role' in ('admin')
    or auth.jwt()->>'jurisdiction' = jurisdiction
  );

create policy "Gov notes: jurisdiction write"
  on public.gov_notes for insert
  with check (
    auth.uid() = author_id
    or auth.jwt()->>'role' in ('admin')
  );

-- Audit log insert-only via service role
revoke all on table public.audit_logs from authenticated;
revoke all on table public.audit_logs from anon;

grant insert on table public.audit_logs to service_role;

enable row level security on public.profiles;
enable row level security on public.otp_requests;
enable row level security on public.tracked_cities;
enable row level security on public.gov_notes;
enable row level security on public.audit_logs;
