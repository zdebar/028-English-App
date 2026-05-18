import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  grammarGet: vi.fn(),
  grammarAnyOf: vi.fn(),
  getStartedGrammarIds: vi.fn(),
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
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getStartedGrammarIds: (...args: unknown[]) => mocks.getStartedGrammarIds(...args),
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

    mocks.getStartedGrammarIds.mockResolvedValue([]);
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

  it('syncFromRemote delegates to generic sync utility', async () => {
    await Grammar.syncFromRemote(true);

    expect(mocks.syncFromRemoteGeneric).toHaveBeenCalledTimes(1);
  });
});
