import { beforeEach, describe, expect, it } from 'vitest';
import { useUserStore } from '@/features/user-stats/use-user-store';

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      levels: [],
      levelsLoading: true,
      levelsError: null,
      startedTodayCount: 0,
    });
  });

  it('clears level and started-today snapshots', () => {
    useUserStore.setState({
      levels: [{ id: 1 } as any],
      levelsLoading: true,
      levelsError: new Error('levels'),
      startedTodayCount: 2,
    });

    useUserStore.getState().clearLevels();

    expect(useUserStore.getState()).toMatchObject({
      levels: [],
      levelsLoading: false,
      levelsError: null,
      startedTodayCount: 0,
    });
  });
});
