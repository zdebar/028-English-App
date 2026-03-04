import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userScoresGet: vi.fn(),
  userScoresPut: vi.fn(),
  userScoresBulkPut: vi.fn(),
  userScoresDelete: vi.fn(),
  userScoresBetween: vi.fn(),
  userScoresEquals: vi.fn(),
  dbTransaction: vi.fn(),
  getTodayShortDate: vi.fn(),
  rpc: vi.fn(),
  getSyncedAt: vi.fn(),
  markAsSynced: vi.fn(),
  infoHandler: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      epochStartDate: '1970-01-01T00:00:00.000Z',
    },
  },
}));

vi.mock('@/database/database.utils', () => ({
  getTodayShortDate: (...args: unknown[]) => mocks.getTodayShortDate(...args),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_scores: {
      get: (...args: unknown[]) => mocks.userScoresGet(...args),
      put: (...args: unknown[]) => mocks.userScoresPut(...args),
      bulkPut: (...args: unknown[]) => mocks.userScoresBulkPut(...args),
      where: (field: string) => {
        if (field === '[user_id+updated_at]') {
          return {
            between: (...args: unknown[]) => mocks.userScoresBetween(...args),
          };
        }
        if (field === 'user_id') {
          return {
            equals: (...args: unknown[]) => mocks.userScoresEquals(...args),
          };
        }
        throw new Error(`Unexpected user_scores.where field: ${field}`);
      },
    },
    metadata: {},
    transaction: (...args: unknown[]) => mocks.dbTransaction(...args),
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
  },
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    getSyncedAt: (...args: unknown[]) => mocks.getSyncedAt(...args),
    markAsSynced: (...args: unknown[]) => mocks.markAsSynced(...args),
  },
}));

vi.mock('@/features/logging/info-handler', () => ({
  infoHandler: (...args: unknown[]) => mocks.infoHandler(...args),
}));

import UserScore from '@/database/models/user-scores';

describe('UserScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mocks.getTodayShortDate.mockReturnValue('2026-02-28');
    mocks.userScoresEquals.mockReturnValue({
      delete: (...args: unknown[]) => mocks.userScoresDelete(...args),
    });
    mocks.userScoresBetween.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });
    mocks.dbTransaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>;
      return callback();
    });
    mocks.getSyncedAt.mockResolvedValue('2026-02-27T00:00:00.000Z');
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    mocks.markAsSynced.mockResolvedValue(true);
    mocks.userScoresDelete.mockResolvedValue(0);
  });

  describe('addItemCount', () => {
    it('adds to existing item count and stores updated record', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T10:00:00.000Z'));
      mocks.userScoresGet.mockResolvedValue({ item_count: 2 });

      await UserScore.addItemCount('u1', 3);

      expect(mocks.userScoresGet).toHaveBeenCalledWith(['u1', '2026-02-28']);
      expect(mocks.userScoresPut).toHaveBeenCalledWith({
        user_id: 'u1',
        date: '2026-02-28',
        item_count: 5,
        updated_at: '2026-02-28T10:00:00.000Z',
      });
    });
  });

  describe('getUserScoreForToday', () => {
    it('returns existing score record if found', async () => {
      const existing = {
        user_id: 'u1',
        date: '2026-02-28',
        item_count: 4,
        updated_at: '2026-02-28T00:00:00.000Z',
      };
      mocks.userScoresGet.mockResolvedValue(existing);

      const result = await UserScore.getOrCreateTodayScore('u1');

      expect(result).toEqual(existing);
    });

    it('returns default record with zero count when no score exists', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T11:00:00.000Z'));
      mocks.userScoresGet.mockResolvedValue(undefined);

      const result = await UserScore.getOrCreateTodayScore('u1');

      expect(result).toEqual({
        user_id: 'u1',
        date: '2026-02-28',
        item_count: 0,
        updated_at: '2026-02-28T11:00:00.000Z',
      });
    });
  });

  describe('deleteAllUserScores', () => {
    it('deletes all scores for the user', async () => {
      mocks.userScoresDelete.mockResolvedValue(7);

      await UserScore.clearUserScores('u1');

      expect(mocks.userScoresEquals).toHaveBeenCalledWith('u1');
    });
  });

  describe('syncUserScoreSinceLastSync', () => {
    it('pushes local updates, pulls server updates, and marks metadata synced', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T12:00:00.000Z'));

      const localScores = [
        {
          user_id: 'u1',
          date: '2026-02-28',
          item_count: 5,
          updated_at: '2026-02-28T11:00:00.000Z',
        },
      ];

      mocks.userScoresBetween.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(localScores),
      });
      mocks.rpc.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({
        data: [
          {
            user_id: 'u1',
            date: '2026-02-28',
            item_count: 6,
            updated_at: '2026-02-28T12:00:00.000Z',
          },
        ],
        error: null,
      });

      await UserScore.syncUserScoreSinceLastSync('u1');

      expect(mocks.getSyncedAt).toHaveBeenCalledWith('user_scores', 'u1');
      expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'upsert_user_scores', {
        p_user_scores: localScores,
      });
      expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'fetch_user_scores', {
        p_user_id: 'u1',
        p_last_synced_at: '2026-02-27T00:00:00.000Z',
      });
      expect(mocks.userScoresBulkPut).toHaveBeenCalledTimes(1);
      expect(mocks.markAsSynced).toHaveBeenCalledWith(
        'user_scores',
        '2026-02-28T12:00:00.000Z',
        'u1',
      );
    });

    it('throws SupabaseError when upsert RPC fails during push', async () => {
      const localScores = [
        {
          user_id: 'u1',
          date: '2026-02-28',
          item_count: 1,
          updated_at: '2026-02-28T11:00:00.000Z',
        },
      ];
      mocks.userScoresBetween.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(localScores),
      });
      mocks.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'upsert failed' },
      });

      await expect(UserScore.syncUserScoreSinceLastSync('u1')).rejects.toThrow(
        'User score synchronization failed.',
      );
    });
  });

  describe('syncUserScoreAll', () => {
    it('pushes local updates, clears local user scores, then pulls from epoch', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T13:00:00.000Z'));

      mocks.userScoresBetween.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });
      mocks.rpc.mockResolvedValue({ data: [], error: null });

      await UserScore.syncUserScoreAll('u1');

      expect(mocks.userScoresDelete).toHaveBeenCalledTimes(1);
      expect(mocks.rpc).toHaveBeenCalledWith('fetch_user_scores', {
        p_user_id: 'u1',
        p_last_synced_at: '1970-01-01T00:00:00.000Z',
      });
      expect(mocks.markAsSynced).toHaveBeenCalledWith(
        'user_scores',
        '2026-02-28T13:00:00.000Z',
        'u1',
      );
    });
  });
});
