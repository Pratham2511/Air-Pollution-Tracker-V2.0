# Report Dispatch Scheduler

This guide explains how to operationalize the government report automation pipeline powered by the `report_dispatch` Supabase Edge Function.

## Overview

Government stakeholders can subscribe to recurring digests that summarize the latest national air-quality posture. The Edge Function executes on a cron schedule and produces:

- Average AQI across the most recent measurement window.
- Highest and lowest AQI cities, including dominant pollutant context.
- Pollutant share leaderboard to highlight primary risk drivers.
- Delivery and audit log entries for each subscription, stored in the `gov_report_dispatch_log` table.
- Automatic `last_run_at` updates on `gov_report_subscriptions` so the UI can surface freshness indicators.

## Prerequisites

1. Supabase project configured with the Phase 4 schema (**`supabase/schema/phase4-government.sql`**). This migration provisions:
   - `gov_report_subscriptions` – stores the configured digests.
   - `gov_report_dispatch_log` – captures delivery, failure, and empty-audience outcomes per run.
2. Supabase service-role key stored securely (Supabase Vault or local `.env` when emulating).
3. Optional OpenAQ ingestion scheduler (see `docs/openaq-scheduler.md`) to keep `aq_measurements` current.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Project REST URL (auto-injected in hosted runtime). |
| `SUPABASE_SERVICE_ROLE` | Service-role key enabling table reads/writes. |
| `SERVICE_ROLE_TOKEN` | Shared secret enforced via `x-service-role-token` / `Authorization` header. |

> The function does **not** require the OpenAQ API key; it only reads from `aq_measurements`.

## Local Development

Start the Supabase Edge Function locally:

```bash
supabase functions serve report_dispatch --env-file ./supabase/.env
```

Trigger a manual run (after seeding `aq_measurements` with sample data):

```bash
curl -i \
  -H "x-service-role-token: $SERVICE_ROLE_TOKEN" \
  http://localhost:54321/functions/v1/report_dispatch
```

Inspect results:

- Delivery logs populate `gov_report_dispatch_log`.
- Subscriptions with an `audience` value get `status = delivered` or `failed` entries.
- Subscriptions without an `audience` are marked `no_audience` so operators can fill the metadata gap.

## Scheduler Configuration

Create a Supabase cron job to execute every morning at 07:00 India Standard Time (adjust cadence as needed):

```sql
insert into cron.jobs (name, schedule, command, http_headers)
values (
  'gov_report_dispatch_daily',
  '0 1 * * *', -- 07:00 IST (UTC+5:30) -> 01:00 UTC
  'https://<project-ref>.functions.supabase.co/report_dispatch',
  jsonb_build_object('x-service-role-token', '<vault-secret-ref>')
)
ON CONFLICT (name) DO UPDATE
set schedule = excluded.schedule,
    command = excluded.command,
    http_headers = excluded.http_headers;
```

- Replace `<project-ref>` with your Supabase project reference ID.
- Swap `<vault-secret-ref>` with a Vault secret alias if using the Dashboard UI.
- Update the cron expression to your preferred cadence (e.g., `0 */6 * * *` for six-hour intervals).

## Observability

- `gov_report_dispatch_log` retains audit history, including error messages when a delivery fails.
- Supabase Edge Function logs (Realtime Logs, Logflare, or Datadog sink) help diagnose runtime issues.
- UI components can display the `last_run_at` timestamp to communicate report freshness to administrators.

## Failure Handling

The function differentiates between several outcomes:

- `delivered` – Metrics compiled successfully and the audience field was present.
- `no_audience` – Subscription has no configured audience; no message delivered.
- `no_data` – `aq_measurements` lacked data; operators should verify ingestion health.
- `failed` – An unexpected Supabase error occurred. Review the associated `error_message` field.

Re-running the function after correcting configuration issues will generate new log entries while retaining historical records for auditability.
