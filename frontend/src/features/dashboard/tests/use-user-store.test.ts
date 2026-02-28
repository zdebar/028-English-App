import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUserScoreForToday: vi.fn(),
  getLevelsOverview: vi.fn(),
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    getUserScoreForToday: (...args: unknown[]) => mocks.getUserScoreForToday(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getLevelsOverview: (...args: unknown[]) => mocks.getLevelsOverview(...args),
  },
}));

import { useUserStore } from '@/features/dashboard/use-user-store';

describe('useUserStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useUserStore.setState({ userStats: null });

    mocks.getUserScoreForToday.mockResolvedValue({ item_count: 7 });
    mocks.getLevelsOverview.mockResolvedValue([{ level_id: 1, lessons: [] }]);
  });

  it('reloadUserStats stores fetched data in state and localStorage', async () => {
    await useUserStore.getState().reloadUserStats('u1');

    const state = useUserStore.getState();
    expect(state.userStats).toEqual({
      levelsOverview: [{ level_id: 1, lessons: [] }],
      practiceCountToday: 7,
    });

    const saved = localStorage.getItem('user-stats_u1');
    expect(saved).toBeTruthy();
  });

  it('reloadUserStats sets null when fetch fails', async () => {
    useUserStore.setState({
      userStats: { levelsOverview: [{ level_id: 1, lessons: [] }], practiceCountToday: 1 },
    });
    mocks.getUserScoreForToday.mockRejectedValue(new Error('fail'));

    await useUserStore.getState().reloadUserStats('u1');

    expect(useUserStore.getState().userStats).toBeNull();
  });

  it('clearUserStats removes persisted value and clears state', () => {
    localStorage.setItem('user-stats_u1', JSON.stringify({ practiceCountToday: 2 }));
    useUserStore.setState({
      userStats: { levelsOverview: [], practiceCountToday: 2 },
    });

    useUserStore.getState().clearUserStats('u1');

    expect(localStorage.getItem('user-stats_u1')).toBeNull();
    expect(useUserStore.getState().userStats).toBeNull();
  });

  it('reacts to userItemsUpdated event by reloading stats for that user', () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    useUserStore.setState({ reloadUserStats: spy as any });

    window.dispatchEvent(new CustomEvent('userItemsUpdated', { detail: { userId: 'u9' } }));

    expect(spy).toHaveBeenCalledWith('u9');
  });
});
