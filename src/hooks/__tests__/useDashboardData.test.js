import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData } from '../useDashboardData';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

const mockSnapshotCache = {
  getCachedSnapshots: jest.fn(() => []),
  storeSnapshots: jest.fn(),
  pruneExpiredSnapshots: jest.fn(),
  clearSnapshot: jest.fn(),
};

jest.mock('../useOpenAqSnapshotCache', () => ({
  useOpenAqSnapshotCache: () => mockSnapshotCache,
}));

jest.mock('../../services/dashboardService', () => {
  const { CITY_CATALOG_BY_ID } = jest.requireActual('../../data/cityCatalog');
  const trackedIds = ['delhi', 'mumbai'];

  return {
    fetchDashboardPreferences: jest.fn(() => Promise.resolve({
      data: { trackedCityIds: trackedIds, favorites: [] },
      error: null,
    })),
    updateDashboardPreferences: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    fetchCityMetrics: jest.fn(() => Promise.resolve({
      data: trackedIds.map((cityId, index) => ({
        ...CITY_CATALOG_BY_ID[cityId],
        id: cityId,
        aqi: 150 + index * 25,
        dominantPollutant: 'PM2.5',
        pollutants: { 'PM2.5': `${55 + index * 5} µg/m³` },
        updatedAt: '2025-10-09T10:00:00Z',
      })),
      error: null,
    })),
    searchCities: jest.fn((query) => [{
      id: `mock-${query}`,
      name: `Mock ${query}`,
      country: 'Testland',
      region: 'Test Region',
    }]),
    getInitialTrackedCities: jest.fn(() => trackedIds),
  };
});

const createWrapper = (client) => ({ children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

describe('useDashboardData', () => {
  let queryClient;

  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('aq-tracked-city-ids', JSON.stringify(['delhi', 'mumbai']));
    mockSnapshotCache.getCachedSnapshots.mockReturnValue([]);
    mockSnapshotCache.storeSnapshots.mockClear();
    mockSnapshotCache.pruneExpiredSnapshots.mockClear();
    mockSnapshotCache.clearSnapshot.mockClear();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('hydrates tracked cities and catalog map data', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.trackedCities).toHaveLength(2);
    expect(result.current.mapCities.length).toBeGreaterThanOrEqual(200);

    const trackedMapMarkers = result.current.mapCities.filter((city) => city.isTracked);
    expect(trackedMapMarkers).toHaveLength(2);
    expect(trackedMapMarkers[0].aqi).toBeGreaterThan(0);

    expect(mockSnapshotCache.storeSnapshots).toHaveBeenCalled();
  });
});
