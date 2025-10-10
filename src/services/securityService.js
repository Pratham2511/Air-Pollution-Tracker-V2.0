import { supabase, hasSupabaseCredentials } from './supabaseClient';

const AUDIT_TABLE = 'audit_logs';

const debugLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[securityService]', ...args);
  }
};

const buildPayload = ({
  eventType,
  route,
  userId = null,
  role = null,
  outcome = 'granted',
  details = {},
}) => ({
  event_type: eventType,
  route,
  user_id: userId,
  role,
  outcome,
  metadata: details,
  recorded_at: new Date().toISOString(),
});

const insertAuditRecord = async (payload) => {
  try {
    if (!hasSupabaseCredentials) {
      debugLog('Supabase credentials missing, skipping audit insert.', payload);
      return;
    }

    const { error } = await supabase.from(AUDIT_TABLE).insert(payload);

    if (error) {
      throw error;
    }
  } catch (error) {
    debugLog('Failed to record audit event', error);
  }
};

export const logAccessGranted = async ({ route, userId, role, details } = {}) =>
  insertAuditRecord(
    buildPayload({
      eventType: 'route_access',
      route,
      userId,
      role,
      outcome: 'granted',
      details,
    }),
  );

export const logAccessDenied = async ({ route, userId, role, reason, details } = {}) =>
  insertAuditRecord(
    buildPayload({
      eventType: 'route_access',
      route,
      userId,
      role,
      outcome: 'denied',
      details: { ...details, reason },
    }),
  );

export const logSecurityIncident = async ({ route, userId, role, details } = {}) =>
  insertAuditRecord(
    buildPayload({
      eventType: 'security_incident',
      route,
      userId,
      role,
      outcome: 'flagged',
      details,
    }),
  );

export const SecurityEvents = Object.freeze({
  ACCESS_GRANTED: 'route_access_granted',
  ACCESS_DENIED: 'route_access_denied',
  SECURITY_INCIDENT: 'security_incident',
});

export default {
  logAccessGranted,
  logAccessDenied,
  logSecurityIncident,
};
