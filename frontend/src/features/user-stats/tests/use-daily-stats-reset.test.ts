import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reloadLevels: vi.fn(),
  reloadDailyCount: vi.fn(),
  currentDate: '2026-04-15',
}));

vi.mock('@/config/config', () => ({
  default: {
    sync: {
      scoreResetCheckInterval: 1000,
    },
  },
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (
    selector: (state: {
      reloadLevels: typeof mocks.reloadLevels;
      reloadDailyCount: typeof mocks.reloadDailyCount;
    }) => unknown,
  ) =>
    selector({
      reloadLevels: mocks.reloadLevels,
      reloadDailyCount: mocks.reloadDailyCount,
    }),
}));

import { useDailyStatsReset } from '@/features/user-stats/use-daily-stats-reset';

describe('useDailyStatsReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.currentDate = '2026-04-15';

    vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(() => mocks.currentDate);
  });

  afterEach(() => {
    try {
      vi.runOnlyPendingTimers();
    } catch {}
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reloads levels and daily count when day changes and user is logged in', () => {
    renderHook(() => useDailyStatsReset('u1'));

    vi.advanceTimersByTime(1000);
    expect(mocks.reloadLevels).not.toHaveBeenCalled();
    expect(mocks.reloadDailyCount).not.toHaveBeenCalled();

    mocks.currentDate = '2026-04-16';
    vi.advanceTimersByTime(1000);

    expect(mocks.reloadLevels).toHaveBeenCalledWith('u1');
    expect(mocks.reloadDailyCount).toHaveBeenCalledWith('u1');
  });

  it('does not reload when day changes and user is not logged in', () => {
    renderHook(() => useDailyStatsReset(null));

    mocks.currentDate = '2026-04-16';
    vi.advanceTimersByTime(1000);

    expect(mocks.reloadLevels).not.toHaveBeenCalled();
    expect(mocks.reloadDailyCount).not.toHaveBeenCalled();
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { unmount } = renderHook(() => useDailyStatsReset('u1'));
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });
});
