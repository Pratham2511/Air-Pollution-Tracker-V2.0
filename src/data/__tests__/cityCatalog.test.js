import {
  CITY_CATALOG,
  CITY_CATALOG_BY_ID,
  DEFAULT_TRACKED_CITY_IDS,
  getRandomCitySample,
} from '../cityCatalog';

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

describe('cityCatalog dataset', () => {
  it('contains at least 200 unique cities with coordinates', () => {
    expect(CITY_CATALOG.length).toBeGreaterThanOrEqual(200);

    const ids = new Set();
    CITY_CATALOG.forEach((city) => {
      expect(isFiniteNumber(city.lat)).toBe(true);
      expect(isFiniteNumber(city.lng)).toBe(true);
      expect(isFiniteNumber(city.aqi)).toBe(true);
      expect(typeof city.name).toBe('string');
      expect(typeof city.country).toBe('string');
      expect(ids.has(city.id)).toBe(false);
      ids.add(city.id);
    });
  });

  it('provides lookup map by id', () => {
    CITY_CATALOG.forEach((city) => {
      expect(CITY_CATALOG_BY_ID[city.id]).toEqual(city);
    });
  });

  it('exports valid default tracked city ids', () => {
    DEFAULT_TRACKED_CITY_IDS.forEach((cityId) => {
      expect(CITY_CATALOG_BY_ID[cityId]).toBeDefined();
    });
  });

  it('creates deterministic samples from the catalog', () => {
    const sample = getRandomCitySample(10);
    const secondSample = getRandomCitySample(10);

    expect(sample).toHaveLength(10);
    expect(new Set(sample.map((city) => city.id)).size).toBe(sample.length);
    expect(sample).toEqual(secondSample);
  });
});
