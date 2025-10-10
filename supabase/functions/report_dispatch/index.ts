// @ts-ignore - remote module imports resolved by Deno at runtime.
import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
// @ts-ignore - remote module imports resolved by Deno at runtime.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

type ReportSubscription = {
  id: string;
  name: string;
  cadence: string;
  audience: string | null;
  status: string;
};

type MeasurementRecord = {
  city_id: string | null;
  aqi: number | null;
  dominant_pollutant: string | null;
  recorded_at: string | null;
  metadata: Record<string, unknown> | null;
};

type DigestMetrics = {
  generatedAt: string;
  totalSamples: number;
  averageAqi: number | null;
  highestCity: MeasurementRecord | null;
  lowestCity: MeasurementRecord | null;
  pollutantBreakdown: Array<{ pollutant: string; count: number; percentage: number }>;
};

const toServiceToken = (): string | undefined => {
  if (typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function') {
    const envToken = Deno.env.get('SERVICE_ROLE_TOKEN');
    if (envToken) {
      return envToken;
    }
  }
  return (globalThis as typeof globalThis & { SERVICE_ROLE_TOKEN?: string }).SERVICE_ROLE_TOKEN;
};

const isAuthorized = (request: Request, token?: string): boolean => {
  if (!token) {
    return false;
  }
  const headerToken = request.headers.get('x-service-role-token')
    ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    ?? undefined;
  return Boolean(headerToken && headerToken === token);
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE');

const supabaseClient: SupabaseClient | null = SUPABASE_URL && SUPABASE_SERVICE_ROLE
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } })
  : null;

const fetchActiveSubscriptions = async (client: SupabaseClient): Promise<ReportSubscription[]> => {
  const { data, error } = await client
    .from<ReportSubscription>('gov_report_subscriptions')
    .select('id,name,cadence,audience,status')
    .eq('status', 'active');

  if (error) {
    throw error;
  }

  return data ?? [];
};

const fetchRecentMeasurements = async (client: SupabaseClient): Promise<MeasurementRecord[]> => {
  const { data, error } = await client
    .from<MeasurementRecord>('aq_measurements')
    .select('city_id,aqi,dominant_pollutant,recorded_at,metadata')
    .order('recorded_at', { ascending: false })
    .limit(150);

  if (error) {
    throw error;
  }

  return data ?? [];
};

const calculateDigestMetrics = (records: MeasurementRecord[]): DigestMetrics => {
  const generatedAt = new Date().toISOString();
  if (!records.length) {
    return {
      generatedAt,
      totalSamples: 0,
      averageAqi: null,
      highestCity: null,
      lowestCity: null,
      pollutantBreakdown: [],
    };
  }

  const numericValues = records
    .map((record) => (typeof record.aqi === 'number' ? record.aqi : null))
    .filter((value): value is number => value !== null);

  const averageAqi = numericValues.length
    ? Number((numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length).toFixed(2))
    : null;

  const highestCity = [...records]
    .filter((record) => typeof record.aqi === 'number')
    .sort((a, b) => (b.aqi ?? 0) - (a.aqi ?? 0))[0] ?? null;

  const lowestCity = [...records]
    .filter((record) => typeof record.aqi === 'number')
    .sort((a, b) => (a.aqi ?? 0) - (b.aqi ?? 0))[0] ?? null;

  const pollutantCounts = new Map<string, number>();
  records.forEach((record) => {
    const pollutant = record.dominant_pollutant ?? undefined;
    if (!pollutant) {
      return;
    }
    const key = pollutant.toUpperCase();
    pollutantCounts.set(key, (pollutantCounts.get(key) ?? 0) + 1);
  });

  const pollutantBreakdown = Array.from(pollutantCounts.entries())
    .map(([pollutant, count]) => ({
      pollutant,
      count,
      percentage: Number(((count / records.length) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    generatedAt,
    totalSamples: records.length,
    averageAqi,
    highestCity,
    lowestCity,
    pollutantBreakdown,
  };
};

const buildSummary = (subscription: ReportSubscription, metrics: DigestMetrics) => {
  const highest = metrics.highestCity;
  const lowest = metrics.lowestCity;
  const topPollutants = metrics.pollutantBreakdown.map((entry) => `${entry.pollutant} (${entry.percentage}%)`);

  return {
    subscription: {
      id: subscription.id,
      name: subscription.name,
      cadence: subscription.cadence,
    },
    generatedAt: metrics.generatedAt,
    highlights: {
      averageAqi: metrics.averageAqi,
      highestCity: highest
        ? {
            cityId: highest.city_id,
            aqi: highest.aqi,
            pollutant: highest.dominant_pollutant,
            recordedAt: highest.recorded_at,
          }
        : null,
      lowestCity: lowest
        ? {
            cityId: lowest.city_id,
            aqi: lowest.aqi,
            pollutant: lowest.dominant_pollutant,
            recordedAt: lowest.recorded_at,
          }
        : null,
      topPollutants,
    },
  };
};

const insertDispatchLog = async (
  client: SupabaseClient,
  params: {
    subscriptionId: string;
    status: 'queued' | 'delivered' | 'failed' | 'no_audience' | 'no_data';
    summary: Record<string, unknown>;
    metrics: DigestMetrics;
    audience: string | null;
    errorMessage?: string | null;
  },
): Promise<void> => {
  const { error } = await client.from('gov_report_dispatch_log').insert([
    {
      subscription_id: params.subscriptionId,
      status: params.status,
      summary: params.summary,
      metrics: params.metrics,
      audience: params.audience,
      delivered_at: params.status === 'delivered' ? new Date().toISOString() : null,
      error_message: params.errorMessage ?? null,
    },
  ]);

  if (error) {
    throw error;
  }
};

const updateLastRunAt = async (client: SupabaseClient, subscriptionId: string): Promise<void> => {
  const { error } = await client
    .from('gov_report_subscriptions')
    .update({ last_run_at: new Date().toISOString() })
    .eq('id', subscriptionId);

  if (error) {
    throw error;
  }
};

export const handler = async (request: Request): Promise<Response> => {
  const serviceToken = toServiceToken();

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

  try {
    const [subscriptions, measurements] = await Promise.all([
      fetchActiveSubscriptions(supabaseClient),
      fetchRecentMeasurements(supabaseClient),
    ]);

    if (!subscriptions.length) {
      return new Response(JSON.stringify({ accepted: true, message: 'No active subscriptions found', subscriptions: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const metrics = calculateDigestMetrics(measurements);
    const results = [] as Array<{ subscriptionId: string; status: string }>;

    for (const subscription of subscriptions) {
      if (!subscription.audience) {
        await insertDispatchLog(supabaseClient, {
          subscriptionId: subscription.id,
          status: 'no_audience',
          summary: buildSummary(subscription, metrics),
          metrics,
          audience: null,
        });
        results.push({ subscriptionId: subscription.id, status: 'no_audience' });
        continue;
      }

      if (!metrics.totalSamples) {
        await insertDispatchLog(supabaseClient, {
          subscriptionId: subscription.id,
          status: 'no_data',
          summary: buildSummary(subscription, metrics),
          metrics,
          audience: subscription.audience,
        });
        results.push({ subscriptionId: subscription.id, status: 'no_data' });
        continue;
      }

      try {
        await insertDispatchLog(supabaseClient, {
          subscriptionId: subscription.id,
          status: 'delivered',
          summary: buildSummary(subscription, metrics),
          metrics,
          audience: subscription.audience,
        });
        await updateLastRunAt(supabaseClient, subscription.id);
        results.push({ subscriptionId: subscription.id, status: 'delivered' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown dispatch failure';
        await insertDispatchLog(supabaseClient, {
          subscriptionId: subscription.id,
          status: 'failed',
          summary: buildSummary(subscription, metrics),
          metrics,
          audience: subscription.audience,
          errorMessage: message,
        });
        results.push({ subscriptionId: subscription.id, status: 'failed' });
      }
    }

    return new Response(JSON.stringify({ accepted: true, subscriptions: subscriptions.length, results }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ accepted: false, message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

serve(handler);
