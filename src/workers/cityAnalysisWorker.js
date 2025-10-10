/* global globalThis */

import { buildCityAnalysisFallback, normalizeAnalysisWindow } from '../services/analysisFallback';

globalThis.addEventListener('message', (event) => {
  const { id, type, payload } = event.data ?? {};

  if (!id || type !== 'buildCityAnalysis') {
    return;
  }

  try {
    const { cityId, windowKey } = payload ?? {};
    const normalizedWindow = normalizeAnalysisWindow(windowKey ?? '7d');
    const data = buildCityAnalysisFallback(cityId, normalizedWindow);

    globalThis.postMessage({ id, status: 'success', data });
  } catch (error) {
    globalThis.postMessage({
      id,
      status: 'error',
      error: error?.message ?? 'Failed to build city analysis',
    });
  }
});
