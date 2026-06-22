import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  bulkPut: vi.fn(),
  bulkDelete: vi.fn(),
  equalsDelete: vi.fn(),
  blockEqualsToArray: vi.fn(),
  itemIdModify: vi.fn(),
  itemIdBetweenModify: vi.fn(),
  updatedBetweenToArray: vi.fn(),
  transaction: vi.fn(),
  rpc: vi.fn(),
  getNextAt: vi.fn(),
  getSyncTimestamps: vi.fn(),
  markAsSynced: vi.fn(),
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
    progress: {
      simulationProgress: 2,
      simulationCount: 200,
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
            between: () => ({
              modify: (...args: unknown[]) => mocks.itemIdBetweenModify(...args),
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
        if (field === '[user_id+block_id]') {
          return {
            equals: () => ({
              toArray: (...args: unknown[]) => mocks.blockEqualsToArray(...args),
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
  };
});

vi.mock('@/database/utils/sync-generic.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/sync-generic.utils');
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
    mocks.equalsDelete.mockResolvedValue(0);
    mocks.blockEqualsToArray.mockResolvedValue([]);
    mocks.updatedBetweenToArray.mockResolvedValue([]);
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    mocks.markAsSynced.mockResolvedValue(undefined);
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
    mocks.itemIdModify.mockResolvedValue(1);
    mocks.itemIdBetweenModify.mockResolvedValue(200);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('savePracticeDeck stores items without changing score', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T09:00:00.000Z'));

    await UserItem.savePracticeDeck([
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
  });

  it('savePracticeDeck uses provided dateTime when passed explicitly', async () => {
    const dateTime = '2026-03-06T12:00:00.000Z';

    await UserItem.savePracticeDeck(
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
  });

  it('deleteAllItems deletes by user_id', async () => {
    await UserItem.deleteByUserId('u1');

    expect(mocks.equalsDelete).toHaveBeenCalled();
  });

  it('getByBlockId returns block items ordered by sort_order', async () => {
    mocks.blockEqualsToArray.mockResolvedValue([
      { item_id: 2, sort_order: 20 },
      { item_id: 1, sort_order: 10 },
    ]);

    const result = await UserItem.getByBlockId('u1', 3);

    expect(result.map((item: any) => item.item_id)).toEqual([1, 2]);
  });

  it('resetItemById triggers levels update when successful', async () => {
    await UserItem.resetItemById('u1', 10);

    expect(mocks.triggerLevelsUpdatedEvent).toHaveBeenCalledWith('u1');
  });

  it('simulateData updates first configured range using indexed between+modify', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-10T10:00:00.000Z'));
    mocks.getNextAt.mockReturnValue('2026-06-12T00:00:00.000Z');

    const count = await UserItem.simulateData('u1');

    expect(count).toBe(200);
    expect(mocks.itemIdBetweenModify).toHaveBeenCalledTimes(1);

    const modifyFn = mocks.itemIdBetweenModify.mock.calls[0][0] as (item: any) => void;
    const item = {
      progress: 0,
      updated_at: '1970-01-01T00:00:00.000Z',
      next_at: '1970-01-01T00:00:00.000Z',
    };

    modifyFn(item);

    expect(item.progress).toBe(2);
    expect(item.updated_at).toBe('2026-06-10T10:00:00.000Z');
    expect(item.next_at).toBe('2026-06-12T00:00:00.000Z');
    expect(mocks.getNextAt).toHaveBeenCalledWith(2);
  });

  it('syncFromRemote pushes local items, applies pull, and marks sync', async () => {
    mocks.updatedBetweenToArray.mockResolvedValue([
      {
        user_id: 'u1',
        item_id: 1,
        progress_history: [{ progress: 1, created_at: '2026-03-03T09:59:00.000Z' }],
        progress: 1,
        started_at: '1970-01-01T00:00:00.000Z',
        updated_at: '2026-03-03T10:00:00.000Z',
        next_at: '1970-01-01T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
        deleted_at: null,
      },
    ]);
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: 'u1',
          item_id: 2,
          czech: 'dva',
          english: 'two',
          pronunciation: 'two',
          audio: null,
          is_vocabulary: true,
          sort_order: 2,
          note_id: null,
          block_id: null,
          grammar_id: null,
          progress: 0,
          progress_history: [],
          started_at: null,
          updated_at: '2026-03-04T00:00:00.000Z',
          next_at: null,
          mastered_at: null,
          lesson_id: 1,
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
        expect.objectContaining({
          user_id: 'u1',
          item_id: 1,
          progress_history: [{ progress: 1, created_at: '2026-03-03T09:59:00.000Z' }],
          progress: 1,
          updated_at: '2026-03-03T10:00:00.000Z',
          started_at: null,
          next_at: null,
          mastered_at: null,
        }),
      ],
    });
    expect(mocks.bulkDelete).toHaveBeenCalledWith([['u1', 3]]);
    expect(mocks.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        item_id: 2,
        is_vocabulary: 1,
        block_id: 0,
        grammar_id: 0,
        started_at: '1970-01-01T00:00:00.000Z',
        next_at: '1970-01-01T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
      }),
    ]);
    expect(mocks.markAsSynced).toHaveBeenCalledWith('user_items', '2026-03-04T00:00:00.000Z', 'u1');
  });
});
