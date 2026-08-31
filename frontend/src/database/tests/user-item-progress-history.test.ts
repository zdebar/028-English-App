import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  bulkDelete: vi.fn(),
  bulkPut: vi.fn(),
  getSyncTimestamps: vi.fn(),
  historyGet: vi.fn(),
  historyPut: vi.fn(),
  historyToArray: vi.fn(),
  historyUpdatedAtBetween: vi.fn(),
  historyUpdatedAtBetweenResult: [] as any[],
  markAsSynced: vi.fn(),
  rpc: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '9999-12-31T23:59:59.000Z' },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_item_progress_history: {
      get: (...args: unknown[]) => mocks.historyGet(...args),
      put: (...args: unknown[]) => mocks.historyPut(...args),
      bulkDelete: (...args: unknown[]) => mocks.bulkDelete(...args),
      bulkPut: (...args: unknown[]) => mocks.bulkPut(...args),
      where: (index: string) => {
        if (index === '[user_id+updated_at]') {
          return {
            between: (...args: unknown[]) => ({
              toArray: () => {
                mocks.historyUpdatedAtBetween(...args);
                return mocks.historyUpdatedAtBetweenResult;
              },
            }),
          };
        }
        return {
          equals: () => ({ toArray: (...args: unknown[]) => mocks.historyToArray(...args) }),
        };
      },
    },
    metadata: {},
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
}));

vi.mock('dexie', () => ({ Entity: class Entity {} }));

vi.mock('@/database/utils/sync-generic.utils', () => ({
  getSyncTimestamps: (...args: unknown[]) => mocks.getSyncTimestamps(...args),
  splitDeleted: (items: Array<{ deleted_at: string | null }>) => ({
    toUpsert: items.filter((item) => item.deleted_at == null),
    toDelete: items.filter((item) => item.deleted_at != null),
  }),
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    markAsSynced: (...args: unknown[]) => mocks.markAsSynced(...args),
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
  },
}));

import UserItemProgressHistory from '@/database/models/user-item-progress-history';

describe('UserItemProgressHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('2026-08-31');
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2026-08-30T00:00:00.000Z',
      newSyncedAt: '2026-08-31T00:00:00.000Z',
    });
    mocks.historyUpdatedAtBetweenResult = [];
    mocks.historyPut.mockResolvedValue(undefined);
    mocks.historyToArray.mockResolvedValue([]);
    mocks.bulkDelete.mockResolvedValue(undefined);
    mocks.bulkPut.mockResolvedValue(undefined);
    mocks.markAsSynced.mockResolvedValue(undefined);
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('merges same-day answers while keeping the last progress state', async () => {
    mocks.historyGet.mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      user_id: 'u1',
      date: '2026-08-31',
      item_id: 4,
      direction: 'czToEn',
      progress: 2,
      max_progress: 10,
      progress_change: 2,
      updated_at: '2026-08-31T09:00:00.000Z',
      deleted_at: null,
    });

    await UserItemProgressHistory.recordChange(
      'u1',
      4,
      'czToEn',
      2,
      10,
      2,
      '2026-08-31T09:00:00.000Z',
    );
    await UserItemProgressHistory.recordChange(
      'u1',
      4,
      'czToEn',
      1,
      10,
      -1,
      '2026-08-31T10:00:00.000Z',
    );

    expect(mocks.historyPut).toHaveBeenNthCalledWith(2, {
      user_id: 'u1',
      date: '2026-08-31',
      item_id: 4,
      direction: 'czToEn',
      progress: 1,
      max_progress: 10,
      progress_change: 1,
      updated_at: '2026-08-31T10:00:00.000Z',
      deleted_at: null,
    });
  });

  it('sums positive and negative daily deltas from active records', async () => {
    mocks.historyToArray.mockResolvedValue([
      { item_id: 1, direction: 'czToEn', progress_change: 8, deleted_at: null },
      { item_id: 2, direction: 'enToCz', progress_change: -3, deleted_at: null },
      { item_id: 3, direction: 'czToEn', progress_change: 100, deleted_at: '2026-08-31' },
    ]);

    await expect(UserItemProgressHistory.getTodayProgressChange('u1', '2026-08-31')).resolves.toBe(
      5,
    );
  });

  it('pushes only the current sync window, applies the pull, and stores metadata', async () => {
    const localRecord = {
      user_id: 'u1',
      date: '2026-08-30',
      item_id: 4,
      direction: 'czToEn',
      progress: 2,
      max_progress: 10,
      progress_change: 1,
      updated_at: '2026-08-30T12:00:00.000Z',
      deleted_at: null,
    };
    const remoteRecord = { ...localRecord, item_id: 5, updated_at: '2026-08-30T13:00:00.000Z' };
    mocks.historyUpdatedAtBetweenResult = [localRecord];
    mocks.rpc.mockResolvedValue({ data: [remoteRecord], error: null });

    await UserItemProgressHistory.syncFromRemote('u1', false);

    expect(mocks.historyUpdatedAtBetween).toHaveBeenCalledWith(
      ['u1', '2026-08-30T00:00:00.000Z'],
      ['u1', '2026-08-31T00:00:00.000Z'],
      false,
      true,
    );
    expect(mocks.rpc).toHaveBeenCalledWith('upsert_fetch_user_item_progress_history', {
      p_user_id: 'u1',
      p_last_synced_at: '2026-08-30T00:00:00.000Z',
      p_sync_until: '2026-08-31T00:00:00.000Z',
      p_user_item_progress_history: [localRecord],
    });
    expect(mocks.bulkPut).toHaveBeenCalledWith([remoteRecord]);
    expect(mocks.markAsSynced).toHaveBeenCalledWith(
      'user_item_progress_history',
      '2026-08-31T00:00:00.000Z',
      'u1',
    );
  });

  it('does not advance metadata when the remote sync fails', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'network error' } });

    await expect(UserItemProgressHistory.syncFromRemote('u1', false)).rejects.toThrow(
      'Error fetching user item progress history from Supabase.',
    );

    expect(mocks.markAsSynced).not.toHaveBeenCalled();
  });
});
