import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  remote: [] as any[],
  clear: vi.fn(),
  bulkDelete: vi.fn(),
  bulkPut: vi.fn(),
  markAsSynced: vi.fn(),
  getSyncTimestamps: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
    },
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    from: () => ({
      select: () => ({
        gt: async () => ({ data: mocks.remote, error: null }),
      }),
    }),
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    pronunciation_group_items: {
      clear: (...args: unknown[]) => mocks.clear(...args),
      bulkDelete: (...args: unknown[]) => mocks.bulkDelete(...args),
      bulkPut: (...args: unknown[]) => mocks.bulkPut(...args),
    },
    metadata: {},
    transaction: async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
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

import PronunciationGroupItem from '@/database/models/pronunciation-group-items';

describe('PronunciationGroupItem sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2026-07-01T00:00:00.000Z',
      newSyncedAt: '2026-07-30T00:00:00.000Z',
    });
    mocks.remote = [
      {
        pronunciation_group_id: 1,
        item_id: 2,
        sort_order: 1,
        updated_at: '2026-07-20T00:00:00.000Z',
        deleted_at: null,
      },
      {
        pronunciation_group_id: 1,
        item_id: 3,
        sort_order: 2,
        updated_at: '2026-07-21T00:00:00.000Z',
        deleted_at: '2026-07-21T00:00:00.000Z',
      },
    ];
  });

  it('upserts live memberships and removes tombstones by compound key', async () => {
    await expect(PronunciationGroupItem.syncFromRemote(false)).resolves.toBe(2);

    expect(mocks.bulkPut).toHaveBeenCalledWith([mocks.remote[0]]);
    expect(mocks.bulkDelete).toHaveBeenCalledWith([[1, 3]]);
    expect(mocks.markAsSynced).toHaveBeenCalledWith(
      'pronunciation_group_items',
      '2026-07-30T00:00:00.000Z',
    );
  });
});
