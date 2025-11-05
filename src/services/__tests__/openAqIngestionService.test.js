import { CITY_CATALOG_BY_ID } from '../../data/cityCatalog';

describe('openAqIngestionService', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const loadModule = (overrides) => {
    jest.resetModules();

    const defaultMocks = {
      hasSupabaseCredentials: true,
      supabase: {
        from: jest.fn(() => ({
          upsert: jest.fn().mockResolvedValue({ error: null }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        })),
      },
    };

    jest.doMock('../supabaseClient', () => ({
      ...defaultMocks,
      ...overrides,
      supabase: {
        ...defaultMocks.supabase,
        ...(overrides?.supabase ?? {}),
      },
    }));

    // eslint-disable-next-line global-require
    return require('../openAqIngestionService');
  };

  it('normalizes snapshots before upsert', async () => {
    const upsertMock = jest.fn().mockResolvedValue({ error: null });
    const fromMock = jest.fn(() => ({
      upsert: upsertMock,
      insert: jest.fn().mockResolvedValue({ error: null }),
    }));

    const { upsertOpenAqSnapshots } = loadModule({
      supabase: {
        from: fromMock,
      },
    });

    const snapshot = {
      ...CITY_CATALOG_BY_ID.delhi,
      id: 'delhi',
      aqi: 180,
      dominantPollutant: 'PM2.5',
      pollutants: { 'PM2.5': '55 µg/m³' },
      updatedAt: '2025-10-10T07:00:00Z',
      metadata: { source: 'openAq' },
    };

    const result = await upsertOpenAqSnapshots([snapshot]);

    expect(fromMock).toHaveBeenCalledWith('aq_measurements');
    expect(upsertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        city_id: 'delhi',
        aqi: 180,
        dominant_pollutant: 'PM2.5',
        recorded_at: '2025-10-10T07:00:00Z',
        metadata: expect.objectContaining({ source: 'openAq' }),
      }),
    ], expect.objectContaining({ onConflict: 'city_id' }));
    expect(result).toEqual({ error: null, count: 1 });
  });

  it('returns early when Supabase credentials are missing or payload empty', async () => {
    const inertFrom = jest.fn(() => ({
      upsert: jest.fn(),
      insert: jest.fn(),
    }));

    const { upsertOpenAqSnapshots } = loadModule({
      hasSupabaseCredentials: false,
      supabase: { from: inertFrom },
    });

    const resultMissingCreds = await upsertOpenAqSnapshots([
      { id: 'delhi', aqi: 100 },
    ]);
    expect(resultMissingCreds).toEqual({ error: null, count: 0 });
    expect(inertFrom).not.toHaveBeenCalled();

    const emptyFrom = jest.fn(() => ({
      upsert: jest.fn(),
      insert: jest.fn(),
    }));
    const { upsertOpenAqSnapshots: upsertWithCreds } = loadModule({
      supabase: { from: emptyFrom },
    });

    const resultEmpty = await upsertWithCreds([]);
    expect(resultEmpty).toEqual({ error: null, count: 0 });
    expect(emptyFrom).not.toHaveBeenCalled();
  });

  it('records ingestion audit logs with defaults', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    const fromMock = jest.fn(() => ({
      upsert: jest.fn(),
      insert: insertMock,
    }));

    const { recordOpenAqIngestionLog } = loadModule({
      supabase: {
        from: fromMock,
      },
    });

    const result = await recordOpenAqIngestionLog({
      cityId: 'delhi',
      status: 'success',
      error: null,
    });

    expect(fromMock).toHaveBeenCalledWith('aq_ingestion_audit');
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      city_id: 'delhi',
      status: 'success',
      error_message: null,
    }));
    expect(result).toEqual({ error: null });
  });
});
