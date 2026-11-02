import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initializeDataManager: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock('../data-store', () => ({
  initializeDataManager: (...args: unknown[]) => mocks.initializeDataManager(...args),
}));

vi.mock('@/features/logging/logging-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

import { useDataManagerLifecycle } from '../use-data-manager-lifecycle';

describe('useDataManagerLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.initializeDataManager.mockResolvedValue(undefined);
  });

  it('initializes the manager when the active user changes', async () => {
    const { rerender } = renderHook(({ userId }) => useDataManagerLifecycle(userId), {
      initialProps: { userId: 'u1' as string | null },
    });

    await waitFor(() => expect(mocks.initializeDataManager).toHaveBeenCalledWith('u1'));

    rerender({ userId: 'u2' });

    await waitFor(() => expect(mocks.initializeDataManager).toHaveBeenLastCalledWith('u2'));

    rerender({ userId: null });

    await waitFor(() => expect(mocks.initializeDataManager).toHaveBeenLastCalledWith(null));
    expect(mocks.initializeDataManager).toHaveBeenCalledTimes(3);
  });

  it('reports initialization failures', async () => {
    const error = new Error('IndexedDB unavailable');
    mocks.initializeDataManager.mockRejectedValueOnce(error);

    renderHook(() => useDataManagerLifecycle('u1'));

    await waitFor(() => {
      expect(mocks.reportError).toHaveBeenCalledWith(
        'Failed to initialize local application data',
        error,
      );
    });
  });
});
