import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  grammarGet: vi.fn(),
  grammarAnyOf: vi.fn(),
  startedBetween: vi.fn(),
  startedToArray: vi.fn(),
  syncFromRemoteGeneric: vi.fn(),
}));

vi.mock('@/database/models/db', () => ({
  db: {
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
    },
    user_items: {
      where: (field: string) => {
        if (field === '[user_id+started_at]') {
          return {
            between: (...args: unknown[]) => mocks.startedBetween(...args),
          };
        }
        throw new Error(`Unexpected user_items.where field: ${field}`);
      },
    },
  },
}));

vi.mock('@/database/utils/data-sync.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/data-sync.utils');
  return {
    ...actual,
    syncFromRemoteGeneric: (...args: unknown[]) => mocks.syncFromRemoteGeneric(...args),
  };
});

import Grammar from '@/database/models/grammar';

describe('Grammar', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.startedBetween.mockReturnValue({
      filter: () => ({
        toArray: (...args: unknown[]) => mocks.startedToArray(...args),
      }),
    });
    mocks.startedToArray.mockResolvedValue([]);
    mocks.grammarAnyOf.mockReturnValue({
      sortBy: vi.fn().mockResolvedValue([]),
    });
    mocks.syncFromRemoteGeneric.mockResolvedValue(undefined);
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

  it('getStartedIds returns unique grammar ids', async () => {
    mocks.startedToArray.mockResolvedValue([
      { user_id: 'u1', grammar_id: 1, started_at: '2026-01-01' },
      { user_id: 'u1', grammar_id: 2, started_at: '2026-01-02' },
      { user_id: 'u1', grammar_id: 1, started_at: '2026-01-03' },
    ]);

    await expect(Grammar.getStartedGrammarIds('u1')).resolves.toEqual([1, 2]);
  });

  it('getStartedList returns grammar list for started ids', async () => {
    mocks.startedToArray.mockResolvedValue([
      { user_id: 'u1', grammar_id: 1, started_at: '2026-01-01' },
      { user_id: 'u1', grammar_id: 2, started_at: '2026-01-02' },
    ]);
    mocks.grammarAnyOf.mockReturnValue({
      sortBy: vi.fn().mockResolvedValue([
        { id: 1, name: 'A', note: '', sort_order: 1, deleted_at: null },
        { id: 2, name: 'B', note: '', sort_order: 2, deleted_at: null },
      ]),
    });

    await expect(Grammar.getStarted('u1')).resolves.toHaveLength(2);
  });

  it('syncFromRemote delegates to generic sync utility', async () => {
    await Grammar.syncFromRemote(true);

    expect(mocks.syncFromRemoteGeneric).toHaveBeenCalledTimes(1);
  });
});
