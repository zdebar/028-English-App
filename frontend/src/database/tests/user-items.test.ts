import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userItemsBulkPut: vi.fn(),
  userItemsBulkDelete: vi.fn(),
  userItemsPrimaryKeys: vi.fn(),
  userItemsDelete: vi.fn(),
  userItemsModify: vi.fn(),
  userItemsUpdatedBetweenToArray: vi.fn(),
  userItemsGrammarBetweenModify: vi.fn(),
  userItemsItemIdModify: vi.fn(),
  userItemsPullBulkPut: vi.fn(),
  dbTransaction: vi.fn(),
  rpc: vi.fn(),
  getNextAt: vi.fn(),
  triggerUpdatedEvent: vi.fn(),
  convertLocalToSQL: vi.fn(),
  resetUserItem: vi.fn(),
  getSyncedAt: vi.fn(),
  markAsSynced: vi.fn(),
  addItemCount: vi.fn(),
  infoHandler: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
      nullReplacementNumber: 0,
      epochStartDate: '1970-01-01T00:00:00.000Z',
    },
    srs: {
      intervals: [1, 2, 3],
    },
    lesson: {
      deckSize: 10,
    },
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
  },
}));

vi.mock('@/database/database.utils', () => ({
  convertLocalToSQL: (...args: unknown[]) => mocks.convertLocalToSQL(...args),
  convertSQLToLocal: (item: unknown) => item,
  getLocalDateFromUTC: (value: string) => value,
  getNextAt: (...args: unknown[]) => mocks.getNextAt(...args),
  getTodayShortDate: () => '2026-02-28',
  resetUserItem: (...args: unknown[]) => mocks.resetUserItem(...args),
  triggerUserItemsUpdatedEvent: (...args: unknown[]) => mocks.triggerUpdatedEvent(...args),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_items: {
      bulkPut: (...args: unknown[]) => mocks.userItemsBulkPut(...args),
      bulkDelete: (...args: unknown[]) => mocks.userItemsBulkDelete(...args),
      where: (field: string) => {
        if (field === 'user_id') {
          return {
            equals: () => ({
              primaryKeys: (...args: unknown[]) => mocks.userItemsPrimaryKeys(...args),
              delete: (...args: unknown[]) => mocks.userItemsDelete(...args),
              toArray: vi.fn().mockResolvedValue([]),
            }),
          };
        }

        if (field === '[user_id+updated_at]') {
          return {
            between: () => ({
              toArray: (...args: unknown[]) => mocks.userItemsUpdatedBetweenToArray(...args),
            }),
          };
        }

        if (field === '[user_id+grammar_id+started_at]') {
          return {
            between: () => ({
              modify: (...args: unknown[]) => mocks.userItemsGrammarBetweenModify(...args),
            }),
          };
        }

        if (field === '[user_id+item_id]') {
          return {
            equals: () => ({
              modify: (...args: unknown[]) => mocks.userItemsItemIdModify(...args),
            }),
          };
        }

        if (field === '[user_id+started_at]') {
          return {
            between: () => ({
              modify: (...args: unknown[]) => mocks.userItemsModify(...args),
            }),
          };
        }

        throw new Error(`Unexpected user_items.where field: ${field}`);
      },
    },
    metadata: {},
    transaction: (...args: unknown[]) => mocks.dbTransaction(...args),
  },
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    getSyncedAt: (...args: unknown[]) => mocks.getSyncedAt(...args),
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
    getStartedGrammarIds: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/features/logging/info-handler', () => ({
  infoHandler: (...args: unknown[]) => mocks.infoHandler(...args),
}));

import UserItem from '@/database/models/user-items';

describe('UserItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mocks.getNextAt.mockReturnValue('2026-03-01T00:00:00.000Z');
    mocks.convertLocalToSQL.mockImplementation((item: unknown) => ({
      ...(item as Record<string, unknown>),
      sql: true,
    }));
    mocks.getSyncedAt.mockResolvedValue('2026-02-27T00:00:00.000Z');
    mocks.markAsSynced.mockResolvedValue(true);
    mocks.addItemCount.mockResolvedValue(true);
    mocks.userItemsPrimaryKeys.mockResolvedValue([]);
    mocks.userItemsDelete.mockResolvedValue(0);
    mocks.userItemsUpdatedBetweenToArray.mockResolvedValue([]);
    mocks.userItemsGrammarBetweenModify.mockResolvedValue(0);
    mocks.userItemsItemIdModify.mockResolvedValue(1);
    mocks.userItemsModify.mockResolvedValue(0);
    mocks.dbTransaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>;
      return callback();
    });
    mocks.rpc.mockResolvedValue({ data: [], error: null });
  });

  describe('savePracticeDeck', () => {
    it('updates fields, stores items, increments score, and triggers update event', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T09:00:00.000Z'));

      const items = [
        {
          user_id: 'u1',
          item_id: 1,
          progress: 3,
          started_at: '1970-01-01T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
          next_at: '1970-01-01T00:00:00.000Z',
        },
      ] as any;

      await UserItem.savePracticeDeck('u1', items);

      expect(mocks.userItemsBulkPut).toHaveBeenCalledTimes(1);
      expect(mocks.addItemCount).toHaveBeenCalledWith('u1', 1);
      expect(mocks.triggerUpdatedEvent).toHaveBeenCalledWith('u1');
    });
  });

  describe('deleteAllUserItems', () => {
    it('deletes records and triggers update event when items exist', async () => {
      mocks.userItemsPrimaryKeys.mockResolvedValue([1, 2, 3]);

      await UserItem.deleteAllUserItems('u1');

      expect(mocks.userItemsBulkDelete).toHaveBeenCalledWith([1, 2, 3]);
      expect(mocks.triggerUpdatedEvent).toHaveBeenCalledWith('u1');
    });

    it('does not trigger update event when no items exist', async () => {
      mocks.userItemsPrimaryKeys.mockResolvedValue([]);

      await UserItem.deleteAllUserItems('u1');

      expect(mocks.userItemsBulkDelete).not.toHaveBeenCalled();
      expect(mocks.triggerUpdatedEvent).not.toHaveBeenCalled();
    });
  });

  describe('resetGrammarItems', () => {
    it('throws when no grammar items are reset', async () => {
      mocks.userItemsGrammarBetweenModify.mockResolvedValue(0);

      await expect(UserItem.resetGrammarItems('u1', 2)).rejects.toThrow(
        'No user items found for grammar ID 2.',
      );
    });

    it('triggers update event when reset succeeds', async () => {
      mocks.userItemsGrammarBetweenModify.mockResolvedValue(2);

      await UserItem.resetGrammarItems('u1', 2);

      expect(mocks.triggerUpdatedEvent).toHaveBeenCalledWith('u1');
    });
  });

  describe('resetUserItemById', () => {
    it('throws when item id does not exist', async () => {
      mocks.userItemsItemIdModify.mockResolvedValue(0);

      await expect(UserItem.resetUserItemById('u1', 99)).rejects.toThrow(
        'No user items found for item ID 99.',
      );
    });

    it('triggers update event on success', async () => {
      mocks.userItemsItemIdModify.mockResolvedValue(1);

      await UserItem.resetUserItemById('u1', 10);

      expect(mocks.triggerUpdatedEvent).toHaveBeenCalledWith('u1');
    });
  });

  describe('syncUserItemsSinceLastSync', () => {
    it('pushes local items and applies server pull changes', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T10:00:00.000Z'));

      const localUserItems = [
        {
          user_id: 'u1',
          item_id: 1,
          updated_at: '2026-02-28T09:00:00.000Z',
          deleted_at: null,
        },
      ];
      mocks.userItemsUpdatedBetweenToArray.mockResolvedValue(localUserItems);
      mocks.rpc.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({
        data: [
          {
            user_id: 'u1',
            item_id: 2,
            deleted_at: null,
          },
          {
            user_id: 'u1',
            item_id: 3,
            deleted_at: '2026-02-28T09:30:00.000Z',
          },
        ],
        error: null,
      });

      await UserItem.syncUserItemsSinceLastSync('u1');

      expect(mocks.getSyncedAt).toHaveBeenCalledWith('user_items', 'u1');
      expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'upsert_user_items', {
        p_user_id: 'u1',
        p_user_items: [
          {
            user_id: 'u1',
            item_id: 1,
            updated_at: '2026-02-28T09:00:00.000Z',
            deleted_at: null,
            sql: true,
          },
        ],
      });
      expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'fetch_user_items', {
        p_user_id: 'u1',
        p_last_synced_at: '2026-02-27T00:00:00.000Z',
      });
      expect(mocks.userItemsBulkDelete).toHaveBeenCalledWith([['u1', 3]]);
      expect(mocks.userItemsBulkPut).toHaveBeenCalledTimes(1);
      expect(mocks.markAsSynced).toHaveBeenCalledWith(
        expect.anything(),
        '2026-02-28T10:00:00.000Z',
        'u1',
      );
    });

    it('throws when push RPC fails', async () => {
      mocks.userItemsUpdatedBetweenToArray.mockResolvedValue([
        {
          user_id: 'u1',
          item_id: 1,
          updated_at: '2026-02-28T09:00:00.000Z',
          deleted_at: null,
        },
      ]);
      mocks.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'rpc upsert failed' },
      });

      await expect(UserItem.syncUserItemsSinceLastSync('u1')).rejects.toThrow(
        'Error inserting user_items to Supabase.',
      );
    });
  });
});
