import { supabase, hasSupabaseCredentials } from './supabaseClient';

const INCIDENT_ACTIVITY_TABLE = 'incident_activity';
const LOCAL_CACHE_KEY = 'aqt::incident-activity@v1';

const debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[incidentLogService]', ...args);
  }
};

const readLocalCache = () => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(LOCAL_CACHE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    debug('Failed to read local incident cache', error);
    return [];
  }
};

const writeLocalCache = (entries) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(entries.slice(0, 50)));
  } catch (error) {
    debug('Failed to write local incident cache', error);
  }
};

const normalizePayload = ({
  incidentId,
  action,
  actorId = null,
  actorRole = null,
  metadata = {},
}) => ({
  incident_id: incidentId,
  event_action: action,
  actor_id: actorId,
  actor_role: actorRole,
  context: metadata,
  recorded_at: new Date().toISOString(),
});

export const recordIncidentEvent = async ({ incidentId, action, actorId, actorRole, metadata } = {}) => {
  if (!incidentId || !action) {
    debug('Missing incidentId/action. Skipping incident event.', { incidentId, action });
    return;
  }

  const payload = normalizePayload({ incidentId, action, actorId, actorRole, metadata });

  if (!hasSupabaseCredentials) {
    debug('Supabase credentials missing. Incident event cached locally.', payload);
    const existing = readLocalCache();
    writeLocalCache([payload, ...existing]);
    return;
  }

  try {
    const { error } = await supabase.from(INCIDENT_ACTIVITY_TABLE).insert(payload);
    if (error) {
      throw error;
    }
  } catch (error) {
    debug('Failed to record incident activity', error);
  }
};

export const recordIncidentBreach = async ({ incidentId, actorId, actorRole, metadata }) =>
  recordIncidentEvent({
    incidentId,
    action: 'breach_escalated',
    actorId,
    actorRole,
    metadata,
  });

export default {
  recordIncidentEvent,
  recordIncidentBreach,
};
