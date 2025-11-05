import {
  ANALYSIS_WINDOWS,
  buildCityAnalysisFallback,
  buildMultiCityFallback,
  generateTrendSeries,
} from '../analysisFallback';
import { CITY_CATALOG_BY_ID } from '../../data/cityCatalog';

describe('analysisFallback', () => {
  const referenceCityId = 'delhi';

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('builds deterministic single-city analysis payload', () => {
    const snapshot = buildCityAnalysisFallback(referenceCityId, '7d');

    expect(snapshot).toMatchSnapshot();
  });

  it('builds deterministic multi-city overview payload', () => {
    const snapshot = buildMultiCityFallback(['delhi', 'mumbai', 'pune'], '7d');

    expect(snapshot).toMatchSnapshot();
  });

  it.each(ANALYSIS_WINDOWS)('generates %s trend series with expected cardinality', (windowKey) => {
    const city = CITY_CATALOG_BY_ID[referenceCityId];
    const series = generateTrendSeries(city, windowKey);

    const expectedLength = {
      '24h': 24,
      '7d': 7,
      '30d': 30,
    }[windowKey];

    expect(series).toHaveLength(expectedLength);
    expect(series[0]).toHaveProperty('aqi');
    expect(series[0]).toHaveProperty('rollingAvg');
    expect(series[0]).toHaveProperty('timestamp');
  });
});
