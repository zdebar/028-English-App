import { beforeEach, describe, expect, it } from 'vitest';
import { useUserStore } from '@/features/user-stats/use-user-store';

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      levels: [],
      levelsLoading: true,
      levelsError: null,
      dailyProgressChange: 0,
      dailyProgressChangeLoading: false,
      dailyProgressChangeError: null,
    });
  });

  it('clears level and daily-count snapshots including errors', () => {
    useUserStore.setState({
      levels: [{ id: 1 } as any],
      levelsLoading: true,
      levelsError: new Error('levels'),
      dailyProgressChange: 2,
      dailyProgressChangeLoading: true,
      dailyProgressChangeError: new Error('score'),
    });

    useUserStore.getState().clearLevels();
    useUserStore.getState().clearDailyProgressChange();

    expect(useUserStore.getState()).toMatchObject({
      levels: [],
      levelsLoading: false,
      levelsError: null,
      dailyProgressChange: 0,
      dailyProgressChangeLoading: false,
      dailyProgressChangeError: null,
    });
  });
});
