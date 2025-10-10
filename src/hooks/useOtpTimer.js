import { useCallback, useEffect, useRef, useState } from 'react';

const OTP_DURATION_SECONDS = 300;

const readPersistedExpiry = (storageKey) => {
  if (!storageKey || typeof window === 'undefined') {
    return { remaining: 0, expiryTimestamp: null };
  }
  const rawExpiry = window.sessionStorage.getItem(storageKey);
  if (!rawExpiry) {
    return { remaining: 0, expiryTimestamp: null };
  }
  const expiryTimestamp = Number(rawExpiry);
  if (!Number.isFinite(expiryTimestamp)) {
    return { remaining: 0, expiryTimestamp: null };
  }
  const delta = Math.floor((expiryTimestamp - Date.now()) / 1000);
  return {
    remaining: delta > 0 ? delta : 0,
    expiryTimestamp: delta > 0 ? expiryTimestamp : null,
  };
};

export const useOtpTimer = (storageKey) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const { remaining } = readPersistedExpiry(storageKey);
    return remaining;
  });
  const intervalRef = useRef(null);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearPersistedExpiry = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const persistExpiry = useCallback(
    (expiryTimestamp) => {
      if (storageKey && typeof window !== 'undefined') {
        window.sessionStorage.setItem(storageKey, String(expiryTimestamp));
      }
    },
    [storageKey],
  );

  const beginCountdown = useCallback(
    (initialRemaining, expiryTimestamp) => {
      stopInterval();
      if (expiryTimestamp) {
        persistExpiry(expiryTimestamp);
      }
      setRemainingSeconds(initialRemaining);
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            stopInterval();
            clearPersistedExpiry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [stopInterval, persistExpiry, clearPersistedExpiry],
  );

  const start = useCallback(() => {
    const expiryTimestamp = Date.now() + OTP_DURATION_SECONDS * 1000;
    beginCountdown(OTP_DURATION_SECONDS, expiryTimestamp);
  }, [beginCountdown]);

  const reset = useCallback(() => {
    stopInterval();
    clearPersistedExpiry();
    setRemainingSeconds(0);
  }, [stopInterval, clearPersistedExpiry]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') {
      return;
    }
  const { remaining: storedRemaining, expiryTimestamp } = readPersistedExpiry(storageKey);
    if (storedRemaining > 0 && expiryTimestamp) {
      beginCountdown(storedRemaining, expiryTimestamp);
    } else if (!expiryTimestamp) {
      clearPersistedExpiry();
    }
  }, [storageKey, beginCountdown, clearPersistedExpiry]);

  useEffect(() => () => stopInterval(), [stopInterval]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return {
    remaining: remainingSeconds,
    formatted,
    isRunning: remainingSeconds > 0,
    start,
    reset,
  };
};
