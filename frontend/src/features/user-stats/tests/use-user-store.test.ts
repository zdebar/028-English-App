import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getOrCreateTodayScore: vi.fn(),
  getOverview: vi.fn(),
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    getOrCreateTodayScore: (...args: unknown[]) => mocks.getOrCreateTodayScore(...args),
  },
}));

vi.mock('@/database/models/levels', () => ({
  default: {
    getOverview: (...args: unknown[]) => mocks.getOverview(...args),
  },
}));

import { useUserStore } from '@/features/user-stats/use-user-store';

describe('useUserStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ levels: [], dailyCount: 0 });

    mocks.getOrCreateTodayScore.mockResolvedValue(7);
    mocks.getOverview.mockResolvedValue([
      {
        id: 1,
        sort_order: 1,
        name: 'A1',
        note: '',
        deleted_at: null,
        lessons: [],
      },
    ]);
  });

  it('reloadLevels stores fetched levels in state', async () => {
    await useUserStore.getState().reloadLevels('u1');

    const state = useUserStore.getState();
    expect(state.levels).toEqual([
      {
        id: 1,
        sort_order: 1,
        name: 'A1',
        note: '',
        deleted_at: null,
        lessons: [],
      },
    ]);
  });

  it('reloadDailyCount stores fetched daily count in state', async () => {
    await useUserStore.getState().reloadDailyCount('u1');

    expect(useUserStore.getState().dailyCount).toBe(7);
  });

  it('reloadDailyCount resets to initial value when fetch fails', async () => {
    useUserStore.setState({ dailyCount: 3 });
    mocks.getOrCreateTodayScore.mockRejectedValue(new Error('fail'));

    await useUserStore.getState().reloadDailyCount('u1');

    expect(useUserStore.getState().dailyCount).toBe(0);
  });

  it('clearLevels and clearDailyCount reset state', () => {
    useUserStore.setState({ levels: [{ id: 1 } as any], dailyCount: 2 });

    useUserStore.getState().clearLevels();
    useUserStore.getState().clearDailyCount();

    expect(useUserStore.getState().levels).toEqual([]);
    expect(useUserStore.getState().dailyCount).toBe(0);
  });

  it('reacts to levelsUpdated event by reloading levels for that user', () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    useUserStore.setState({ reloadLevels: spy as any });

    window.dispatchEvent(new CustomEvent('levelsUpdated', { detail: { userId: 'u9' } }));

    expect(spy).toHaveBeenCalledWith('u9');
  });

  it('reacts to dailyCountUpdated event by reloading daily count for that user', () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    useUserStore.setState({ reloadDailyCount: spy as any });

    window.dispatchEvent(new CustomEvent('dailyCountUpdated', { detail: { userId: 'u9' } }));

    expect(spy).toHaveBeenCalledWith('u9');
  });
});
