import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  grammarGet: vi.fn(),
  grammarAnyOf: vi.fn(),
  getStartedGrammarIds: vi.fn(),
  transaction: vi.fn(),
  getSyncTimestamps: vi.fn(),
  markAsSynced: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  gt: vi.fn(),
  grammarBulkPut: vi.fn(),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    metadata: {},
    transaction: (...args: unknown[]) => mocks.transaction(...args),
    grammar: {
      get: (...args: unknown[]) => mocks.grammarGet(...args),
      where: (field: string) => {
        if (field === 'id') {
          return {
            anyOf: (...args: unknown[]) => mocks.grammarAnyOf(...args),
          };
        }
        throw new Error(`Unexpected grammar.where field: ${field}`);
      },
      clear: vi.fn(),
      bulkDelete: vi.fn(),
      bulkPut: (...args: unknown[]) => mocks.grammarBulkPut(...args),
    },
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getStartedGrammarIds: (...args: unknown[]) => mocks.getStartedGrammarIds(...args),
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

import Grammar from '@/database/models/grammar';

describe('Grammar', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getStartedGrammarIds.mockResolvedValue([]);
    mocks.grammarAnyOf.mockReturnValue({
      sortBy: vi.fn().mockResolvedValue([]),
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
    mocks.gt.mockResolvedValue({ data: [], error: null });
    mocks.select.mockReturnValue({
      gt: (...args: unknown[]) => mocks.gt(...args),
    });
    mocks.from.mockReturnValue({
      select: (...args: unknown[]) => mocks.select(...args),
    });
  });

  it('getGrammarById returns grammar when found', async () => {
    mocks.grammarGet.mockResolvedValue({ id: 1, name: 'Articles', note: '', sort_order: 1 });

    await expect(Grammar.getById(1)).resolves.toEqual(
      expect.objectContaining({ id: 1, name: 'Articles' }),
    );
  });

  it('getGrammarById throws when missing', async () => {
    mocks.grammarGet.mockResolvedValue(undefined);

    await expect(Grammar.getById(2)).rejects.toThrow('Grammar with ID 2 not found.');
  });

  it('getStartedList returns grammar list for started ids', async () => {
    mocks.getStartedGrammarIds.mockResolvedValue([1, 2]);
    mocks.grammarAnyOf.mockReturnValue({
      sortBy: vi.fn().mockResolvedValue([
        { id: 1, name: 'A', note: '', sort_order: 1, deleted_at: null },
        { id: 2, name: 'B', note: '', sort_order: 2, deleted_at: null },
      ]),
    });

    await expect(Grammar.getStarted('u1')).resolves.toHaveLength(2);
    expect(mocks.grammarAnyOf).toHaveBeenCalledWith([1, 2]);
  });

  it('syncFromRemote fetches remote data and marks sync metadata', async () => {
    await Grammar.syncFromRemote(true);

    expect(mocks.from).toHaveBeenCalledWith('grammar');
    expect(mocks.select).toHaveBeenCalledWith('id, name, note, sort_order, deleted_at');
    expect(mocks.gt).toHaveBeenCalledWith('updated_at', '2026-03-03T00:00:00.000Z');
    expect(mocks.markAsSynced).toHaveBeenCalledWith('grammar', '2026-03-04T00:00:00.000Z');
  });

  it('syncFromRemote stores grammar with a null note', async () => {
    mocks.gt.mockResolvedValueOnce({
      data: [{ id: 1, name: 'Articles', note: null, sort_order: 1, deleted_at: null }],
      error: null,
    });

    await Grammar.syncFromRemote();

    expect(mocks.grammarBulkPut).toHaveBeenCalledWith([
      expect.objectContaining({ id: 1, note: null }),
    ]);
  });
});
