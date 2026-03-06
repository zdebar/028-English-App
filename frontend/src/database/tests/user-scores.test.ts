import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  bulkPut: vi.fn(),
  bulkDelete: vi.fn(),
  equals: vi.fn(),
  between: vi.fn(),
  transaction: vi.fn(),
  getTodayShortDate: vi.fn(),
  getSyncTimestamps: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  markAsSynced: vi.fn(),
  triggerDailyCountUpdatedEvent: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      epochStartDate: '1970-01-01T00:00:00.000Z',
    },
  },
}));

vi.mock('@/database/utils/database.utils', () => ({
  getTodayShortDate: (...args: unknown[]) => mocks.getTodayShortDate(...args),
}));

vi.mock('@/database/utils/data-sync.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/data-sync.utils');
  return {
    ...actual,
    getSyncTimestamps: (...args: unknown[]) => mocks.getSyncTimestamps(...args),
  };
});

vi.mock('@/database/models/db', () => ({
  db: {
    user_scores: {
      get: (...args: unknown[]) => mocks.get(...args),
      put: (...args: unknown[]) => mocks.put(...args),
      bulkPut: (...args: unknown[]) => mocks.bulkPut(...args),
      bulkDelete: (...args: unknown[]) => mocks.bulkDelete(...args),
      where: (field: string) => {
        if (field === '[user_id+updated_at]') {
          return {
            between: (...args: unknown[]) => mocks.between(...args),
          };
        }
        if (field === 'user_id') {
          return {
            equals: (...args: unknown[]) => mocks.equals(...args),
          };
        }
        throw new Error(`Unexpected user_scores.where field: ${field}`);
      },
    },
    metadata: {},
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    getSyncedAt: vi.fn().mockResolvedValue('1970-01-01T00:00:00.000Z'),
    markAsSynced: (...args: unknown[]) => mocks.markAsSynced(...args),
  },
}));

vi.mock('@/features/user-stats/dashboard.utils', () => ({
  triggerDailyCountUpdatedEvent: (...args: unknown[]) =>
    mocks.triggerDailyCountUpdatedEvent(...args),
}));

import UserScore from '@/database/models/user-scores';

describe('UserScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mocks.getTodayShortDate.mockReturnValue('2026-03-04');
    mocks.equals.mockReturnValue({
      delete: vi.fn().mockResolvedValue(0),
    });
    mocks.between.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>;
      return callback();
    });
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2026-03-03T00:00:00.000Z',
      newSyncedAt: '2026-03-04T00:00:00.000Z',
    });
    mocks.rpc.mockResolvedValue({ error: null });
    mocks.markAsSynced.mockResolvedValue(undefined);

    mocks.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          gt: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }));
  });

  it('addItemCount increments and stores score for today', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T10:00:00.000Z'));
    mocks.get.mockResolvedValue({ item_count: 2 });

    await UserScore.addItemCount('u1', 3);

    expect(mocks.get).toHaveBeenCalledWith(['u1', '2026-03-04']);
    expect(mocks.put).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        date: '2026-03-04',
        item_count: 5,
        deleted_at: null,
      }),
    );
    expect(mocks.triggerDailyCountUpdatedEvent).toHaveBeenCalledWith('u1');
  });

  it('getOrCreateTodayScore returns numeric count or zero', async () => {
    mocks.get.mockResolvedValueOnce({ item_count: 4 }).mockResolvedValueOnce(undefined);

    await expect(UserScore.getOrCreateTodayScore('u1')).resolves.toBe(4);
    await expect(UserScore.getOrCreateTodayScore('u1')).resolves.toBe(0);
  });

  it('deleteAllScores deletes user rows', async () => {
    await UserScore.deleteAllScores('u1');

    expect(mocks.equals).toHaveBeenCalledWith('u1');
  });

  it('syncFromRemote upserts/deletes fetched rows and marks metadata synced', async () => {
    mocks.between.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([
        {
          user_id: 'u1',
          date: '2026-03-04',
          item_count: 3,
          updated_at: '2026-03-04T00:00:00.000Z',
          deleted_at: null,
        },
      ]),
    });

    mocks.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          gt: () =>
            Promise.resolve({
              data: [
                {
                  user_id: 'u1',
                  date: '2026-03-01',
                  item_count: 1,
                  updated_at: '2026-03-04T00:00:00.000Z',
                  deleted_at: '2026-03-04T00:00:00.000Z',
                },
                {
                  user_id: 'u1',
                  date: '2026-03-02',
                  item_count: 6,
                  updated_at: '2026-03-04T00:00:00.000Z',
                  deleted_at: null,
                },
              ],
              error: null,
            }),
        }),
      }),
    }));

    await UserScore.syncFromRemote('u1', false);

    expect(mocks.rpc).toHaveBeenCalledWith('upsert_user_scores', {
      p_user_scores: [
        {
          user_id: 'u1',
          date: '2026-03-04',
          item_count: 3,
          updated_at: '2026-03-04T00:00:00.000Z',
          deleted_at: null,
        },
      ],
    });
    expect(mocks.bulkDelete).toHaveBeenCalledWith([['u1', '2026-03-01']]);
    expect(mocks.bulkPut).toHaveBeenCalledWith([
      {
        user_id: 'u1',
        date: '2026-03-02',
        item_count: 6,
        updated_at: '2026-03-04T00:00:00.000Z',
        deleted_at: null,
      },
    ]);
    expect(mocks.markAsSynced).toHaveBeenCalledWith(
      'user_scores',
      '2026-03-04T00:00:00.000Z',
      'u1',
    );
    expect(mocks.triggerDailyCountUpdatedEvent).toHaveBeenCalledWith('u1');
  });
});
