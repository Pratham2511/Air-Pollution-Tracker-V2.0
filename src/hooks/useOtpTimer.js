import { useCallback, useEffect, useRef, useState } from 'react';

const OTP_DURATION_SECONDS = 300;

export const useOtpTimer = () => {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setRemaining(OTP_DURATION_SECONDS);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clear();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clear]);

  useEffect(() => () => clear(), [clear]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return {
    remaining,
    formatted,
    isRunning: remaining > 0,
    start,
    reset: clear,
  };
};
