import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  where: vi.fn(),
  equals: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  bulkDelete: vi.fn(),
  bulkPut: vi.fn(),
  toArray: vi.fn(),
  between: vi.fn(),
  transaction: vi.fn(),
  getSyncTimestamps: vi.fn(),
  markAsSynced: vi.fn(),
  rpc: vi.fn(),
  reportInfo: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '9999-12-31T23:59:59+00:00',
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    metadata: {},
    transaction: (...args: unknown[]) => mocks.transaction(...args),
    user_blocks: {
      where: (...args: unknown[]) => mocks.where(...args),
      get: (...args: unknown[]) => mocks.get(...args),
      bulkDelete: (...args: unknown[]) => mocks.bulkDelete(...args),
      bulkPut: (...args: unknown[]) => mocks.bulkPut(...args),
    },
  },
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    markAsSynced: (...args: unknown[]) => mocks.markAsSynced(...args),
  },
}));

vi.mock('@/database/utils/sync-generic.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/sync-generic.utils');
  return {
    ...actual,
    getSyncTimestamps: (...args: unknown[]) => mocks.getSyncTimestamps(...args),
  };
});

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
  },
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportInfo: (...args: unknown[]) => mocks.reportInfo(...args),
}));

import UserBlock from '@/database/models/user-blocks';

describe('UserBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.toArray.mockResolvedValue([]);
    mocks.delete.mockResolvedValue(undefined);
    mocks.get.mockResolvedValue(undefined);
    mocks.bulkDelete.mockResolvedValue(undefined);
    mocks.bulkPut.mockResolvedValue(undefined);
    mocks.equals.mockReturnValue({
      toArray: (...args: unknown[]) => mocks.toArray(...args),
      delete: (...args: unknown[]) => mocks.delete(...args),
    });
    mocks.between.mockReturnValue({
      toArray: (...args: unknown[]) => mocks.toArray(...args),
    });
    mocks.where.mockReturnValue({
      equals: (...args: unknown[]) => mocks.equals(...args),
      between: (...args: unknown[]) => mocks.between(...args),
    });
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2026-03-03T00:00:00.000Z',
      newSyncedAt: '2026-03-04T00:00:00.000Z',
    });
    mocks.markAsSynced.mockResolvedValue(undefined);
    mocks.rpc.mockResolvedValue({ data: [], error: null });
  });

  it('getByUserId returns blocks sorted by sort_order', async () => {
    mocks.toArray.mockResolvedValueOnce([
      { user_id: 'u1', block_id: 2, sort_order: 20, name: 'B' },
      { user_id: 'u1', block_id: 1, sort_order: 10, name: 'A' },
    ]);

    const result = await UserBlock.getByUserId('u1');

    expect(mocks.where).toHaveBeenCalledWith('user_id');
    expect(mocks.equals).toHaveBeenCalledWith('u1');
    expect(result.map((block) => block.block_id)).toEqual([1, 2]);
  });

  it('getByBlockId reads by compound key', async () => {
    const block = { user_id: 'u1', block_id: 2, name: 'Block 2' };
    mocks.get.mockResolvedValueOnce(block);

    await expect(UserBlock.getByBlockId('u1', 2)).resolves.toEqual(block);
    expect(mocks.get).toHaveBeenCalledWith(['u1', 2]);
  });

  it('deleteByUserId deletes local user blocks', async () => {
    await UserBlock.deleteByUserId('u1');

    expect(mocks.where).toHaveBeenCalledWith('user_id');
    expect(mocks.equals).toHaveBeenCalledWith('u1');
    expect(mocks.delete).toHaveBeenCalled();
  });

  it('syncFromRemote pushes local blocks, applies pull, and marks metadata', async () => {
    mocks.toArray.mockResolvedValueOnce([
      {
        user_id: 'u1',
        block_id: 1,
        progress: 2,
        is_vocabulary: false,
        started_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-03T12:00:00.000Z',
        next_at: '9999-12-31T23:59:59+00:00',
        mastered_at: '9999-12-31T23:59:59+00:00',
      },
    ]);
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: 'u1',
          block_id: 1,
          name: 'Block 1',
          note: '',
          sort_order: 1,
          progress: 2,
          is_vocabulary: false,
          started_at: null,
          updated_at: '2026-03-04T00:00:00.000Z',
          next_at: null,
          mastered_at: null,
          deleted_at: null,
        },
      ],
      error: null,
    });

    await expect(UserBlock.syncFromRemote('u1', false)).resolves.toBe(1);

    expect(mocks.where).toHaveBeenCalledWith('[user_id+updated_at]');
    expect(mocks.between).toHaveBeenCalledWith(
      ['u1', '2026-03-03T00:00:00.000Z'],
      ['u1', '2026-03-04T00:00:00.000Z'],
      true,
      false,
    );
    expect(mocks.rpc).toHaveBeenCalledWith('upsert_fetch_user_blocks', {
      p_user_id: 'u1',
      p_last_synced_at: '2026-03-03T00:00:00.000Z',
      p_user_blocks: [
        {
          user_id: 'u1',
          block_id: 1,
          progress: 2,
          is_vocabulary: false,
          started_at: '2026-03-01T00:00:00.000Z',
          updated_at: '2026-03-03T12:00:00.000Z',
          next_at: null,
          mastered_at: null,
        },
      ],
    });
    expect(mocks.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        block_id: 1,
        started_at: '9999-12-31T23:59:59+00:00',
        next_at: '9999-12-31T23:59:59+00:00',
        mastered_at: '9999-12-31T23:59:59+00:00',
        deleted_at: '9999-12-31T23:59:59+00:00',
      }),
    ]);
    expect(mocks.markAsSynced).toHaveBeenCalledWith(
      'user_blocks',
      '2026-03-04T00:00:00.000Z',
      'u1',
    );
  });

  it('full sync clears local user blocks before upserting', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });

    await UserBlock.syncFromRemote('u1', true);

    expect(mocks.delete).toHaveBeenCalled();
  });
});
