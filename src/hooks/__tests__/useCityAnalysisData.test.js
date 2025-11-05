import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../services/analysisService', () => {
  const normalizeAnalysisWindow = jest.fn((value) =>
    ['24h', '7d', '30d'].includes(value) ? value : '7d',
  );

  return {
    __esModule: true,
    fetchCityAnalysis: jest.fn(),
    normalizeAnalysisWindow,
    ANALYSIS_WINDOWS: ['24h', '7d', '30d'],
  };
});

const analysisService = require('../../services/analysisService');

const buildAnalysis = (windowKey = '7d') => ({
  city: {
    id: 'delhi',
    name: 'Test City',
    state: 'Delhi',
    country: 'India',
    coordinates: { lat: 0, lng: 0 },
  },
  trendSeries: [
    {
      timestamp: '2025-01-01T00:00:00.000Z',
      aqi: 155,
      rollingAvg: 150,
    },
  ],
  pollutantBreakdown: [
    {
      pollutant: 'PM2.5',
      value: 30,
      unit: 'µg/m³',
      dominance: 'primary',
    },
  ],
  forecast: { shortTerm: [], longTerm: [] },
  healthAdvisories: [],
  sourceAttribution: [],
  weatherCorrelations: [],
  comparisons: {
    direction: 'rising',
    delta: 5,
    criticalHours: 2,
    advisoryTriggers: 1,
  },
  exposure: {
    estimatedPopulation: 1000,
    aqiLoadIndex: 155,
    exposureHours: 4,
  },
  meta: {
    window: windowKey,
    level: { label: 'Unhealthy', color: 'aqi-unhealthy' },
  },
});

const fetchCityAnalysis = analysisService.fetchCityAnalysis;

const { default: useCityAnalysisData } = require('../useCityAnalysisData');

const flushPromises = () => new Promise((resolve) => { setTimeout(resolve, 0); });

const HookHarness = ({ cityId = 'delhi' }) => {
  const data = useCityAnalysisData(cityId);

  return (
    <div>
      <span data-testid="status">{data.status}</span>
      <span data-testid="window">{data.window}</span>
      <span data-testid="aqi">{String(data.highlightMetrics.currentAqi ?? '')}</span>
      <span data-testid="dominant">{data.dominantPollutant?.pollutant ?? ''}</span>
      <button type="button" onClick={() => data.actions.setWindow('24h')}>set-window</button>
      <button type="button" onClick={data.actions.refresh}>refresh</button>
    </div>
  );
};

describe('useCityAnalysisData', () => {
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
    analysisService.fetchCityAnalysis.mockImplementation(async ({ window: requestedWindow } = {}) => ({
      data: buildAnalysis(requestedWindow ?? '7d'),
      error: null,
      source: 'supabase',
    }));
  });

  it('loads analysis data for a city and exposes derived state', async () => {
    await renderHarness({ cityId: 'delhi' });

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    expect(fetchCityAnalysis).toHaveBeenCalledWith({ cityId: 'delhi', window: '7d' });
    expect(screen.getByTestId('aqi').textContent).toBe('155');
    expect(screen.getByTestId('dominant').textContent).toBe('PM2.5');
  });

  it('refetches with a new window when setWindow is invoked', async () => {
    await renderHarness({ cityId: 'delhi' });

    await waitFor(() => expect(fetchCityAnalysis).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('button', { name: 'set-window' }));

    await waitFor(() => expect(fetchCityAnalysis).toHaveBeenCalledTimes(2));

    const lastCall = fetchCityAnalysis.mock.calls.at(-1)[0];
    expect(lastCall).toEqual({ cityId: 'delhi', window: '24h' });
    expect(screen.getByTestId('window').textContent).toBe('24h');
  });

  it('surfaces an error when city identifier is missing', async () => {
    await renderHarness({ cityId: null });

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('error'));
    expect(fetchCityAnalysis).not.toHaveBeenCalled();
  });
});
