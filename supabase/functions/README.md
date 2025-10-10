# Supabase Edge Functions (Phase 8 Stubs)

These TypeScript functions are placeholders to scaffold the security/performance enhancements planned in Phase 8.

## Functions

### `aq_ingestion`
- Validates requests via an `x-service-role-token` header.
- Will orchestrate ingestion of OpenAQ data via `openAqIngestionService`.
- Returns **202 Accepted** when the job is queued.

### `report_dispatch`
- Same authentication guard as `aq_ingestion`.
- Will fan-out weekly/daily digests to subscribed agencies.

## Deployment Notes
- Configure `SERVICE_ROLE_TOKEN` secret in Supabase Edge runtime.
- Bind the functions to a schedule using Supabase CLI when implementation is ready.
- Replace the TODO blocks with real ingestion/reporting logic in later phases.
