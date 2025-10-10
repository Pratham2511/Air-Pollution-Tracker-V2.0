/* global globalThis */

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_IP_ENDPOINT = 'https://ipwho.is/?fields=latitude,longitude,city,success';

const normalizeLocation = (payload, overrides = {}) => ({
  lat: Number(payload.lat),
  lng: Number(payload.lng),
  label: payload.label ?? null,
  accuracy: payload.accuracy ?? null,
  source: payload.source ?? 'unknown',
  ...overrides,
});

export const getBrowserLocation = ({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    const error = new Error('Geolocation API not available');
    error.code = 'UNSUPPORTED';
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(
          normalizeLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps',
          }),
        );
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      },
    );
  });
};

export const lookupIpLocation = async ({
  fetchImpl = globalThis.fetch,
  endpoint = DEFAULT_IP_ENDPOINT,
  signal,
} = {}) => {
  if (!fetchImpl) {
    const error = new Error('Fetch implementation not available');
    error.code = 'FETCH_UNAVAILABLE';
    throw error;
  }

  const response = await fetchImpl(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`IP lookup failed: ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.success) {
    throw new Error('IP lookup did not return a successful response');
  }

  return normalizeLocation({
    lat: payload.latitude,
    lng: payload.longitude,
    label: payload.city ?? null,
    source: 'ip',
  });
};

export const resolveUserLocation = async ({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl,
  signal,
} = {}) => {
  let preciseError = null;
  try {
    const preciseLocation = await getBrowserLocation({ timeoutMs });
    return {
      location: preciseLocation,
      fallback: false,
      error: null,
      details: null,
    };
  } catch (error) {
    preciseError = error;
  }

  try {
    const approximateLocation = await lookupIpLocation({ fetchImpl, signal });
    return {
      location: approximateLocation,
      fallback: true,
      error: preciseError?.code === 1
        ? 'Location permission denied. Showing approximate location instead.'
        : 'Using approximate location based on network information.',
      details: preciseError?.message ?? null,
    };
  } catch (fallbackError) {
    return {
      location: null,
      fallback: true,
      error: preciseError?.code === 'UNSUPPORTED'
        ? 'Automatic location is unavailable on this device.'
        : 'Unable to determine your location automatically. Please select a city manually.',
      details: fallbackError?.message ?? preciseError?.message ?? null,
    };
  }
};

export default {
  getBrowserLocation,
  lookupIpLocation,
  resolveUserLocation,
};
