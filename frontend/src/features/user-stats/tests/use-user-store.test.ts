import { beforeEach, describe, expect, it } from 'vitest';
import { useUserStore } from '@/features/user-stats/use-user-store';

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      levels: [],
      levelsLoading: true,
      levelsError: null,
    });
  });

  it('clears level snapshots', () => {
    useUserStore.setState({
      levels: [{ id: 1 } as any],
      levelsLoading: true,
      levelsError: new Error('levels'),
    });

    useUserStore.getState().clearLevels();

    expect(useUserStore.getState()).toMatchObject({
      levels: [],
      levelsLoading: false,
      levelsError: null,
    });
  });
});
