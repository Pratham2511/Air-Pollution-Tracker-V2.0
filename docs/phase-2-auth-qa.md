# Phase 2 Authentication QA Checklist

_Last updated: 2025-10-10_

This checklist covers the configuration, verification, and regression steps required before we sign off the dual-track authentication program introduced in Phase 2.

---

## 1. Environment Setup

1. Duplicate `.env.example` as `.env.local` and supply the following variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
2. Enable the Outlook sender `prathampansare9@outlook.com` inside Supabase Auth > Email Templates and set the project mailer to *Production* mode.
3. Add both `http://localhost:3000` and the deployed hostnames to **Auth > URL Configuration** as redirect origins.

---

## 2. Database Migration

1. Apply the schema script:

   ```sql
   \i supabase/schema/phase2-auth.sql
   ```

   This creates the `profiles`, `otp_requests`, and `audit_logs` tables, the `set_updated_at` trigger, and all RLS policies.

2. Verify policies:
   - In Supabase SQL Editor run `select * from auth.policies where table_name in ('profiles', 'otp_requests', 'audit_logs');`
   - Ensure the generated policies are present and row level security is enabled.

3. Grant `service_role` access if using Edge Functions for background maintenance (optional):

   ```sql
   grant insert, delete on table public.otp_requests to service_role;
   ```

---

## 3. Functional Verification

### Citizen Flow

1. Open the landing page, complete the citizen registration form with a Gmail/Outlook address.
2. Confirm validation errors fire for short names, invalid domains, and password policy violations.
3. Submit the form and confirm an OTP email is received (5 minute expiry displayed in UI).
4. Enter an incorrect OTP → verify warning toast and audit log entry (`audit_logs.outcome = 'flagged'`).
5. Enter the correct OTP → confirm automatic redirect to `/dashboard` and `profiles.government_verified = false`.
6. Sign out → ensure audit log entry with `event_type = 'route_access'` and `outcome = 'granted'` is created.

### Government Flow

1. Register using a whitelisted `.gov*` domain.
2. Verify the onboarding stepper highlights the current phase and metadata card shows department/region/role.
3. Confirm OTP resend is rate-limited by the countdown and metadata persists between sends.
4. Successful verification should set `profiles.government_verified = true` and redirect to `/gov`.
5. Attempt password sign-in with an invalid password to produce an audit log `outcome = 'denied'`.

---

## 4. Audit Logging Validation

1. Query `select * from public.audit_logs order by recorded_at desc limit 10;` and confirm events for:
   - Citizen signup success/failure
   - Government signup success
   - OTP request + verification (granted/flagged)
   - Password sign in (granted/denied)
   - Sign out events
2. Ensure non-admin roles cannot select from `audit_logs` by running the query with an authenticated but non-admin user (should return RLS permission error).

---

## 5. Automated Tests

Run the Jest suite locally:

```bash
npm install
npm test -- --watchAll=false
```

All suites must pass before the release candidate is approved. GitHub Actions should mirror this command in CI.

---

## 6. Rollout Notes

- Add `supabase/schema/phase2-auth.sql` to the deploy pipeline so migrations run automatically.
- Populate Supabase Storage with OTP templated emails (HTML + text) if custom branding is requested.
- Monitor `audit_logs` during the first 48 hours post-release for spikes in `outcome = 'flagged'` events.

---

**Sign-off:** A release is considered Phase 2 compliant when the above steps are completed, the audit logs show expected coverage, and all automated tests pass.
