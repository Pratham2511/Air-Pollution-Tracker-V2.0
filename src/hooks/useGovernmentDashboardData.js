import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buildCsv,
  buildJson,
  createIncident,
  deleteIncident,
  createReportSubscription,
  fetchPolicyImpacts,
  fetchGovernmentNotes,
  fetchHeatmapPoints,
  fetchHistoricalSeries,
  fetchIncidents,
  fetchHotspotAlerts,
  fetchIncidentActivity,
  fetchLiveMetrics,
  fetchPollutantBreakdown,
  fetchMeasurementUploads,
  fetchReportSubscriptions,
  fetchReportDispatchLog,
  GOVERNMENT_DEFAULT_CITY,
  subscribeToLiveMetrics,
  triggerDownload,
  updateIncidentStatus,
  recordMeasurementUpload,
} from '../services/governmentDashboardService';
import { logSecurityIncident, logAccessGranted } from '../services/securityService';
import { recordIncidentEvent } from '../services/incidentLogService';
import { useAuth } from '../context/AuthContext';
import { analyzeUploadPayload } from '../utils/measurementUploads';
import { MAPBOX_GUARDRAIL_EVENT, MAPBOX_GUARDRAIL_STORAGE_KEY } from './useMapboxGuardrail';

const DEFAULT_FILTERS = {
  search: '',
  pollutant: 'all',
  status: 'all',
};

const getGuardrailMonthKey = () => {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${now.getUTCFullYear()}-${month}`;
};

const readGuardrailSnapshot = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(MAPBOX_GUARDRAIL_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    const monthKey = getGuardrailMonthKey();
    const loads = Number.isFinite(parsed?.[monthKey]) ? Number(parsed[monthKey]) : 0;
    return {
      monthKey,
      loads,
      remaining: null,
      reason: 'unknown',
      maxMonthlyLoads: null,
      canUseMap: true,
    };
  } catch (error) {
    return null;
  }
};

const buildHighlights = (series, window) => {
  const points = series?.[window] ?? [];
  if (!points.length) {
    return [];
  }

  const maxPoint = points.reduce((prev, curr) => (curr.aqi > prev.aqi ? curr : prev), points[0]);
  const minPoint = points.reduce((prev, curr) => (curr.aqi < prev.aqi ? curr : prev), points[0]);
  const latest = points[points.length - 1];

  return [
    {
      id: 'peak',
      label: 'Peak AQI',
      value: maxPoint.aqi,
      meta: `${maxPoint.label}`,
    },
    {
      id: 'low',
      label: 'Lowest AQI',
      value: minPoint.aqi,
      meta: `${minPoint.label}`,
    },
    {
      id: 'trend',
      label: 'Latest',
      value: latest.aqi,
      meta: latest.aqi > latest.forecast ? 'Above forecast' : 'On track',
    },
  ];
};

export const useGovernmentDashboardData = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilterState] = useState(DEFAULT_FILTERS);
  const [selectedWindow, setSelectedWindow] = useState('24h');
  const [selectedCity, setSelectedCity] = useState(GOVERNMENT_DEFAULT_CITY);
  const [reportFormat, setReportFormat] = useState('csv');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRecordingUpload, setIsRecordingUpload] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [lastUploadSummary, setLastUploadSummary] = useState(null);
  const [mapboxGuardrail, setMapboxGuardrail] = useState(() => readGuardrailSnapshot());

  const liveMetricsKey = useMemo(
    () => ['gov-live-metrics', filters.search ?? '', filters.pollutant ?? 'all', filters.status ?? 'all'],
    [filters.pollutant, filters.search, filters.status],
  );
  const historicalKey = useMemo(() => ['gov-historical', selectedCity], [selectedCity]);
  const pollutantKey = useMemo(() => ['gov-pollutant-breakdown'], []);
  const heatmapKey = useMemo(() => ['gov-heatmap'], []);
  const incidentsKey = useMemo(() => ['gov-incidents'], []);
  const incidentActivityKey = useMemo(() => ['gov-incident-activity'], []);
  const hotspotsKey = useMemo(() => ['gov-hotspots'], []);
  const notesKey = useMemo(() => ['gov-notes'], []);
  const uploadsKey = useMemo(() => ['gov-measurement-uploads'], []);
  const reportSubscriptionsKey = useMemo(() => ['gov-report-subscriptions'], []);
  const reportDispatchKey = useMemo(() => ['gov-report-dispatch-log'], []);
  const policyInsightsKey = useMemo(
    () => ['gov-policy-impacts', selectedCity, selectedWindow],
    [selectedCity, selectedWindow],
  );

  const liveMetricsQuery = useQuery({
    queryKey: liveMetricsKey,
    queryFn: async () => {
      const { data, error } = await fetchLiveMetrics(filters);
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    placeholderData: () => queryClient.getQueryData(liveMetricsKey) ?? [],
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const incidentActivityQuery = useQuery({
    queryKey: incidentActivityKey,
    queryFn: async () => {
      const { data, error } = await fetchIncidentActivity();
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const hotspotAlertsQuery = useQuery({
    queryKey: hotspotsKey,
    queryFn: async () => {
      const { data, error } = await fetchHotspotAlerts();
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const historicalQuery = useQuery({
    queryKey: historicalKey,
    queryFn: async () => {
      const { data, error } = await fetchHistoricalSeries({ cityId: selectedCity });
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? {};
        throw err;
      }
      return data ?? {};
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const pollutantBreakdownQuery = useQuery({
    queryKey: pollutantKey,
    queryFn: async () => {
      const { data, error } = await fetchPollutantBreakdown();
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const heatmapQuery = useQuery({
    queryKey: heatmapKey,
    queryFn: async () => {
      const { data, error } = await fetchHeatmapPoints();
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const incidentsQuery = useQuery({
    queryKey: incidentsKey,
    queryFn: async () => {
      const { data, error } = await fetchIncidents();
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const notesQuery = useQuery({
    queryKey: notesKey,
    queryFn: async () => {
      const { data, error } = await fetchGovernmentNotes();
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const uploadsQuery = useQuery({
    queryKey: uploadsKey,
    queryFn: async () => {
      const { data, error } = await fetchMeasurementUploads();
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const policyInsightsQuery = useQuery({
    queryKey: policyInsightsKey,
    queryFn: async () => {
      const { data, error } = await fetchPolicyImpacts({ cityId: selectedCity, window: selectedWindow });
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleUpdate = (event) => {
      const detail = event?.detail ?? {};
      setMapboxGuardrail((previous) => ({
        monthKey: detail.monthKey ?? previous?.monthKey ?? getGuardrailMonthKey(),
        loads: Number.isFinite(detail.loads) ? detail.loads : Number.isFinite(previous?.loads) ? previous.loads : 0,
        remaining: typeof detail.remaining === 'number' ? detail.remaining : previous?.remaining ?? null,
        reason: detail.reason ?? previous?.reason ?? 'unknown',
        maxMonthlyLoads: typeof detail.maxMonthlyLoads === 'number' ? detail.maxMonthlyLoads : previous?.maxMonthlyLoads ?? null,
        canUseMap: typeof detail.canUseMap === 'boolean' ? detail.canUseMap : previous?.canUseMap ?? true,
      }));
    };

    const snapshot = readGuardrailSnapshot();
    if (snapshot) {
      setMapboxGuardrail(snapshot);
    }

    window.addEventListener(MAPBOX_GUARDRAIL_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(MAPBOX_GUARDRAIL_EVENT, handleUpdate);
    };
  }, []);

  const reportSubscriptionsQuery = useQuery({
    queryKey: reportSubscriptionsKey,
    queryFn: async () => {
      const { data, error } = await fetchReportSubscriptions({ limit: 20 });
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const reportDispatchLogQuery = useQuery({
    queryKey: reportDispatchKey,
    queryFn: async () => {
      const { data, error } = await fetchReportDispatchLog({ limit: 40 });
      if (error) {
        const err = new Error(error);
        err.fallbackData = data ?? [];
        throw err;
      }
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const liveMetrics = useMemo(
    () => liveMetricsQuery.data ?? liveMetricsQuery.error?.fallbackData ?? [],
    [liveMetricsQuery.data, liveMetricsQuery.error],
  );
  const incidentActivity = useMemo(
    () => incidentActivityQuery.data ?? incidentActivityQuery.error?.fallbackData ?? [],
    [incidentActivityQuery.data, incidentActivityQuery.error],
  );
  const incidentActivityByIncident = useMemo(
    () => incidentActivity.reduce((acc, entry) => {
      const key = entry.incident_id ?? 'unassigned';
      acc[key] = acc[key] ? [...acc[key], entry] : [entry];
      return acc;
    }, {}),
    [incidentActivity],
  );
  const hotspotAlerts = useMemo(
    () => hotspotAlertsQuery.data ?? hotspotAlertsQuery.error?.fallbackData ?? [],
    [hotspotAlertsQuery.data, hotspotAlertsQuery.error],
  );
  const historicalSeries = useMemo(
    () => historicalQuery.data ?? historicalQuery.error?.fallbackData ?? {},
    [historicalQuery.data, historicalQuery.error],
  );
  const pollutantBreakdown = useMemo(
    () => pollutantBreakdownQuery.data ?? pollutantBreakdownQuery.error?.fallbackData ?? [],
    [pollutantBreakdownQuery.data, pollutantBreakdownQuery.error],
  );
  const heatmapPoints = useMemo(
    () => heatmapQuery.data ?? heatmapQuery.error?.fallbackData ?? [],
    [heatmapQuery.data, heatmapQuery.error],
  );
  const incidents = useMemo(
    () => incidentsQuery.data ?? incidentsQuery.error?.fallbackData ?? [],
    [incidentsQuery.data, incidentsQuery.error],
  );
  const notes = useMemo(
    () => notesQuery.data ?? notesQuery.error?.fallbackData ?? [],
    [notesQuery.data, notesQuery.error],
  );
  const measurementUploads = useMemo(
    () => uploadsQuery.data ?? uploadsQuery.error?.fallbackData ?? [],
    [uploadsQuery.data, uploadsQuery.error],
  );
  const policyInsights = useMemo(
    () => policyInsightsQuery.data ?? policyInsightsQuery.error?.fallbackData ?? [],
    [policyInsightsQuery.data, policyInsightsQuery.error],
  );
  const reportSubscriptions = useMemo(
    () => reportSubscriptionsQuery.data ?? reportSubscriptionsQuery.error?.fallbackData ?? [],
    [reportSubscriptionsQuery.data, reportSubscriptionsQuery.error],
  );
  const reportDispatchLog = useMemo(
    () => reportDispatchLogQuery.data ?? reportDispatchLogQuery.error?.fallbackData ?? [],
    [reportDispatchLogQuery.data, reportDispatchLogQuery.error],
  );

  const dispatchBySubscription = useMemo(() => reportDispatchLog.reduce((acc, entry) => {
    const key = entry.subscriptionId ?? entry.summary?.subscription?.id;
    if (!key) {
      return acc;
    }
    const current = acc[key];
    if (!current || new Date(entry.createdAt ?? 0).getTime() > new Date(current.createdAt ?? 0).getTime()) {
      acc[key] = entry;
    }
    return acc;
  }, {}), [reportDispatchLog]);

  const scheduledReports = useMemo(() => {
    const base = reportSubscriptions.length
      ? reportSubscriptions
      : reportDispatchLog.map((entry) => ({
        id: entry.subscriptionId ?? entry.id,
        name: entry.summary?.subscription?.name ?? 'Automated Dispatch',
        cadence: entry.summary?.subscription?.cadence ?? 'Scheduled',
        audience: entry.audience ?? 'Unassigned',
        status: entry.status ?? 'queued',
        lastRunAt: entry.createdAt ?? null,
        lastStatus: entry.status ?? null,
      }));

    return base.map((subscription) => {
      const latest = dispatchBySubscription[subscription.id];
      return {
        ...subscription,
        lastRunAt: subscription.lastRunAt ?? latest?.createdAt ?? null,
        lastStatus: subscription.lastStatus ?? latest?.status ?? subscription.status,
        lastDeliveredAt: latest?.deliveredAt ?? null,
        lastError: latest?.errorMessage ?? null,
      };
    });
  }, [dispatchBySubscription, reportDispatchLog, reportSubscriptions]);

  const systemAlerts = useMemo(() => {
    const alerts = [];

    const appendError = (query, id, message) => {
      if (query?.error) {
        alerts.push({
          id,
          level: 'warning',
          message,
          detail: query.error.message ?? null,
        });
      }
    };

    appendError(liveMetricsQuery, 'live-metrics-error', 'Live monitoring data is temporarily falling back to cached values.');
    appendError(historicalQuery, 'historical-error', 'Historical trend series failed to refresh from Supabase. Showing last known data.');
    appendError(heatmapQuery, 'heatmap-error', 'Heatmap layer did not load from Supabase storage.');
    appendError(reportSubscriptionsQuery, 'report-subscriptions-error', 'Unable to load scheduled report subscriptions.');
    appendError(reportDispatchLogQuery, 'report-dispatch-error', 'Dispatch log failed to sync; recent deliveries may be missing.');

    if (mapboxGuardrail) {
      const maxLoads = typeof mapboxGuardrail.maxMonthlyLoads === 'number' && mapboxGuardrail.maxMonthlyLoads > 0
        ? mapboxGuardrail.maxMonthlyLoads
        : 1000;
      const remainingLoads = typeof mapboxGuardrail.remaining === 'number'
        ? mapboxGuardrail.remaining
        : null;
      const usedLoads = remainingLoads != null ? Math.max(0, maxLoads - remainingLoads) : mapboxGuardrail.loads ?? 0;

      if (mapboxGuardrail.reason === 'quota-exceeded') {
        alerts.push({
          id: 'mapbox-quota-exceeded',
          level: 'critical',
          message: 'Mapbox interactive map is paused: monthly free-tier allocation exhausted. Static overview will remain active until the next reset.',
          detail: `Loads used this cycle: ${usedLoads} / ${maxLoads}.`,
        });
      } else if (mapboxGuardrail.reason === 'save-data') {
        alerts.push({
          id: 'mapbox-save-data',
          level: 'info',
          message: 'Browser data-saver mode is disabling Mapbox tiles for some operators.',
          detail: 'Ask users to disable data-saving to re-enable the interactive map.',
        });
      } else if (remainingLoads != null && remainingLoads <= Math.max(20, Math.ceil(maxLoads * 0.1))) {
        alerts.push({
          id: 'mapbox-budget-low',
          level: 'warning',
          message: 'Mapbox free-tier budget is running low.',
          detail: `Loads used: ${usedLoads} / ${maxLoads}. Remaining: ${remainingLoads}.`,
        });
      }
    }

    return alerts;
  }, [heatmapQuery, historicalQuery, liveMetricsQuery, mapboxGuardrail, reportDispatchLogQuery, reportSubscriptionsQuery]);

  useEffect(() => {
    if (liveMetricsQuery.dataUpdatedAt) {
      setLastUpdated(new Date().toISOString());
    }
  }, [liveMetricsQuery.dataUpdatedAt]);

  useEffect(() => {
    const unsubscribe = subscribeToLiveMetrics({
      onTick: (payload) => {
        setLastUpdated(new Date().toISOString());
        queryClient.setQueryData(liveMetricsKey, (previous = []) => {
          if (filters.search || (filters.pollutant && filters.pollutant !== 'all') || (filters.status && filters.status !== 'all')) {
            return previous ?? payload;
          }
          return payload;
        });
      },
    });

    return () => {
      unsubscribe?.();
    };
  }, [filters.pollutant, filters.search, filters.status, liveMetricsKey, queryClient]);

  const recordUploadMutation = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await recordMeasurementUpload({
        ...payload,
        createdBy: user?.id ?? null,
      });
      if (error) {
        const err = new Error(error);
        if (data) {
          err.optimisticRecord = data;
        }
        throw err;
      }
      return data;
    },
    onMutate: async (variables) => {
      setUploadError(null);
      await queryClient.cancelQueries({ queryKey: uploadsKey });
      const previous = queryClient.getQueryData(uploadsKey) ?? [];
      const optimisticEntry = {
        id: `pending-${Date.now()}`,
        filename: variables.filename,
        status: variables.rejectedRows ? 'partial' : 'queued',
        totalRows: variables.totalRows,
        acceptedRows: variables.acceptedRows,
        rejectedRows: variables.rejectedRows,
        summary: variables.summary,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };
      queryClient.setQueryData(uploadsKey, (current = []) => [optimisticEntry, ...current]);
      return { previous };
    },
    onError: (error, _variables, context) => {
      setUploadError(error?.message ?? 'Failed to record upload.');
      if (context?.previous) {
        queryClient.setQueryData(uploadsKey, context.previous);
      }
      if (error?.optimisticRecord) {
        queryClient.setQueryData(uploadsKey, (current = []) => [error.optimisticRecord, ...current]);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(uploadsKey, (current = []) => {
        const remainder = current.filter((item) => item.optimistic !== true && item.id !== data.id);
        return [data, ...remainder];
      });
      setUploadError(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: uploadsKey });
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: createIncident,
    onSuccess: ({ data }) => {
      if (!data) return;
      queryClient.setQueryData(incidentsKey, (previous = []) => [data, ...previous.filter((item) => item.id !== data.id)]);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: incidentsKey });
      queryClient.invalidateQueries({ queryKey: incidentActivityKey });
    },
  });

  const updateIncidentMutation = useMutation({
    mutationFn: updateIncidentStatus,
    onSuccess: ({ data }) => {
      if (!data) return;
      queryClient.setQueryData(incidentsKey, (previous = []) =>
        previous.map((item) => (item.id === data.id ? { ...item, ...data } : item)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: incidentsKey });
      queryClient.invalidateQueries({ queryKey: incidentActivityKey });
    },
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: deleteIncident,
    onSuccess: (_, id) => {
      queryClient.setQueryData(incidentsKey, (previous = []) => previous.filter((item) => item.id !== id));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: incidentsKey });
      queryClient.invalidateQueries({ queryKey: incidentActivityKey });
    },
  });

  const createReportSubscriptionMutation = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await createReportSubscription({
        ...payload,
        createdBy: user?.id ?? null,
      });
      if (error) {
        throw new Error(error);
      }
      return data;
    },
    onSuccess: (data) => {
      if (!data) {
        return;
      }
      queryClient.setQueryData(reportSubscriptionsKey, (previous = []) => {
        const filtered = previous.filter((item) => item.id !== data.id);
        return [data, ...filtered];
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reportSubscriptionsKey });
      queryClient.invalidateQueries({ queryKey: reportDispatchKey });
    },
  });

  const scheduleReport = useCallback(async (payload) => {
    const result = await createReportSubscriptionMutation.mutateAsync(payload);
    return result ?? null;
  }, [createReportSubscriptionMutation]);

  const resetScheduleReportError = useCallback(() => {
    createReportSubscriptionMutation.reset();
  }, [createReportSubscriptionMutation]);

  const createNewIncident = useCallback(async (payload) => {
    const now = new Date().toISOString();
    const incident = {
      id:
        payload.id
        ?? (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `incident-${Date.now()}`),
      title: payload.title,
      severity: payload.severity,
      summary: payload.summary,
      tags: payload.tags ?? [],
      status: payload.status ?? 'open',
      assignedTo: payload.assignedTo ?? 'Operations',
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id ?? null,
    };

    await createIncidentMutation.mutateAsync(incident);

    const actorId = user?.id ?? null;
    const actorRole = profile?.role ?? user?.role ?? null;
    await Promise.all([
      recordIncidentEvent({
        incidentId: incident.id,
        action: 'incident_created',
        actorId,
        actorRole,
        metadata: { severity: incident.severity, tags: incident.tags },
      }),
      logAccessGranted({
        route: 'government/incidents',
        userId: actorId,
        role: actorRole,
        details: { action: 'create', incidentId: incident.id },
      }),
    ]);
  }, [createIncidentMutation, profile?.role, user?.id, user?.role]);

  const updateIncident = useCallback(async ({ id, status }) => {
    await updateIncidentMutation.mutateAsync({ id, status });

    const actorId = user?.id ?? null;
    const actorRole = profile?.role ?? user?.role ?? null;
    await Promise.all([
      recordIncidentEvent({
        incidentId: id,
        action: 'incident_status_updated',
        actorId,
        actorRole,
        metadata: { status },
      }),
      logAccessGranted({
        route: 'government/incidents',
        userId: actorId,
        role: actorRole,
        details: { action: 'update', incidentId: id, status },
      }),
    ]);
  }, [profile?.role, updateIncidentMutation, user?.id, user?.role]);

  const removeIncident = useCallback(async (id) => {
    await deleteIncidentMutation.mutateAsync(id);

    const actorId = user?.id ?? null;
    const actorRole = profile?.role ?? user?.role ?? null;
    await Promise.all([
      recordIncidentEvent({
        incidentId: id,
        action: 'incident_deleted',
        actorId,
        actorRole,
        metadata: {},
      }),
      logSecurityIncident({
        route: 'government/incidents',
        userId: actorId,
        role: actorRole,
        details: { action: 'delete', incidentId: id },
      }),
    ]);
  }, [deleteIncidentMutation, profile?.role, user?.id, user?.role]);

  const submitMeasurementUpload = useCallback(async ({ file, records } = {}) => {
    setIsRecordingUpload(true);
    setUploadError(null);
    setLastUploadSummary(null);

    try {
      const analysis = await analyzeUploadPayload({ file, records });
      const filename = file?.name ?? `manual-upload-${new Date().toISOString()}`;

      const recorded = await recordUploadMutation.mutateAsync({
        filename,
        totalRows: analysis.totalRows,
        acceptedRows: analysis.acceptedRows.length,
        rejectedRows: analysis.rejectedRows.length,
        summary: analysis.summary,
      });

      const summaryDetails = {
        ...analysis,
        filename: recorded?.filename ?? filename,
        status: recorded?.status ?? (analysis.rejectedRows.length ? 'partial' : 'queued'),
        createdAt: recorded?.createdAt ?? new Date().toISOString(),
      };

      setLastUploadSummary(summaryDetails);

      const actorId = user?.id ?? null;
      const actorRole = profile?.role ?? user?.role ?? null;
      await Promise.allSettled([
        logAccessGranted({
          route: 'government/uploads',
          userId: actorId,
          role: actorRole,
          details: {
            filename: summaryDetails.filename,
            totalRows: analysis.totalRows,
            acceptedRows: analysis.acceptedRows.length,
            rejectedRows: analysis.rejectedRows.length,
          },
        }),
        analysis.rejectedRows.length
          ? logSecurityIncident({
              route: 'government/uploads',
              userId: actorId,
              role: actorRole,
              details: {
                filename: summaryDetails.filename,
                issues: analysis.issues,
              },
            })
          : Promise.resolve(),
      ]);

      return summaryDetails;
    } catch (error) {
      setIsRecordingUpload(false);
      const message = error?.message ?? 'Failed to process measurement upload.';
      setUploadError(message);
      throw error;
    } finally {
      setIsRecordingUpload(false);
    }
  }, [profile?.role, recordUploadMutation, user?.id, user?.role]);

  const exportReport = useCallback(({ format, rows }) => {
    if (!rows?.length) {
      return;
    }
    if (format === 'json') {
      triggerDownload('government-report.json', buildJson(rows), 'application/json');
    } else {
      triggerDownload('government-report.csv', buildCsv(rows), 'text/csv');
    }
  }, []);

  const pollutantCharts = useMemo(() => {
    const topThree = pollutantBreakdown.slice(0, 3);
    const othersShare = pollutantBreakdown.slice(3).reduce((sum, item) => sum + item.share, 0);
    return {
      segments: [
        ...topThree.map((item) => ({ name: item.pollutant, value: item.share })),
        { name: 'Others', value: Math.max(0, 100 - topThree.reduce((sum, item) => sum + item.share, 0) - othersShare) },
      ],
      table: pollutantBreakdown,
    };
  }, [pollutantBreakdown]);

  const historicalHighlights = useMemo(
    () => buildHighlights(historicalSeries, selectedWindow),
    [historicalSeries, selectedWindow],
  );

  const intelligenceCards = useMemo(() => {
    const [dominant, secondary] = pollutantBreakdown;
    const hotspot = liveMetrics[0];
    return [
      dominant
        ? {
            title: 'Dominant Pollutant',
            value: dominant.pollutant,
            meta: `Observed across ${dominant.share}% of network`,
            chip: dominant.classification,
          }
        : {
            title: 'Dominant Pollutant',
            value: 'Pending',
            meta: 'Awaiting aggregated samples',
          },
      secondary
        ? {
            title: 'Secondary Pollutant',
            value: secondary.pollutant,
            meta: `Share ${secondary.share}% · ${secondary.classification}`,
            chip: 'Emerging',
          }
        : {
            title: 'Secondary Pollutant',
            value: '—',
            meta: 'Requires additional telemetries',
          },
      hotspot
        ? {
            title: 'Current Hotspot',
            value: hotspot.city,
            meta: `AQI ${hotspot.aqi} · ${hotspot.status}`,
            chip: hotspot.dominantPollutant,
          }
        : {
            title: 'Current Hotspot',
            value: 'No critical nodes',
            meta: 'Monitoring stable across network',
          },
    ];
  }, [liveMetrics, pollutantBreakdown]);

  const combinedError = liveMetricsQuery.error
    ?? historicalQuery.error
    ?? pollutantBreakdownQuery.error
    ?? heatmapQuery.error
    ?? incidentsQuery.error
    ?? hotspotAlertsQuery.error
    ?? incidentActivityQuery.error
    ?? notesQuery.error
    ?? uploadsQuery.error
    ?? policyInsightsQuery.error
    ?? reportSubscriptionsQuery.error
    ?? reportDispatchLogQuery.error
    ?? null;

  const isLoading =
    liveMetricsQuery.isPending
    || historicalQuery.isPending
    || pollutantBreakdownQuery.isPending
    || heatmapQuery.isPending
    || incidentsQuery.isPending
    || hotspotAlertsQuery.isPending
    || incidentActivityQuery.isPending
    || notesQuery.isPending
    || uploadsQuery.isPending
    || policyInsightsQuery.isPending
    || reportSubscriptionsQuery.isPending
    || reportDispatchLogQuery.isPending;

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: liveMetricsKey });
    queryClient.invalidateQueries({ queryKey: hotspotsKey });
    queryClient.invalidateQueries({ queryKey: policyInsightsKey });
    queryClient.invalidateQueries({ queryKey: reportSubscriptionsKey });
    queryClient.invalidateQueries({ queryKey: reportDispatchKey });
  }, [hotspotsKey, liveMetricsKey, policyInsightsKey, queryClient, reportDispatchKey, reportSubscriptionsKey]);

  const selectWindow = useCallback((window) => {
    setSelectedWindow(window);
  }, []);

  const selectCity = useCallback((cityId) => {
    setSelectedCity(cityId);
  }, []);

  return {
    filters,
    isLoading,
    error: combinedError?.message ?? null,
    liveMetrics,
    lastUpdated,
    selectedWindow,
    selectedCity,
    historicalSeries,
    historicalHighlights,
    pollutantBreakdown: pollutantCharts,
    heatmapPoints,
    hotspotAlerts,
    incidents,
    incidentActivity,
    incidentActivityByIncident,
    notes,
    measurementUploads,
    lastUploadSummary,
    uploadError,
    intelligenceCards,
    policyInsights,
    scheduledReports,
    reportDispatchLog,
    systemAlerts,
    mapboxGuardrail,
    reportFormat,
    scheduleReport,
    isSchedulingReport: createReportSubscriptionMutation.isPending,
    scheduleReportError: createReportSubscriptionMutation.error?.message ?? null,
    resetScheduleReportError,
    setFilters: (updates) => setFilterState((prev) => ({ ...prev, ...updates })),
    refresh,
    selectWindow,
    selectCity,
    loadHistoricalSeries: () => historicalQuery.refetch(),
    createIncident: createNewIncident,
    updateIncident,
    removeIncident,
    submitMeasurementUpload,
    isRecordingUpload,
    exportReport,
    setReportFormat,
  };
};

export default useGovernmentDashboardData;
