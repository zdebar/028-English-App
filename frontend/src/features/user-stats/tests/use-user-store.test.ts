import { beforeEach, describe, expect, it } from 'vitest';
import { useUserStore } from '@/features/user-stats/use-user-store';

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      levels: [],
      levelsLoading: true,
      levelsError: null,
      dailyCount: 0,
      dailyCountLoading: false,
      dailyCountError: null,
    });
  });

  it('clears level and daily-count snapshots including errors', () => {
    useUserStore.setState({
      levels: [{ id: 1 } as any],
      levelsLoading: true,
      levelsError: new Error('levels'),
      dailyCount: 2,
      dailyCountLoading: true,
      dailyCountError: new Error('score'),
    });

    useUserStore.getState().clearLevels();
    useUserStore.getState().clearDailyCount();

    expect(useUserStore.getState()).toMatchObject({
      levels: [],
      levelsLoading: false,
      levelsError: null,
      dailyCount: 0,
      dailyCountLoading: false,
      dailyCountError: null,
    });
  });
});
