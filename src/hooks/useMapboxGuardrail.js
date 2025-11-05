import { useCallback, useEffect, useMemo, useState } from 'react';

export const MAPBOX_GUARDRAIL_STORAGE_KEY = 'apt_mapbox_usage';
export const MAPBOX_GUARDRAIL_EVENT = 'mapbox-guardrail:update';
const STORAGE_KEY = MAPBOX_GUARDRAIL_STORAGE_KEY;
const DEFAULT_MAX_MONTHLY_LOADS = 1000; // Protect free tier (50k) with comfortable headroom.

const getMonthKey = () => {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${now.getUTCFullYear()}-${month}`;
};

const detectSaveData = () => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return Boolean(connection?.saveData);
};

const readStoredUsage = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    return existing ? JSON.parse(existing) : {};
  } catch (error) {
    return {};
  }
};

const writeStoredUsage = (monthKey, loads) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const existing = readStoredUsage();
    const updated = { ...existing, [monthKey]: loads };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    // Swallow storage write errors (private browsing, quota, etc.).
  }
};

export const useMapboxGuardrail = ({
  isEnabled = true,
  maxMonthlyLoads = DEFAULT_MAX_MONTHLY_LOADS,
} = {}) => {
  const initialMonthKey = useMemo(() => getMonthKey(), []);
  const [usage, setUsage] = useState(() => ({
    monthKey: initialMonthKey,
    loads: 0,
    hasSaveData: detectSaveData(),
  }));

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') {
      return;
    }

    const monthKey = getMonthKey();
    const storedUsage = readStoredUsage();
    const storedLoads = Number.isFinite(storedUsage[monthKey]) ? storedUsage[monthKey] : 0;

    setUsage((prev) => ({
      ...prev,
      monthKey,
      loads: storedLoads,
      hasSaveData: detectSaveData(),
    }));
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled || typeof navigator === 'undefined') {
      return undefined;
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection || typeof connection.addEventListener !== 'function') {
      return undefined;
    }

    const handleChange = () => {
      setUsage((prev) => ({
        ...prev,
        hasSaveData: detectSaveData(),
      }));
    };

    connection.addEventListener('change', handleChange);

    return () => {
      connection.removeEventListener('change', handleChange);
    };
  }, [isEnabled]);

  const resetUsage = useCallback(() => {
    if (!isEnabled) {
      return;
    }

    const monthKey = getMonthKey();
    writeStoredUsage(monthKey, 0);
  setUsage({ monthKey, loads: 0, hasSaveData: detectSaveData() });
  }, [isEnabled]);

  const registerLoad = useCallback(() => {
    if (!isEnabled) {
      return;
    }

    setUsage((prev) => {
      const monthKey = getMonthKey();
      const loadsForMonth = prev.monthKey === monthKey ? prev.loads : 0;
      const updatedLoads = Math.min(loadsForMonth + 1, maxMonthlyLoads + 1);

      writeStoredUsage(monthKey, updatedLoads);

      return {
        monthKey,
        loads: updatedLoads,
        hasSaveData: prev.hasSaveData,
      };
    });
  }, [isEnabled, maxMonthlyLoads]);

  const canUseMap = !isEnabled
    ? true
    : !usage.hasSaveData && usage.loads < maxMonthlyLoads;

  const remaining = !isEnabled
    ? Infinity
    : Math.max(0, maxMonthlyLoads - usage.loads);

  const reason = !isEnabled
    ? 'disabled'
    : usage.hasSaveData
      ? 'save-data'
      : usage.loads >= maxMonthlyLoads
        ? 'quota-exceeded'
        : 'ok';

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') {
      return;
    }

    const detail = {
      monthKey: usage.monthKey,
      loads: usage.loads,
      remaining,
      reason,
      canUseMap,
      maxMonthlyLoads,
      hasSaveData: usage.hasSaveData,
    };

    window.dispatchEvent(new CustomEvent(MAPBOX_GUARDRAIL_EVENT, { detail }));
  }, [canUseMap, isEnabled, maxMonthlyLoads, reason, remaining, usage.hasSaveData, usage.loads, usage.monthKey]);

  return {
    canUseMap,
    registerLoad,
    remaining,
    reason,
    maxMonthlyLoads,
    hasSaveDataEnabled: usage.hasSaveData,
    resetUsage,
  };
};

export default useMapboxGuardrail;
