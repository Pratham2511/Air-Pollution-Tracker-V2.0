import { act, renderHook, waitFor } from '@testing-library/react';
import useMapboxGuardrail from '../useMapboxGuardrail';

describe('useMapboxGuardrail', () => {
  const originalNavigatorConnection = Object.getOwnPropertyDescriptor(window.navigator, 'connection');

  beforeEach(() => {
    window.localStorage.clear();
    if (originalNavigatorConnection) {
      Object.defineProperty(window.navigator, 'connection', originalNavigatorConnection);
    } else {
      delete window.navigator.connection;
    }
  });

  afterEach(() => {
    window.localStorage.clear();
    if (originalNavigatorConnection) {
      Object.defineProperty(window.navigator, 'connection', originalNavigatorConnection);
    } else {
      delete window.navigator.connection;
    }
  });

  it('tracks map loads and enforces monthly limit', async () => {
    const { result } = renderHook(() => useMapboxGuardrail({ maxMonthlyLoads: 2 }));

    await waitFor(() => {
      expect(result.current.canUseMap).toBe(true);
      expect(result.current.remaining).toBe(2);
    });

    await act(async () => {
      result.current.registerLoad();
    });

    await waitFor(() => {
      expect(result.current.remaining).toBe(1);
      expect(result.current.canUseMap).toBe(true);
    });

    await act(async () => {
      result.current.registerLoad();
    });

    await waitFor(() => {
      expect(result.current.canUseMap).toBe(false);
      expect(result.current.reason).toBe('quota-exceeded');
      expect(result.current.remaining).toBe(0);
    });
  });

  it('falls back gracefully when guardrail disabled', async () => {
    const { result } = renderHook(() => useMapboxGuardrail({ isEnabled: false }));

    await waitFor(() => {
      expect(result.current.canUseMap).toBe(true);
      expect(result.current.remaining).toBe(Infinity);
    });

    await act(async () => {
      result.current.registerLoad();
    });

    await waitFor(() => {
      expect(result.current.canUseMap).toBe(true);
      expect(result.current.remaining).toBe(Infinity);
    });
  });

  it('respects save-data preferences and can reset usage state', async () => {
    const connectionStub = {
      saveData: true,
      addEventListener: jest.fn((type, handler) => {
        connectionStub.listener = handler;
      }),
      removeEventListener: jest.fn(),
      listener: null,
    };

    Object.defineProperty(window.navigator, 'connection', {
      configurable: true,
      value: connectionStub,
    });

    const { result } = renderHook(() => useMapboxGuardrail({ maxMonthlyLoads: 5 }));

    await waitFor(() => {
      expect(result.current.canUseMap).toBe(false);
      expect(result.current.reason).toBe('save-data');
    });

    await act(async () => {
      connectionStub.saveData = false;
      connectionStub.listener?.();
      result.current.resetUsage();
    });

    await waitFor(() => {
      expect(result.current.reason).toBe('ok');
      expect(result.current.canUseMap).toBe(true);
      expect(result.current.remaining).toBe(5);
    });
  });
});
