import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  grammarGet: vi.fn(),
  grammarClear: vi.fn(),
  grammarBulkDelete: vi.fn(),
  grammarBulkPut: vi.fn(),
  grammarAnyOf: vi.fn(),
  startedBetween: vi.fn(),
  userByIdEquals: vi.fn(),
  userAnd: vi.fn(),
  dbTransaction: vi.fn(),
  getSyncedAt: vi.fn(),
  markAsSynced: vi.fn(),
  infoHandler: vi.fn(),
  supabaseGte: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
      epochStartDate: '1970-01-01T00:00:00.000Z',
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    grammar: {
      get: (...args: unknown[]) => mocks.grammarGet(...args),
      clear: (...args: unknown[]) => mocks.grammarClear(...args),
      bulkDelete: (...args: unknown[]) => mocks.grammarBulkDelete(...args),
      bulkPut: (...args: unknown[]) => mocks.grammarBulkPut(...args),
      where: (field: string) => {
        if (field === 'id') {
          return {
            anyOf: (...args: unknown[]) => mocks.grammarAnyOf(...args),
          };
        }
        throw new Error(`Unexpected grammar.where field: ${field}`);
      },
    },
    user_items: {
      where: (field: string) => {
        if (field === '[user_id+started_at]') {
          return {
            between: (...args: unknown[]) => mocks.startedBetween(...args),
          };
        }
        if (field === 'user_id') {
          return {
            equals: (...args: unknown[]) => mocks.userByIdEquals(...args),
          };
        }
        throw new Error(`Unexpected user_items.where field: ${field}`);
      },
    },
    metadata: {},
    transaction: (...args: unknown[]) => mocks.dbTransaction(...args),
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    from: () => ({
      select: () => ({
        gte: (...args: unknown[]) => mocks.supabaseGte(...args),
      }),
    }),
  },
}));

vi.mock('@/features/logging/info-handler', () => ({
  infoHandler: (...args: unknown[]) => mocks.infoHandler(...args),
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    getSyncedAt: (...args: unknown[]) => mocks.getSyncedAt(...args),
    markAsSynced: (...args: unknown[]) => mocks.markAsSynced(...args),
  },
}));

import Grammar from '@/database/models/grammar';

describe('Grammar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mocks.dbTransaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>;
      return callback();
    });

    mocks.startedBetween.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });
    mocks.userByIdEquals.mockReturnValue({
      and: (...args: unknown[]) => mocks.userAnd(...args),
    });
    mocks.userAnd.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });
    mocks.grammarAnyOf.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });

    mocks.getSyncedAt.mockResolvedValue('2026-02-27T00:00:00.000Z');
    mocks.supabaseGte.mockResolvedValue({ data: [], error: null });
  });

  describe('getGrammarById', () => {
    it('returns grammar when it exists', async () => {
      const grammar = {
        id: 1,
        name: 'Articles',
        note: 'Use a/an/the',
        updated_at: '2026-02-28T00:00:00.000Z',
        deleted_at: null,
      };
      mocks.grammarGet.mockResolvedValue(grammar);

      const result = await Grammar.getGrammarById(1);

      expect(mocks.grammarGet).toHaveBeenCalledWith(1);
      expect(result).toEqual(grammar);
    });

    it('throws when grammar does not exist', async () => {
      mocks.grammarGet.mockResolvedValue(undefined);

      await expect(Grammar.getGrammarById(2)).rejects.toThrow('Grammar with ID 2 not found.');
    });
  });

  describe('getStartedGrammarIds', () => {
    it('returns unique grammar ids for started user items', async () => {
      mocks.startedBetween.mockReturnValue({
        toArray: vi
          .fn()
          .mockResolvedValue([{ grammar_id: 1 }, { grammar_id: 2 }, { grammar_id: 1 }]),
      });

      const result = await Grammar.getStartedGrammarIds('u1');

      expect(result).toEqual([1, 2]);
    });

    it('returns empty array when user has no started items', async () => {
      mocks.startedBetween.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });

      const result = await Grammar.getStartedGrammarIds('u1');

      expect(result).toEqual([]);
    });
  });

  describe('getStartedGrammarListWithProgress', () => {
    it('returns grammar with aggregated progress values', async () => {
      mocks.startedBetween.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([{ grammar_id: 1 }, { grammar_id: 2 }]),
      });
      mocks.grammarAnyOf.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          {
            id: 1,
            name: 'Tenses',
            note: 'Present/Past',
            updated_at: '2026-02-28T00:00:00.000Z',
            deleted_at: null,
          },
          {
            id: 2,
            name: 'Conditionals',
            note: 'If clauses',
            updated_at: '2026-02-28T00:00:00.000Z',
            deleted_at: null,
          },
        ]),
      });
      mocks.userAnd.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          {
            grammar_id: 1,
            started_at: '2026-02-28T00:00:00.000Z',
            mastered_at: '1970-01-01T00:00:00.000Z',
          },
          {
            grammar_id: 1,
            started_at: '2026-02-28T00:00:00.000Z',
            mastered_at: '2026-02-28T01:00:00.000Z',
          },
          {
            grammar_id: 2,
            started_at: '1970-01-01T00:00:00.000Z',
            mastered_at: '1970-01-01T00:00:00.000Z',
          },
        ]),
      });

      const result = await Grammar.getStartedGrammarListWithProgress('u1');

      expect(result).toEqual([
        {
          id: 1,
          name: 'Tenses',
          note: 'Present/Past',
          updated_at: '2026-02-28T00:00:00.000Z',
          deleted_at: null,
          startedCount: 2,
          masteredCount: 1,
          totalCount: 2,
        },
        {
          id: 2,
          name: 'Conditionals',
          note: 'If clauses',
          updated_at: '2026-02-28T00:00:00.000Z',
          deleted_at: null,
          startedCount: 0,
          masteredCount: 0,
          totalCount: 1,
        },
      ]);
    });

    it('returns empty array when there are no started grammar ids', async () => {
      mocks.startedBetween.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });

      const result = await Grammar.getStartedGrammarListWithProgress('u1');

      expect(result).toEqual([]);
    });
  });

  describe('syncGrammarSinceLastSync', () => {
    it('fetches grammar, applies changes, marks sync, and returns count', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T10:00:00.000Z'));
      mocks.supabaseGte.mockResolvedValue({
        data: [
          {
            id: 10,
            name: 'Prepositions',
            note: 'in/on/at',
            updated_at: '2026-02-28T09:00:00.000Z',
            deleted_at: null,
          },
          {
            id: 11,
            name: 'Old Topic',
            note: 'to delete',
            updated_at: '2026-02-28T09:00:00.000Z',
            deleted_at: '2026-02-28T09:30:00.000Z',
          },
        ],
        error: null,
      });

      const count = await Grammar.syncGrammarSinceLastSync();

      expect(mocks.getSyncedAt).toHaveBeenCalled();
      expect(mocks.supabaseGte).toHaveBeenCalledWith('updated_at', '2026-02-27T00:00:00.000Z');
      expect(mocks.grammarBulkDelete).toHaveBeenCalledWith([11]);
      expect(mocks.grammarBulkPut).toHaveBeenCalledWith([
        {
          id: 10,
          name: 'Prepositions',
          note: 'in/on/at',
          updated_at: '2026-02-28T09:00:00.000Z',
          deleted_at: null,
        },
      ]);
      expect(mocks.markAsSynced).toHaveBeenCalledWith('grammar', '2026-02-28T10:00:00.000Z');
      expect(count).toBe(2);
    });

    it('throws SupabaseError when backend fetch fails', async () => {
      mocks.supabaseGte.mockResolvedValue({
        data: null,
        error: { message: 'bad request' },
      });

      await expect(Grammar.syncGrammarSinceLastSync()).rejects.toThrow(
        'Failed to fetch grammar data from supabase',
      );
    });
  });

  describe('syncGrammarAll', () => {
    it('clears grammar table before applying full sync payload', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-28T12:00:00.000Z'));
      mocks.supabaseGte.mockResolvedValue({
        data: [
          {
            id: 20,
            name: 'Adverbs',
            note: 'quickly/slowly',
            updated_at: '2026-02-28T11:00:00.000Z',
            deleted_at: null,
          },
        ],
        error: null,
      });

      const count = await Grammar.syncGrammarAll();

      expect(mocks.grammarClear).toHaveBeenCalledTimes(1);
      expect(mocks.grammarBulkPut).toHaveBeenCalledWith([
        {
          id: 20,
          name: 'Adverbs',
          note: 'quickly/slowly',
          updated_at: '2026-02-28T11:00:00.000Z',
          deleted_at: null,
        },
      ]);
      expect(mocks.markAsSynced).toHaveBeenCalledWith('grammar', '2026-02-28T12:00:00.000Z');
      expect(count).toBe(1);
    });
  });
});
