import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getStartedGrammarChunkIds: vi.fn(),
  chunksAnyOf: vi.fn(),
  groupsAnyOf: vi.fn(),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    grammar_chunks: {
      where: (field: string) => {
        if (field === 'id') {
          return { anyOf: (...args: unknown[]) => mocks.chunksAnyOf(...args) };
        }
        throw new Error(`Unexpected grammar_chunks.where field: ${field}`);
      },
    },
    grammar_groups: {
      where: (field: string) => {
        if (field === 'id') {
          return { anyOf: (...args: unknown[]) => mocks.groupsAnyOf(...args) };
        }
        throw new Error(`Unexpected grammar_groups.where field: ${field}`);
      },
    },
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getStartedGrammarChunkIds: (...args: unknown[]) => mocks.getStartedGrammarChunkIds(...args),
  },
}));

import GrammarGroup from '@/database/models/grammar-groups';

describe('GrammarGroup.getStarted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStartedGrammarChunkIds.mockResolvedValue([11, 12, 13, 14]);
    mocks.chunksAnyOf.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([
        { id: 12, name: 'Second', grammar_group_id: 2, sort_order: 2 },
        { id: 11, name: 'First', grammar_group_id: 1, sort_order: 1 },
        { id: 14, name: 'Ungrouped', grammar_group_id: null, sort_order: 1 },
        { id: 13, name: 'First group second', grammar_group_id: 1, sort_order: 3 },
      ]),
    });
    mocks.groupsAnyOf.mockReturnValue({
      sortBy: vi.fn().mockResolvedValue([
        { id: 1, name: 'First group', sort_order: 1 },
        { id: 2, name: 'Second group', sort_order: 2 },
      ]),
    });
  });

  it('returns only started grouped chunks in group and chunk order', async () => {
    await expect(GrammarGroup.getStarted('u1')).resolves.toEqual([
      {
        id: 1,
        name: 'First group',
        sort_order: 1,
        chunks: [
          { id: 11, name: 'First', grammar_group_id: 1, sort_order: 1 },
          { id: 13, name: 'First group second', grammar_group_id: 1, sort_order: 3 },
        ],
      },
      {
        id: 2,
        name: 'Second group',
        sort_order: 2,
        chunks: [{ id: 12, name: 'Second', grammar_group_id: 2, sort_order: 2 }],
      },
    ]);

    expect(mocks.getStartedGrammarChunkIds).toHaveBeenCalledWith('u1');
    expect(mocks.chunksAnyOf).toHaveBeenCalledWith([11, 12, 13, 14]);
    expect(mocks.groupsAnyOf).toHaveBeenCalledWith([2, 1]);
  });

  it('returns no groups when started chunks are ungrouped', async () => {
    mocks.chunksAnyOf.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([
        { id: 14, name: 'Ungrouped', grammar_group_id: null, sort_order: 1 },
      ]),
    });

    await expect(GrammarGroup.getStarted('u1')).resolves.toEqual([]);
    expect(mocks.groupsAnyOf).not.toHaveBeenCalled();
  });

  it('returns no groups when there are no started chunks', async () => {
    mocks.getStartedGrammarChunkIds.mockResolvedValue([]);

    await expect(GrammarGroup.getStarted('u1')).resolves.toEqual([]);
    expect(mocks.chunksAnyOf).not.toHaveBeenCalled();
  });
});
