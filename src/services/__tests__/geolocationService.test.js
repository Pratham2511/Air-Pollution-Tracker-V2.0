import {
  getBrowserLocation,
  lookupIpLocation,
  resolveUserLocation,
} from '../geolocationService';

describe('geolocationService', () => {
  const originalGeolocation = global.navigator.geolocation;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalGeolocation) {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
      });
    } else {
      delete global.navigator.geolocation;
    }
  });

  describe('getBrowserLocation', () => {
    it('resolves when geolocation is available', async () => {
      const coords = { latitude: 12.34, longitude: 56.78, accuracy: 10 };
      const getCurrentPosition = jest.fn((success) => success({ coords }));
      Object.defineProperty(global.navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });

      const location = await getBrowserLocation();
      expect(location.lat).toBeCloseTo(coords.latitude);
      expect(location.lng).toBeCloseTo(coords.longitude);
      expect(location.source).toBe('gps');
    });
  });

  describe('lookupIpLocation', () => {
    it('fetches IP-based location data', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, latitude: 1, longitude: 2, city: 'Testopolis' }),
      });

      const location = await lookupIpLocation({ fetchImpl: fetchMock });
      expect(fetchMock).toHaveBeenCalled();
      expect(location.lat).toBe(1);
      expect(location.label).toBe('Testopolis');
      expect(location.source).toBe('ip');
    });
  });

  describe('resolveUserLocation', () => {
    it('returns precise location when available', async () => {
      const coords = { latitude: 40.71, longitude: -74.01, accuracy: 5 };
      const getCurrentPosition = jest.fn((success) => success({ coords }));
      Object.defineProperty(global.navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });

      const result = await resolveUserLocation({ fetchImpl: jest.fn() });
      expect(result.location).toBeTruthy();
      expect(result.location.source).toBe('gps');
      expect(result.fallback).toBe(false);
      expect(result.error).toBeNull();
    });

    it('falls back to IP lookup when geolocation denied', async () => {
      const permissionError = { code: 1, message: 'Permission denied' };
      const getCurrentPosition = jest.fn((_, error) => error(permissionError));
      Object.defineProperty(global.navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });

      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, latitude: 10, longitude: 20, city: 'Fallback City' }),
      });

      const result = await resolveUserLocation({ fetchImpl: fetchMock });
      expect(fetchMock).toHaveBeenCalled();
      expect(result.location).toMatchObject({ lat: 10, lng: 20, source: 'ip' });
      expect(result.fallback).toBe(true);
      expect(result.error).toMatch(/permission/i);
    });

    it('returns null when both strategies fail', async () => {
      const getCurrentPosition = jest.fn((_, error) => error(new Error('gps failure')));
      Object.defineProperty(global.navigator, 'geolocation', {
        value: { getCurrentPosition },
        configurable: true,
      });

      const fetchMock = jest.fn().mockRejectedValue(new Error('network fail'));

      const result = await resolveUserLocation({ fetchImpl: fetchMock });
      expect(result.location).toBeNull();
      expect(result.error).toMatch(/unable to determine/i);
    });
  });
});
