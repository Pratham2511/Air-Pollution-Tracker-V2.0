import { CITY_CATALOG_BY_ID } from '../../data/cityCatalog';

describe('openAqIngestionService', () => {
  it('normalizes and upserts snapshots', async () => {
    jest.resetModules();

    const mockUpsert = jest.fn().mockResolvedValue({ error: null });

    jest.doMock('../supabaseClient', () => ({
      hasSupabaseCredentials: true,
      supabase: {
        from: jest.fn(() => ({ upsert: mockUpsert })),
      },
    }));

    // eslint-disable-next-line global-require
    const { upsertOpenAqSnapshots } = require('../openAqIngestionService');

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
    expect(mockUpsert).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ onConflict: 'city_id' }));
    expect(result.error).toBeNull();
    expect(result.count).toBe(1);
  });
});
