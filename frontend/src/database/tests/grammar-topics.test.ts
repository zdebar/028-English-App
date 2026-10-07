import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getInitiatedGrammarChunkIds: vi.fn(),
  chunksAnyOf: vi.fn(),
  groupsAnyOf: vi.fn(),
  topicsAnyOf: vi.fn(),
  addExamplesToMany: vi.fn(),
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
    grammar_topics: {
      where: (field: string) => {
        if (field === 'id') {
          return { anyOf: (...args: unknown[]) => mocks.topicsAnyOf(...args) };
        }
        throw new Error(`Unexpected grammar_topics.where field: ${field}`);
      },
    },
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getInitiatedGrammarChunkIds: (...args: unknown[]) => mocks.getInitiatedGrammarChunkIds(...args),
  },
}));

vi.mock('@/database/models/grammar-chunks', () => ({
  default: {
    addExamplesToMany: (...args: unknown[]) => mocks.addExamplesToMany(...args),
  },
}));

import GrammarTopic from '@/database/models/grammar-topics';

describe('GrammarTopic.getInitiated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getInitiatedGrammarChunkIds.mockResolvedValue([11, 12, 13]);
    mocks.chunksAnyOf.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([
        { id: 12, name: 'Second', grammar_group_id: 2, sort_order: 2 },
        { id: 11, name: 'First', grammar_group_id: 1, sort_order: 1 },
        { id: 13, name: 'First group second', grammar_group_id: 1, sort_order: 3 },
      ]),
    });
    mocks.groupsAnyOf.mockReturnValue({
      sortBy: vi.fn().mockResolvedValue([
        { id: 1, name: 'First group', grammar_topic_id: 1, sort_order: 2 },
        { id: 2, name: 'Second group', grammar_topic_id: 1, sort_order: 3 },
      ]),
    });
    mocks.topicsAnyOf.mockReturnValue({
      sortBy: vi.fn().mockResolvedValue([
        { id: 1, name: 'Present Simple', sort_order: 1 },
      ]),
    });
    mocks.addExamplesToMany.mockImplementation(
      async (_userId: string, chunks: Array<Record<string, unknown>>) =>
        chunks.map((chunk) => ({ ...chunk, items: [] })),
    );
  });

  it('returns initiated groups nested under their ordered topic', async () => {
    await expect(GrammarTopic.getInitiated('u1')).resolves.toEqual([
      {
        id: 1,
        name: 'Present Simple',
        sort_order: 1,
        groups: [
          {
            id: 1,
            kind: 'group',
            name: 'First group',
            grammar_topic_id: 1,
            sort_order: 2,
            chunks: [
              { id: 11, name: 'First', grammar_group_id: 1, sort_order: 1, items: [] },
              { id: 13, name: 'First group second', grammar_group_id: 1, sort_order: 3, items: [] },
            ],
          },
          {
            id: 2,
            kind: 'group',
            name: 'Second group',
            grammar_topic_id: 1,
            sort_order: 3,
            chunks: [{ id: 12, name: 'Second', grammar_group_id: 2, sort_order: 2, items: [] }],
          },
        ],
      },
    ]);

    expect(mocks.getInitiatedGrammarChunkIds).toHaveBeenCalledWith('u1');
    expect(mocks.chunksAnyOf).toHaveBeenCalledWith([11, 12, 13]);
    expect(mocks.addExamplesToMany).toHaveBeenCalledWith(
      'u1',
      expect.arrayContaining([expect.objectContaining({ id: 11 }), expect.objectContaining({ id: 12 })]),
    );
    expect(mocks.groupsAnyOf).toHaveBeenCalledWith([2, 1]);
    expect(mocks.topicsAnyOf).toHaveBeenCalledWith([1]);
  });

  it('returns no topics when there are no started chunks', async () => {
    mocks.getInitiatedGrammarChunkIds.mockResolvedValue([]);

    await expect(GrammarTopic.getInitiated('u1')).resolves.toEqual([]);
    expect(mocks.chunksAnyOf).not.toHaveBeenCalled();
    expect(mocks.topicsAnyOf).not.toHaveBeenCalled();
  });
});