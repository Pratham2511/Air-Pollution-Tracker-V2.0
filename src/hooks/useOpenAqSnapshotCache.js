import { useCallback, useMemo } from 'react';
import { usePersistentState } from './usePersistentState';

const STORAGE_KEY = 'aq-openaq-snapshots';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

const isEntryValid = (entry, ttlMs) => {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const { cachedAt } = entry;
  if (!cachedAt) {
    return false;
  }

  return Date.now() - cachedAt <= ttlMs;
};

export const useOpenAqSnapshotCache = (ttlMs = DEFAULT_TTL_MS) => {
  const [cache, setCache] = usePersistentState(STORAGE_KEY, {});

  const normalizedCache = useMemo(() => (cache && typeof cache === 'object' ? cache : {}), [cache]);

  const getCachedSnapshots = useCallback(
    (cityIds = []) => {
      if (!Array.isArray(cityIds) || cityIds.length === 0) {
        return [];
      }

      return cityIds
        .map((cityId) => {
          const entry = normalizedCache[cityId];
          if (!isEntryValid(entry, ttlMs)) {
            return null;
          }
          return entry.snapshot;
        })
        .filter(Boolean);
    },
    [normalizedCache, ttlMs],
  );

  const storeSnapshots = useCallback(
    (snapshots = []) => {
      if (!Array.isArray(snapshots) || snapshots.length === 0) {
        return;
      }

      const now = Date.now();
      setCache((prevCache) => {
        const nextCache = { ...(prevCache && typeof prevCache === 'object' ? prevCache : {}) };

        snapshots.forEach((snapshot) => {
          if (!snapshot?.id) {
            return;
          }

          nextCache[snapshot.id] = {
            snapshot,
            cachedAt: now,
          };
        });

        return nextCache;
      });
    },
    [setCache],
  );

  const clearSnapshot = useCallback(
    (cityId) => {
      if (!cityId) {
        return;
      }

      setCache((prevCache) => {
        if (!prevCache || typeof prevCache !== 'object' || !prevCache[cityId]) {
          return prevCache;
        }

        const nextCache = { ...prevCache };
        delete nextCache[cityId];
        return nextCache;
      });
    },
    [setCache],
  );

  const pruneExpiredSnapshots = useCallback(() => {
    setCache((prevCache) => {
      if (!prevCache || typeof prevCache !== 'object') {
        return prevCache;
      }

      const entries = Object.entries(prevCache);
      const nextCache = entries.reduce((accumulator, [cityId, entry]) => {
        if (isEntryValid(entry, ttlMs)) {
          accumulator[cityId] = entry;
        }
        return accumulator;
      }, {});

      if (entries.length === Object.keys(nextCache).length) {
        return prevCache;
      }

      return nextCache;
    });
  }, [setCache, ttlMs]);

  return {
    getCachedSnapshots,
    storeSnapshots,
    clearSnapshot,
    pruneExpiredSnapshots,
  };
};

export default useOpenAqSnapshotCache;
