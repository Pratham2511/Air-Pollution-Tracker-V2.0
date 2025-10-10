import { buildCityAnalysisFallback } from './analysisFallback';

let workerInstance = null;
let requestId = 0;
const pendingRequests = new Map();
const TIMEOUT_MS = 5000;

const resetWorker = () => {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }

  pendingRequests.forEach(({ reject, timer }) => {
    clearTimeout(timer);
    if (reject) {
      reject(new Error('City analysis worker reset'));
    }
  });
  pendingRequests.clear();
};

const ensureWorker = () => {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  if (workerInstance) {
    return workerInstance;
  }

  try {
    workerInstance = new Worker(new URL('../workers/cityAnalysisWorker.js', import.meta.url), {
      type: 'module',
    });

    workerInstance.onmessage = (event) => {
      const { id, status, data, error } = event.data ?? {};
      if (!id || !pendingRequests.has(id)) {
        return;
      }

      const { resolve, reject, timer } = pendingRequests.get(id);
      clearTimeout(timer);
      pendingRequests.delete(id);

      if (status === 'success') {
        resolve(data);
      } else {
        reject(new Error(error ?? 'City analysis worker failed')); 
      }
    };

    workerInstance.onerror = (errorEvent) => {
      const message = errorEvent?.message ?? 'City analysis worker encountered an error';
      pendingRequests.forEach(({ reject, timer }) => {
        clearTimeout(timer);
        if (reject) {
          reject(new Error(message));
        }
      });
      pendingRequests.clear();
      if (workerInstance) {
        workerInstance.terminate();
        workerInstance = null;
      }
    };
  } catch (error) {
    workerInstance = null;
    return null;
  }

  return workerInstance;
};

export const buildCityAnalysisOffthread = async (cityId, windowKey) => {
  const worker = ensureWorker();
  if (!worker) {
    return buildCityAnalysisFallback(cityId, windowKey);
  }

  const id = ++requestId;

  const operation = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pendingRequests.has(id)) {
        const entry = pendingRequests.get(id);
        pendingRequests.delete(id);
        entry?.reject?.(new Error('City analysis worker timed out'));
      }
    }, TIMEOUT_MS);

    pendingRequests.set(id, { resolve, reject, timer });

    worker.postMessage({
      id,
      type: 'buildCityAnalysis',
      payload: {
        cityId,
        windowKey,
      },
    });
  });

  try {
    return await operation;
  } catch (error) {
    resetWorker();
    return buildCityAnalysisFallback(cityId, windowKey);
  }
};
