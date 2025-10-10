// @ts-ignore - remote module imported at runtime by Deno edge functions.
import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
// @ts-ignore - remote module imported at runtime by Deno edge functions.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

type MeasurementEntry = {
  city?: string;
  location?: string;
  country?: string;
  coordinates?: { latitude?: number; longitude?: number };
  measurements?: Array<{
    parameter?: string;
    value?: number;
    unit?: string;
    lastUpdated?: string;
  }>;
};

type SnapshotRow = {
  city_id: string;
  aqi: number | null;
  dominant_pollutant: string | null;
  pollutants: unknown;
  recorded_at: string;
  metadata: Record<string, unknown>;
};

type AuditRow = {
  city_id: string | null;
  status: string;
  error_message: string | null;
  started_at: string;
  finished_at: string;
};

const DEFAULT_RESULTS_LIMIT = 50;
const OPENAQ_ENDPOINT = Deno.env.get('OPENAQ_BASE_URL') ?? 'https://api.openaq.org/v2';
const OPENAQ_LIMIT = Number(Deno.env.get('OPENAQ_LIMIT') ?? DEFAULT_RESULTS_LIMIT);

const getServiceToken = (): string | undefined => {
  if (typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function') {
    const token = Deno.env.get('SERVICE_ROLE_TOKEN');
    if (token) {
      return token;
    }
  }
  return (globalThis as typeof globalThis & { SERVICE_ROLE_TOKEN?: string }).SERVICE_ROLE_TOKEN;
};

const isAuthorized = (request: Request, serviceToken?: string): boolean => {
  if (!serviceToken) {
    return false;
  }
  const headerToken = request.headers.get('x-service-role-token')
    ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    ?? undefined;
  return Boolean(headerToken && headerToken === serviceToken);
};

const slugify = (value: string, fallback: string): string => {
  if (!value) {
    return fallback;
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || fallback;
};

const buildSnapshotRow = (entry: MeasurementEntry, index: number): SnapshotRow | null => {
  const primaryMeasurement = entry.measurements?.[0];
  const latitude = entry.coordinates?.latitude;
  const longitude = entry.coordinates?.longitude;
  const fallbackId = latitude && longitude ? `lat${latitude}-lng${longitude}` : `location-${index}`;
  const cityId = slugify(entry.city ?? entry.location ?? '', fallbackId);

  if (!cityId) {
    return null;
  }

  const recordedAt = primaryMeasurement?.lastUpdated ?? new Date().toISOString();

  const pollutants = entry.measurements?.map((measurement) => ({
    parameter: measurement.parameter ?? null,
    value: measurement.value ?? null,
    unit: measurement.unit ?? null,
    lastUpdated: measurement.lastUpdated ?? null,
  })) ?? [];

  const dominantPollutant = primaryMeasurement?.parameter
    ? primaryMeasurement.parameter.toUpperCase()
    : null;

  return {
    city_id: cityId,
    aqi: typeof primaryMeasurement?.value === 'number' ? primaryMeasurement.value : null,
    dominant_pollutant: dominantPollutant,
    pollutants,
    recorded_at: recordedAt,
    metadata: {
      source: 'openaq_latest',
      country: entry.country ?? null,
      city: entry.city ?? null,
      location: entry.location ?? null,
      coordinates: entry.coordinates ?? null,
      measurementCount: entry.measurements?.length ?? 0,
    },
  };
};

const insertAuditRows = async (supabaseClient: SupabaseClient, rows: AuditRow[]): Promise<void> => {
  if (!rows.length) {
    return;
  }
  const { error } = await supabaseClient.from('aq_ingestion_audit').insert(rows);
  if (error) {
    console.warn('[aq_ingestion] failed to insert audit rows', error.message);
  }
};

const fetchLatestMeasurements = async (): Promise<MeasurementEntry[]> => {
  const url = new URL(`${OPENAQ_ENDPOINT.replace(/\/$/, '')}/latest`);
  url.searchParams.set('limit', OPENAQ_LIMIT.toString());
  url.searchParams.set('sort', 'desc');
  url.searchParams.set('order_by', 'lastUpdated');

  const apiKey = Deno.env.get('OPENAQ_API_KEY');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`OpenAQ request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.results) ? payload.results : [];
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE');

const supabaseClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  })
  : null;

export const handler = async (request: Request): Promise<Response> => {
  const serviceToken = getServiceToken();

  if (!isAuthorized(request, serviceToken)) {
    return new Response(JSON.stringify({ accepted: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!supabaseClient) {
    return new Response(JSON.stringify({ accepted: false, message: 'Supabase credentials missing' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const startedAt = new Date().toISOString();

  try {
    const measurements = await fetchLatestMeasurements();
    const snapshots = measurements
      .map((entry, index) => buildSnapshotRow(entry, index))
      .filter((entry): entry is SnapshotRow => Boolean(entry));

    if (!snapshots.length) {
      await insertAuditRows(supabaseClient, [{
        city_id: null,
        status: 'no_results',
        error_message: null,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      }]);

      return new Response(JSON.stringify({ accepted: true, message: 'No snapshots returned', count: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const { error: upsertError } = await supabaseClient
      .from('aq_measurements')
      .upsert(snapshots, { onConflict: 'city_id', ignoreDuplicates: false });

    if (upsertError) {
      throw new Error(upsertError.message ?? 'Failed to upsert measurements');
    }

    const finishedAt = new Date().toISOString();

    await insertAuditRows(supabaseClient, snapshots.map((snapshot) => ({
      city_id: snapshot.city_id,
      status: 'success',
      error_message: null,
      started_at: startedAt,
      finished_at: finishedAt,
    })));

    return new Response(JSON.stringify({ accepted: true, count: snapshots.length }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : 'Unknown ingestion failure';

    await insertAuditRows(supabaseClient, [{
      city_id: null,
      status: 'failed',
      error_message: message,
      started_at: startedAt,
      finished_at: finishedAt,
    }]);

    return new Response(JSON.stringify({ accepted: false, message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

serve(handler);
