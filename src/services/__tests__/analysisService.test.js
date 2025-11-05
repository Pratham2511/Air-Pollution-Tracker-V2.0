describe('analysisService', () => {
  const defaultCityId = 'delhi';
  const defaultWindow = '7d';

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const setup = async ({
    hasCredentials = false,
    supabaseResponse = { data: null, error: new Error('query failed') },
    fallbackResponse = { meta: { window: defaultWindow, source: 'fallback' } },
    multiCityFallbackResponse = { meta: { window: defaultWindow, cityCount: 0 } },
  } = {}) => {
    const supabaseRpc = jest.fn().mockResolvedValue(supabaseResponse);
    const buildCityAnalysisOffthread = jest.fn().mockResolvedValue(fallbackResponse);
    const buildMultiCityFallback = jest.fn().mockReturnValue(multiCityFallbackResponse);

    jest.doMock('../supabaseClient', () => ({
      supabase: { rpc: supabaseRpc },
      hasSupabaseCredentials: hasCredentials,
    }));

    jest.doMock('../analysisWorkerClient', () => ({
      buildCityAnalysisOffthread,
    }));

    jest.doMock('../analysisFallback', () => {
      const actual = jest.requireActual('../analysisFallback');
      return {
        ...actual,
        buildMultiCityFallback,
      };
    });

    const analysisService = await import('../analysisService');

    return {
      supabaseRpc,
      buildCityAnalysisOffthread,
      buildMultiCityFallback,
      ...analysisService,
    };
  };

  it('returns worker fallback when Supabase credentials are missing', async () => {
    const fallbackResponse = { meta: { window: defaultWindow, marker: 'worker' } };
    const { fetchCityAnalysis, supabaseRpc, buildCityAnalysisOffthread } = await setup({
      hasCredentials: false,
      fallbackResponse,
    });

    const result = await fetchCityAnalysis({ cityId: defaultCityId, window: defaultWindow });

    expect(supabaseRpc).not.toHaveBeenCalled();
    expect(buildCityAnalysisOffthread).toHaveBeenCalledWith(defaultCityId, defaultWindow);
    expect(result.source).toBe('fallback');
    expect(result.data).toBe(fallbackResponse);
  });

  it('falls back to worker data when Supabase returns an error', async () => {
    const error = new Error('rpc unavailable');
    const fallbackResponse = { meta: { window: defaultWindow, marker: 'error-fallback' } };
    const { fetchCityAnalysis, supabaseRpc, buildCityAnalysisOffthread } = await setup({
      hasCredentials: true,
      supabaseResponse: { data: null, error },
      fallbackResponse,
    });

    const result = await fetchCityAnalysis({ cityId: defaultCityId, window: '24h' });

    expect(supabaseRpc).toHaveBeenCalledWith('get_city_analysis', {
      city_id: defaultCityId,
      range_window: '24h',
    });
    expect(buildCityAnalysisOffthread).toHaveBeenCalledWith(defaultCityId, '24h');
    expect(result.source).toBe('fallback');
    expect(result.data).toBe(fallbackResponse);
    expect(result.error).toBe(error);
  });

  it('returns Supabase data when available', async () => {
    const supabasePayload = { city: { id: defaultCityId }, meta: { window: defaultWindow } };
    const { fetchCityAnalysis, supabaseRpc, buildCityAnalysisOffthread } = await setup({
      hasCredentials: true,
      supabaseResponse: { data: supabasePayload, error: null },
    });

    const result = await fetchCityAnalysis({ cityId: defaultCityId, window: defaultWindow });

    expect(supabaseRpc).toHaveBeenCalledWith('get_city_analysis', {
      city_id: defaultCityId,
      range_window: defaultWindow,
    });
    expect(buildCityAnalysisOffthread).not.toHaveBeenCalled();
    expect(result.source).toBe('supabase');
    expect(result.data).toBe(supabasePayload);
    expect(result.error).toBeNull();
  });

  it('builds multi-city fallback data when Supabase errors', async () => {
    const multiFallback = { meta: { window: '30d', cityCount: 2 } };
    const { fetchMultiCityOverview, supabaseRpc, buildMultiCityFallback } = await setup({
      hasCredentials: true,
      supabaseResponse: { data: null, error: new Error('multi failed') },
      multiCityFallbackResponse: multiFallback,
    });

    const cityIds = ['delhi', 'mumbai'];
    const result = await fetchMultiCityOverview({ cityIds, window: '30d' });

    expect(supabaseRpc).toHaveBeenCalledWith('get_multi_city_overview', {
      city_ids: cityIds,
      range_window: '30d',
    });
    expect(buildMultiCityFallback).toHaveBeenCalledWith(cityIds, '30d');
    expect(result.source).toBe('fallback');
    expect(result.data).toBe(multiFallback);
  });

  it('returns Supabase forecast summary when available', async () => {
    const forecastPayload = { city: { id: defaultCityId }, forecast: { shortTerm: [] }, meta: { window: defaultWindow } };
    const { fetchCityForecastSummary, supabaseRpc, buildCityAnalysisOffthread } = await setup({
      hasCredentials: true,
      supabaseResponse: { data: forecastPayload, error: null },
    });

    const result = await fetchCityForecastSummary({ cityId: defaultCityId, window: defaultWindow });

    expect(supabaseRpc).toHaveBeenCalledWith('get_city_forecast', {
      city_id: defaultCityId,
      range_window: defaultWindow,
    });
    expect(buildCityAnalysisOffthread).not.toHaveBeenCalled();
    expect(result.source).toBe('supabase');
    expect(result.data).toBe(forecastPayload);
  });

  it('derives forecast summary from fallback analysis when Supabase unavailable', async () => {
    const fallbackResponse = {
      city: { id: defaultCityId, name: 'Fallback City' },
      trendSeries: [{ timestamp: '2025-01-01T00:00:00.000Z', aqi: 120, rollingAvg: 118 }],
      forecast: { shortTerm: [{ timestamp: '2025-01-01T06:00:00.000Z', projectedAqi: 130 }], longTerm: [] },
      meta: { window: defaultWindow },
    };

    const { fetchCityForecastSummary, supabaseRpc, buildCityAnalysisOffthread } = await setup({
      hasCredentials: false,
      fallbackResponse,
    });

    const result = await fetchCityForecastSummary({ cityId: defaultCityId, window: defaultWindow });

    expect(supabaseRpc).not.toHaveBeenCalled();
    expect(buildCityAnalysisOffthread).toHaveBeenCalledWith(defaultCityId, defaultWindow);
    expect(result.source).toBe('fallback');
    expect(result.data).toEqual({
      city: fallbackResponse.city,
      trendSeries: fallbackResponse.trendSeries,
      forecast: fallbackResponse.forecast,
      meta: fallbackResponse.meta,
    });
  });
});
