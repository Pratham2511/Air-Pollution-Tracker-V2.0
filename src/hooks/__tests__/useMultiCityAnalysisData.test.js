import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../services/analysisService', () => ({
  __esModule: true,
  fetchMultiCityOverview: jest.fn(),
  normalizeAnalysisWindow: jest.fn((value) =>
    ['24h', '7d', '30d'].includes(value) ? value : '7d',
  ),
  ANALYSIS_WINDOWS: ['24h', '7d', '30d'],
}));

const analysisService = require('../../services/analysisService');

const baseMatrixEntry = (cityId, cityName, aqi) => ({
  cityId,
  cityName,
  aqi,
  change: 5,
  level: { label: 'Unhealthy', color: 'aqi-unhealthy' },
  dominantPollutant: 'PM2.5',
  pollutantBreakdown: [
    { pollutant: 'PM2.5', value: 30 },
    { pollutant: 'PM10', value: 25 },
  ],
  population: 150000,
  lastUpdated: '2025-01-01T00:00:00.000Z',
  riskScore: 4.5,
});

const fetchMultiCityOverview = analysisService.fetchMultiCityOverview;
const { default: useMultiCityAnalysisData } = require('../useMultiCityAnalysisData');

const flushPromises = () => new Promise((resolve) => { setTimeout(resolve, 0); });

const HookHarness = ({ initialCityIds = ['delhi'] }) => {
  const data = useMultiCityAnalysisData(initialCityIds);

  return (
    <div>
      <span data-testid="status">{data.status}</span>
      <span data-testid="window">{data.window}</span>
      <span data-testid="city-count">{String(data.selectedCityIds.length)}</span>
      <span data-testid="source">{data.source}</span>
      <button type="button" onClick={() => data.actions.setWindow('24h')}>set-window</button>
      <button
        type="button"
        onClick={() => data.actions.setSelectedCityIds(['delhi', 'mumbai'])}
      >
        set-cities
      </button>
    </div>
  );
};

describe('useMultiCityAnalysisData', () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
      if (typeof message === 'string' && message.includes('not wrapped in act')) {
        return;
      }
      originalConsoleError(message, ...args);
    });
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  const renderHarness = async (props) => {
    await act(async () => {
      render(<HookHarness {...props} />);
      await flushPromises();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    analysisService.normalizeAnalysisWindow.mockImplementation((value) =>
      ['24h', '7d', '30d'].includes(value) ? value : '7d',
    );
    analysisService.fetchMultiCityOverview.mockImplementation(async ({ cityIds = [], window: requestedWindow } = {}) => {
      const matrix = (cityIds.length ? cityIds : ['delhi']).map((id, index) =>
        baseMatrixEntry(id, `City ${index + 1}`, 120 + index * 10),
      );

      return {
        data: {
          matrix,
          pollutantMatrix: [],
          correlationInsights: [],
          trendLeaders: { improving: [], deteriorating: [] },
          temporalPatterns: { hourly: [], weekly: [] },
          cumulativeImpact: {
            averageAqi: 130,
            hazardousHours: 4,
            alertsIssued: 2,
            populationExposed: 200000,
          },
          meta: {
            window: requestedWindow ?? '7d',
            cityCount: matrix.length,
            generatedAt: '2025-01-01T00:00:00.000Z',
          },
        },
        error: null,
        source: 'supabase',
      };
    });
  });

  it('loads overview data for the initial selection', async () => {
    await renderHarness({ initialCityIds: ['delhi'] });

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    expect(fetchMultiCityOverview).toHaveBeenCalledWith({ cityIds: ['delhi'], window: '7d' });
    expect(screen.getByTestId('city-count').textContent).toBe('1');
    expect(screen.getByTestId('source').textContent).toBe('supabase');
  });

  it('refetches when the analysis window changes', async () => {
    await renderHarness({ initialCityIds: ['delhi'] });

    await waitFor(() => expect(fetchMultiCityOverview).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('button', { name: 'set-window' }));

    await waitFor(() => expect(fetchMultiCityOverview).toHaveBeenCalledTimes(2));

    const lastCall = fetchMultiCityOverview.mock.calls.at(-1)[0];
    expect(lastCall).toEqual({ cityIds: ['delhi'], window: '24h' });
    expect(screen.getByTestId('window').textContent).toBe('24h');
  });

  it('updates selection and requests overview for new city cohort', async () => {
    await renderHarness({ initialCityIds: ['delhi'] });

    await waitFor(() => expect(fetchMultiCityOverview).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('button', { name: 'set-cities' }));

    await waitFor(() => expect(fetchMultiCityOverview).toHaveBeenCalledTimes(2));

    const lastCall = fetchMultiCityOverview.mock.calls.at(-1)[0];
    expect(lastCall).toEqual({ cityIds: ['delhi', 'mumbai'], window: '7d' });
    expect(screen.getByTestId('city-count').textContent).toBe('2');
  });
});
