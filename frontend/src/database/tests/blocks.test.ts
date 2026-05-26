import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  orderBy: vi.fn(),
  toArray: vi.fn(),
  where: vi.fn(),
  anyOf: vi.fn(),
  getOverviewBlockIds: vi.fn(),
  transaction: vi.fn(),
  getSyncTimestamps: vi.fn(),
  markAsSynced: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  gt: vi.fn(),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    metadata: {},
    transaction: (...args: unknown[]) => mocks.transaction(...args),
    blocks: {
      orderBy: (...args: unknown[]) => mocks.orderBy(...args),
      where: (...args: unknown[]) => mocks.where(...args),
      clear: vi.fn(),
      bulkDelete: vi.fn(),
      bulkPut: vi.fn(),
    },
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getStartedBlocksIds: (...args: unknown[]) => mocks.getOverviewBlockIds(...args),
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
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

import Blocks from '@/database/models/blocks';

describe('Blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.toArray.mockResolvedValue([]);
    mocks.orderBy.mockReturnValue({
      toArray: (...args: unknown[]) => mocks.toArray(...args),
    });
    mocks.anyOf.mockReturnValue({
      toArray: (...args: unknown[]) => mocks.toArray(...args),
    });
    mocks.where.mockReturnValue({
      anyOf: (...args: unknown[]) => mocks.anyOf(...args),
    });
    mocks.getOverviewBlockIds.mockResolvedValue([]);
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2026-03-03T00:00:00.000Z',
      newSyncedAt: '2026-03-04T00:00:00.000Z',
    });
    mocks.markAsSynced.mockResolvedValue(undefined);
    mocks.gt.mockResolvedValue({ data: [], error: null });
    mocks.select.mockReturnValue({
      gt: (...args: unknown[]) => mocks.gt(...args),
    });
    mocks.from.mockReturnValue({
      select: (...args: unknown[]) => mocks.select(...args),
    });
  });

  it('getAll returns blocks ordered by sort_order', async () => {
    const ordered = [
      { id: 1, sort_order: 1, name: 'A', note: '', deleted_at: null },
      { id: 2, sort_order: 2, name: 'B', note: '', deleted_at: null },
    ];
    mocks.toArray.mockResolvedValueOnce(ordered);

    await expect(Blocks.getAll()).resolves.toEqual(ordered);
    expect(mocks.orderBy).toHaveBeenCalledWith('sort_order');
  });

  it('getOverviewBlocks throws when userId is missing', async () => {
    await expect(Blocks.getStarted('')).rejects.toThrow();
  });

  it('getOverviewBlocks returns blocks sorted by sort_order', async () => {
    mocks.getOverviewBlockIds.mockResolvedValueOnce([1, 2, 3]);
    mocks.toArray.mockResolvedValueOnce([
      { id: 2, sort_order: 20, name: 'B', note: '', deleted_at: null },
      { id: 1, sort_order: 10, name: 'A', note: '', deleted_at: null },
    ]);

    const result = await Blocks.getStarted('u1');

    expect(mocks.where).toHaveBeenCalledWith('id');
    expect(mocks.anyOf).toHaveBeenCalledWith([1, 2, 3]);
    expect(result.map((item) => item.id)).toEqual([1, 2]);
  });

  it('syncFromRemote fetches remote data and marks sync metadata', async () => {
    await Blocks.syncFromRemote(true);

    expect(mocks.from).toHaveBeenCalledWith('blocks');
    expect(mocks.select).toHaveBeenCalledWith('id, name, note, sort_order, deleted_at');
    expect(mocks.gt).toHaveBeenCalledWith('updated_at', '2026-03-03T00:00:00.000Z');
    expect(mocks.markAsSynced).toHaveBeenCalledWith('blocks', '2026-03-04T00:00:00.000Z');
  });
});
