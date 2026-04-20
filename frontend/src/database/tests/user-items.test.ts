import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  bulkPut: vi.fn(),
  bulkDelete: vi.fn(),
  equalsDelete: vi.fn(),
  itemIdModify: vi.fn(),
  updatedBetweenToArray: vi.fn(),
  transaction: vi.fn(),
  rpc: vi.fn(),
  getNextAt: vi.fn(),
  getSyncTimestamps: vi.fn(),
  convertLocalToSQL: vi.fn(),
  convertSQLToLocal: vi.fn(),
  markAsSynced: vi.fn(),
  addItemCount: vi.fn(),
  triggerLevelsUpdatedEvent: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
      nullReplacementNumber: 0,
    },
    srs: {
      intervals: [1, 2, 3],
    },
    lesson: {
      deckSize: 10,
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_items: {
      bulkPut: (...args: unknown[]) => mocks.bulkPut(...args),
      bulkDelete: (...args: unknown[]) => mocks.bulkDelete(...args),
      where: (field: string) => {
        if (field === 'user_id') {
          return {
            equals: () => ({
              delete: (...args: unknown[]) => mocks.equalsDelete(...args),
            }),
          };
        }
        if (field === '[user_id+item_id]') {
          return {
            equals: () => ({
              modify: (...args: unknown[]) => mocks.itemIdModify(...args),
            }),
          };
        }
        if (field === '[user_id+updated_at]') {
          return {
            between: () => ({
              toArray: (...args: unknown[]) => mocks.updatedBetweenToArray(...args),
            }),
          };
        }
        throw new Error(`Unexpected user_items.where field: ${field}`);
      },
    },
    metadata: {},
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
  },
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    markAsSynced: (...args: unknown[]) => mocks.markAsSynced(...args),
  },
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    addItemCount: (...args: unknown[]) => mocks.addItemCount(...args),
  },
}));

vi.mock('@/database/models/grammar', () => ({
  default: {
    getStartedIds: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/database/utils/user-items.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/user-items.utils');
  return {
    ...actual,
    getNextAt: (...args: unknown[]) => mocks.getNextAt(...args),
    convertLocalToSQL: (...args: unknown[]) => mocks.convertLocalToSQL(...args),
    convertSQLToLocal: (...args: unknown[]) => mocks.convertSQLToLocal(...args),
  };
});

vi.mock('@/database/utils/data-sync.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/data-sync.utils');
  return {
    ...actual,
    getSyncTimestamps: (...args: unknown[]) => mocks.getSyncTimestamps(...args),
  };
});

vi.mock('@/utils/dashboard.utils', () => ({
  triggerLevelsUpdatedEvent: (...args: unknown[]) => mocks.triggerLevelsUpdatedEvent(...args),
}));

import UserItem from '@/database/models/user-items';

describe('UserItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mocks.getNextAt.mockReturnValue('2026-03-05T00:00:00.000Z');
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2026-03-03T00:00:00.000Z',
      newSyncedAt: '2026-03-04T00:00:00.000Z',
    });
    mocks.convertLocalToSQL.mockImplementation((item: unknown) => ({
      ...(item as any),
      sql: true,
    }));
    mocks.convertSQLToLocal.mockImplementation((item: unknown) => item);
    mocks.addItemCount.mockResolvedValue(undefined);
    mocks.equalsDelete.mockResolvedValue(0);
    mocks.updatedBetweenToArray.mockResolvedValue([]);
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    mocks.markAsSynced.mockResolvedValue(undefined);
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>;
      return callback();
    });
    mocks.itemIdModify.mockResolvedValue(1);
  });

  it('savePracticeDeck stores items and increments score', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T09:00:00.000Z'));

    await UserItem.savePracticeDeck('u1', [
      {
        user_id: 'u1',
        item_id: 1,
        progress: 2,
        started_at: '1970-01-01T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
        next_at: '1970-01-01T00:00:00.000Z',
      } as any,
    ]);

    expect(mocks.bulkPut).toHaveBeenCalledTimes(1);
    expect(mocks.addItemCount).toHaveBeenCalledWith('u1', 1, '2026-03-04T09:00:00.000Z');
  });

  it('savePracticeDeck uses provided dateTime when passed explicitly', async () => {
    const dateTime = '2026-03-06T12:00:00.000Z';

    await UserItem.savePracticeDeck(
      'u1',
      [
        {
          user_id: 'u1',
          item_id: 1,
          progress: 3,
          started_at: '1970-01-01T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
          next_at: '1970-01-01T00:00:00.000Z',
        } as any,
      ],
      dateTime,
    );

    expect(mocks.bulkPut).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          started_at: dateTime,
          updated_at: dateTime,
          mastered_at: dateTime,
        }),
      ]),
    );
    expect(mocks.addItemCount).toHaveBeenCalledWith('u1', 1, dateTime);
  });

  it('deleteAllItems deletes by user_id', async () => {
    await UserItem.deleteAllByUserId('u1');

    expect(mocks.equalsDelete).toHaveBeenCalled();
  });

  it('resetItemById triggers levels update when successful', async () => {
    await UserItem.resetItemById('u1', 10);

    expect(mocks.triggerLevelsUpdatedEvent).toHaveBeenCalledWith('u1');
  });

  it('syncFromRemote pushes local items, applies pull, and marks sync', async () => {
    mocks.updatedBetweenToArray.mockResolvedValue([
      {
        user_id: 'u1',
        item_id: 1,
        updated_at: '2026-03-03T10:00:00.000Z',
        deleted_at: null,
      },
    ]);
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: 'u1',
          item_id: 2,
          deleted_at: null,
        },
        {
          user_id: 'u1',
          item_id: 3,
          deleted_at: '2026-03-04T00:00:00.000Z',
        },
      ],
      error: null,
    });

    await UserItem.syncFromRemote('u1', false);

    expect(mocks.rpc).toHaveBeenCalledWith('upsert_fetch_user_items', {
      p_user_id: 'u1',
      p_last_synced_at: '2026-03-03T00:00:00.000Z',
      p_user_items: [
        {
          user_id: 'u1',
          item_id: 1,
          updated_at: '2026-03-03T10:00:00.000Z',
          deleted_at: null,
          sql: true,
        },
      ],
    });
    expect(mocks.bulkDelete).toHaveBeenCalledWith([['u1', 3]]);
    expect(mocks.bulkPut).toHaveBeenCalled();
    expect(mocks.markAsSynced).toHaveBeenCalledWith('user_items', '2026-03-04T00:00:00.000Z', 'u1');
  });
});
