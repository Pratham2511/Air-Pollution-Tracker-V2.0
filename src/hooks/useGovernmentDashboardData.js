import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buildCsv,
  buildJson,
  createIncident,
  deleteIncident,
  fetchGovernmentNotes,
  fetchHeatmapPoints,
  fetchHistoricalSeries,
  fetchIncidents,
  fetchHotspotAlerts,
  fetchIncidentActivity,
  fetchLiveMetrics,
  fetchPollutantBreakdown,
  fetchMeasurementUploads,
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

const DEFAULT_FILTERS = {
  search: '',
  pollutant: 'all',
  status: 'all',
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
      const { data, error } = await recordMeasurementUpload(payload);
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

  const scheduledReports = useMemo(
    () => [
      {
        id: 'daily-digest',
        name: 'Daily AQI Digest',
        cadence: '07:00 IST',
        audience: '35 recipients',
        status: 'active',
      },
      {
        id: 'weekly-brief',
        name: 'Weekly Policy Brief',
        cadence: 'Mondays 09:00 IST',
        audience: '12 recipients',
        status: 'queued',
      },
      {
        id: 'incident-escalation',
        name: 'Incident Escalation',
        cadence: 'Triggers when AQI > 350 for 30 mins',
        audience: 'Ops & Command',
        status: 'critical',
      },
    ],
    [],
  );

  const combinedError = liveMetricsQuery.error
    ?? historicalQuery.error
    ?? pollutantBreakdownQuery.error
    ?? heatmapQuery.error
    ?? incidentsQuery.error
    ?? hotspotAlertsQuery.error
    ?? incidentActivityQuery.error
    ?? notesQuery.error
    ?? uploadsQuery.error
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
    || uploadsQuery.isPending;

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: liveMetricsKey });
    queryClient.invalidateQueries({ queryKey: hotspotsKey });
  }, [hotspotsKey, liveMetricsKey, queryClient]);

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
    scheduledReports,
    reportFormat,
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
