import { supabase, hasSupabaseCredentials } from './supabaseClient';

const MEASUREMENTS_TABLE = 'aq_measurements';

const normalizeSnapshot = (snapshot) => {
  if (!snapshot?.id) {
    return null;
  }

  return {
    city_id: snapshot.id,
    aqi: snapshot.aqi ?? null,
    dominant_pollutant: snapshot.dominantPollutant ?? null,
    pollutants: snapshot.pollutants ?? null,
    recorded_at: snapshot.updatedAt ?? new Date().toISOString(),
    metadata: {
      ...(snapshot.metadata ?? {}),
      source: snapshot.metadata?.source ?? 'openAq',
    },
  };
};

export const upsertOpenAqSnapshots = async (snapshots = []) => {
  if (!hasSupabaseCredentials || !Array.isArray(snapshots) || snapshots.length === 0) {
    return { error: null, count: 0 };
  }

  const rows = snapshots
    .map(normalizeSnapshot)
    .filter(Boolean);

  if (!rows.length) {
    return { error: null, count: 0 };
  }

  const { error } = await supabase
    .from(MEASUREMENTS_TABLE)
    .upsert(rows, { onConflict: 'city_id', ignoreDuplicates: false });

  return { error: error?.message ?? null, count: rows.length };
};

export const recordOpenAqIngestionLog = async ({ cityId, status, error, startedAt, finishedAt }) => {
  if (!hasSupabaseCredentials) {
    return { error: null };
  }

  const payload = {
    city_id: cityId,
    status,
    error_message: error ?? null,
    started_at: startedAt ?? new Date().toISOString(),
    finished_at: finishedAt ?? new Date().toISOString(),
  };

  const { error: insertError } = await supabase
    .from('aq_ingestion_audit')
    .insert(payload);

  return { error: insertError?.message ?? null };
};

const openAqIngestionService = {
  upsertOpenAqSnapshots,
  recordOpenAqIngestionLog,
};

export default openAqIngestionService;
