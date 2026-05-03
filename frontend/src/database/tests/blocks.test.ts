import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  orderBy: vi.fn(),
  toArray: vi.fn(),
  where: vi.fn(),
  anyOf: vi.fn(),
  getOverviewBlockIds: vi.fn(),
  syncFromRemoteGeneric: vi.fn(),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    blocks: {
      orderBy: (...args: unknown[]) => mocks.orderBy(...args),
      where: (...args: unknown[]) => mocks.where(...args),
    },
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getStartedBlocksIds: (...args: unknown[]) => mocks.getOverviewBlockIds(...args),
  },
}));

vi.mock('@/database/utils/data-sync.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/data-sync.utils');
  return {
    ...actual,
    syncFromRemoteGeneric: (...args: unknown[]) => mocks.syncFromRemoteGeneric(...args),
  };
});

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
    mocks.syncFromRemoteGeneric.mockResolvedValue(undefined);
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
    await expect(Blocks.getOverviewBlocks('')).rejects.toThrow();
  });

  it('getOverviewBlocks returns blocks sorted by sort_order', async () => {
    mocks.getOverviewBlockIds.mockResolvedValueOnce([1, 2, 3]);
    mocks.toArray.mockResolvedValueOnce([
      { id: 2, sort_order: 20, name: 'B', note: '', deleted_at: null },
      { id: 1, sort_order: 10, name: 'A', note: '', deleted_at: null },
    ]);

    const result = await Blocks.getOverviewBlocks('u1');

    expect(mocks.where).toHaveBeenCalledWith('id');
    expect(mocks.anyOf).toHaveBeenCalledWith([1, 2, 3]);
    expect(result.map((item) => item.id)).toEqual([1, 2]);
  });

  it('syncFromRemote delegates to generic sync utility', async () => {
    await Blocks.syncFromRemote(true);

    expect(mocks.syncFromRemoteGeneric).toHaveBeenCalledTimes(1);
  });
});
