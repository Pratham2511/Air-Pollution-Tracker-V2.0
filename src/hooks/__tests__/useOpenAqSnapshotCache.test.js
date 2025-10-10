import { act, renderHook } from '@testing-library/react';
import { useOpenAqSnapshotCache } from '../useOpenAqSnapshotCache';

describe('useOpenAqSnapshotCache', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('stores and retrieves snapshots while respecting TTL', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-10T00:00:00Z'));

    const { result } = renderHook(() => useOpenAqSnapshotCache(60 * 1000));

    act(() => {
      result.current.storeSnapshots([
        {
          id: 'delhi',
          aqi: 150,
          dominantPollutant: 'PM2.5',
          updatedAt: '2025-10-10T00:00:00Z',
        },
      ]);
    });

    let cached = result.current.getCachedSnapshots(['delhi']);
    expect(cached).toHaveLength(1);
    expect(cached[0].aqi).toBe(150);

    jest.advanceTimersByTime(65 * 1000);
    cached = result.current.getCachedSnapshots(['delhi']);
    expect(cached).toHaveLength(0);
  });

  it('ignores snapshots without identifiers and supports pruning', () => {
    const { result } = renderHook(() => useOpenAqSnapshotCache());

    act(() => {
      result.current.storeSnapshots([
        { id: null, aqi: 80 },
        { id: 'mumbai', aqi: 90 },
      ]);
    });

    let cached = result.current.getCachedSnapshots(['mumbai', 'unknown']);
    expect(cached).toHaveLength(1);
    expect(cached[0].id).toBe('mumbai');

    act(() => {
      result.current.clearSnapshot('mumbai');
    });

    cached = result.current.getCachedSnapshots(['mumbai']);
    expect(cached).toHaveLength(0);

    act(() => {
      result.current.pruneExpiredSnapshots();
    });

    cached = result.current.getCachedSnapshots(['mumbai']);
    expect(cached).toHaveLength(0);
  });
});
