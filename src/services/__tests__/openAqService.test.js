import { CITY_CATALOG_BY_ID } from '../../data/cityCatalog';
import {
  fetchOpenAqCitySnapshot,
  fetchOpenAqCitySnapshots,
  clearOpenAqCache,
} from '../openAqService';

describe('openAqService', () => {
  const city = CITY_CATALOG_BY_ID.delhi;
  const sampleResponse = {
    results: [
      {
        parameter: 'pm25',
        value: 42.3,
        unit: 'µg/m³',
        date: { utc: '2025-10-10T07:10:00Z' },
      },
      {
        parameter: 'pm25',
        value: 38.1,
        unit: 'µg/m³',
        date: { utc: '2025-10-10T07:50:00Z' },
      },
      {
        parameter: 'pm10',
        value: 78.4,
        unit: 'µg/m³',
        date: { utc: '2025-10-10T07:40:00Z' },
      },
      {
        parameter: 'o3',
        value: 55.2,
        unit: 'µg/m³',
        date: { utc: '2025-10-10T07:35:00Z' },
      },
    ],
  };

  beforeEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
  });

  it('computes snapshot metrics from OpenAQ measurements', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleResponse),
    });

    const snapshot = await fetchOpenAqCitySnapshot(city, { fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(snapshot).toBeTruthy();
    expect(snapshot.id).toBe(city.id);
    expect(snapshot.aqi).toBeGreaterThan(0);
    expect(snapshot.dominantPollutant).toBeDefined();
    expect(snapshot.pollutants['PM2.5']).toMatch(/µg\/m³/);

    // subsequent call should use cache
    const cachedSnapshot = await fetchOpenAqCitySnapshot(city, { fetchImpl: fetchMock });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cachedSnapshot.aqi).toEqual(snapshot.aqi);
  });

  it('returns null when fetch fails and logs warning', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network error'));
    const result = await fetchOpenAqCitySnapshot(city, { fetchImpl: fetchMock });
    expect(result).toBeNull();
  });

  it('aggregates multiple city requests with filtering', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleResponse),
    });

    const snapshots = await fetchOpenAqCitySnapshots([city, CITY_CATALOG_BY_ID.mumbai], { fetchImpl: fetchMock });
    expect(fetchMock).toHaveBeenCalled();
    expect(snapshots.length).toBeGreaterThan(0);
  });

  it('clears cache entries', async () => {
    window.localStorage.setItem('aqt::openaq::city@v1:delhi', JSON.stringify({
      payload: { id: 'delhi' },
      expiresAt: Date.now() + 1000,
    }));

    clearOpenAqCache('delhi');
    expect(window.localStorage.getItem('aqt::openaq::city@v1:delhi')).toBeNull();
  });
});
