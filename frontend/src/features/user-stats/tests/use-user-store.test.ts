import { beforeEach, describe, expect, it } from 'vitest';
import { useUserStore } from '@/features/user-stats/use-user-store';

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      levels: [],
      levelsLoading: true,
      levelsError: null,
      dailyStarCount: 0,
      dailyStarCountLoading: false,
      dailyStarCountError: null,
    });
  });

  it('clears level and daily-count snapshots including errors', () => {
    useUserStore.setState({
      levels: [{ id: 1 } as any],
      levelsLoading: true,
      levelsError: new Error('levels'),
      dailyStarCount: 2,
      dailyStarCountLoading: true,
      dailyStarCountError: new Error('score'),
    });

    useUserStore.getState().clearLevels();
    useUserStore.getState().clearDailyStarCount();

    expect(useUserStore.getState()).toMatchObject({
      levels: [],
      levelsLoading: false,
      levelsError: null,
      dailyStarCount: 0,
      dailyStarCountLoading: false,
      dailyStarCountError: null,
    });
  });
});
