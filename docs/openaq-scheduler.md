# OpenAQ Ingestion Scheduler

This guide documents how to operationalize the OpenAQ data ingestion pipeline using Supabase cron jobs and Edge Functions.

## Overview

The application now supports two persistence tiers for pollutant snapshots:

1. **Local cache** – The `useOpenAqSnapshotCache` hook stores the most recent OpenAQ payloads in `localStorage`, giving the dashboard instant hydration while fresh data loads in the background.
2. **Supabase persistence** – The `upsertOpenAqSnapshots` function writes normalized measurements into the `aq_measurements` table, supporting historical analytics, government reporting, and multi-device sync.

To keep Supabase data fresh, schedule an automated fetch that executes every 30 minutes.

## Prerequisites

- Supabase project with the following tables:
  - `aq_measurements`
  - `aq_ingestion_audit`
- Service role key to authenticate server-side Edge Functions.
- Environment variables configured for the application:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_ANON_KEY`
  - (server only) `SUPABASE_SERVICE_ROLE`
  - `OPENAQ_API_KEY` (optional; OpenAQ v2 supports unauthenticated reads but keys lift rate limits).

## Edge Function Implementation

The repository now ships with a production-ready Supabase Edge Function named `aq_ingestion` located at `supabase/functions/aq_ingestion/index.ts`.

### Responsibilities

- Validate that the invocation includes an `x-service-role-token` (or `Authorization: Bearer`) header which matches the service-role secret configured in the Supabase Vault.
- Fetch the latest OpenAQ snapshots (default limit `50`) and normalize measurements into the schema expected by `aq_measurements`.
- Upsert each snapshot into `aq_measurements` and record a success row in `aq_ingestion_audit` for observability.
- When no results are returned, insert a `no_results` audit row to preserve scheduling insight.
- On errors, log a `failed` audit row that captures the message and return a `500` response payload.

### Environment Variables

Configure the function environment via Supabase project settings or locally through a `.env` file when running `supabase functions serve`:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Project REST endpoint (automatically injected in Supabase-hosted runtime). |
| `SUPABASE_SERVICE_ROLE` | Service-role key that grants table write access. |
| `SERVICE_ROLE_TOKEN` | Shared secret checked against `x-service-role-token` / Bearer header to guard the function. |
| `OPENAQ_API_KEY` *(optional)* | Personal API key to raise OpenAQ rate limits. |
| `OPENAQ_BASE_URL` *(optional)* | Override for OpenAQ API base (defaults to `https://api.openaq.org/v2`). |
| `OPENAQ_LIMIT` *(optional)* | Maximum snapshot count per run (defaults to `50`). |

When running locally, supply the secret header manually:

```
curl -i \
  -H "x-service-role-token: $SERVICE_ROLE_TOKEN" \
  http://localhost:54321/functions/v1/aq_ingestion
```

Successful responses return a JSON payload such as `{ "accepted": true, "count": 42 }`.

## Scheduler (Cron) Configuration

Use Supabase Scheduler to call the `aq_ingestion` Edge Function every 30 minutes.

```sql
insert into cron.jobs (name, schedule, command)
values (
  'aq_ingestion_latest_snapshots',
  '*/30 * * * *',
  'https://<project-ref>.functions.supabase.co/aq_ingestion'
);
```

- Replace `<project-ref>` with your Supabase project reference ID.
- Provide the function with a Bearer token derived from the service role key (store in Vault secret and reference via `headers` when configuring the cron job through the dashboard or API).

## Observability

- Successful runs immediately upsert rows in `aq_measurements` and append `success` logs to `aq_ingestion_audit`.
- Configure Supabase Log Drains or send Edge Function logs to an external sink (Datadog, Logflare) for alerting.
- The dashboard reads persisted measurements on the next client sync, falling back to locally cached snapshots if the network is offline.

## Local Development Tips

- The Edge Function can be emulated locally with `supabase functions serve --env-file ./supabase/.env`. Provide a `SERVICE_ROLE_TOKEN` in your env file to bypass the auth guard.
- Trigger `aq_ingestion` manually with the curl command above or through the Supabase CLI (`supabase functions invoke aq_ingestion --no-verify-jwt`).
- The React application still hydrates from the local cache first, so you can validate UI freshness by clearing `localStorage` and confirming that dashboard measurements reload from Supabase after the function executes.
