import {
  getInitialTrackedCities,
  fetchCityMetrics,
  searchCities,
} from '../dashboardService';
import { CITY_CATALOG } from '../../data/cityCatalog';
import { fetchOpenAqCitySnapshots } from '../openAqService';
import { upsertOpenAqSnapshots } from '../openAqIngestionService';

jest.mock('../openAqService', () => ({
  fetchOpenAqCitySnapshots: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../openAqIngestionService', () => ({
  upsertOpenAqSnapshots: jest.fn(() => Promise.resolve({ error: null, count: 0 })),
}));

describe('dashboardService fallbacks', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns defaults when local storage empty', () => {
    const defaults = getInitialTrackedCities();
    expect(defaults.length).toBeGreaterThan(0);
    defaults.forEach((cityId) => {
      expect(CITY_CATALOG.find((city) => city.id === cityId)).toBeDefined();
    });
  });

  it('fetches metrics from catalog when remote unavailable', async () => {
    fetchOpenAqCitySnapshots.mockResolvedValue([]);
    const defaults = getInitialTrackedCities();
    const { data, error } = await fetchCityMetrics(defaults.slice(0, 3));

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    data.forEach((city) => {
      expect(typeof city.name).toBe('string');
      expect(typeof city.dominantPollutant).toBe('string');
      expect(city.pollutants).toBeDefined();
    });
  });

  it('prefers OpenAQ snapshots when available', async () => {
    const defaults = getInitialTrackedCities();
    fetchOpenAqCitySnapshots.mockResolvedValue([
      {
        ...CITY_CATALOG.find((city) => city.id === defaults[0]),
        id: defaults[0],
        aqi: 175,
        dominantPollutant: 'PM2.5',
        pollutants: { 'PM2.5': '55 µg/m³' },
        updatedAt: '2025-10-10T07:00:00Z',
      },
    ]);

    const { data, error } = await fetchCityMetrics(defaults.slice(0, 2));

    expect(error).toBeNull();
    expect(fetchOpenAqCitySnapshots).toHaveBeenCalled();
    expect(upsertOpenAqSnapshots).not.toHaveBeenCalled();
    const snapshot = data.find((entry) => entry.id === defaults[0]);
    expect(snapshot.aqi).toBe(175);
    expect(snapshot.dominantPollutant).toBe('PM2.5');
  });

  it('upserts OpenAQ snapshots when Supabase credentials exist', async () => {
    const upsertMock = jest.fn(() => Promise.resolve({ error: null, count: 1 }));

    await new Promise((resolve, reject) => {
      jest.resetModules();
      jest.isolateModules(() => {
        try {
          jest.doMock('../openAqService', () => ({
            fetchOpenAqCitySnapshots: jest.fn(() => Promise.resolve([
              {
                id: 'delhi',
                aqi: 190,
                dominantPollutant: 'PM2.5',
                pollutants: { 'PM2.5': '60 µg/m³' },
                updatedAt: '2025-10-10T07:00:00Z',
              },
            ])),
          }));
          jest.doMock('../openAqIngestionService', () => ({
            upsertOpenAqSnapshots: upsertMock,
          }));
          jest.doMock('../supabaseClient', () => ({
            hasSupabaseCredentials: true,
            supabase: {
              from: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            },
          }));

          // eslint-disable-next-line global-require
          const { fetchCityMetrics: fetchWithSupabase } = require('../dashboardService');
          fetchWithSupabase(['delhi'])
            .then(({ data }) => {
              try {
                expect(upsertMock).toHaveBeenCalled();
                expect(data[0].aqi).toBe(190);
                resolve();
              } catch (assertionError) {
                reject(assertionError);
              }
            })
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('searches catalog by name and country', () => {
    const results = searchCities('new delhi');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLowerCase()).toContain('delhi');

    const countryResults = searchCities('canada');
    expect(countryResults.some((city) => city.country === 'Canada')).toBe(true);
  });
});
