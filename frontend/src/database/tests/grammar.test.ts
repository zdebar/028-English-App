import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getById: vi.fn(),
  getExamples: vi.fn(),
}));

vi.mock('@/database/models/groups', () => ({
  default: {
    getById: (...args: unknown[]) => mocks.getById(...args),
    getExamples: (...args: unknown[]) => mocks.getExamples(...args),
  },
}));

import { getGrammarChunkDetail } from '@/database/queries/grammar-queries';

describe('grammar chunk queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getById.mockResolvedValue({
      id: 10,
      type: 'grammar',
      name: 'Articles',
      note: 'Explanation',
      sort_order: 1,
      updated_at: '2026-01-01',
      deleted_at: null,
    });
    mocks.getExamples.mockResolvedValue([{ item_id: 2 }, { item_id: 1 }]);
  });

  it('loads a grammar chunk from the generic groups store', async () => {
    await expect(getGrammarChunkDetail('u1', 10)).resolves.toMatchObject({ id: 10, type: 'grammar' });
    expect(mocks.getById).toHaveBeenCalledWith(10);
  });

  it('rejects a missing or non-grammar group', async () => {
    mocks.getById.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 11, type: 'topic' });
    await expect(getGrammarChunkDetail('u1', 11)).rejects.toThrow('Grammar group 11 not found.');
    await expect(getGrammarChunkDetail('u1', 11)).rejects.toThrow('Grammar group 11 not found.');
  });

  it('loads examples from generic group_items in their stored order', async () => {
    const detail = await getGrammarChunkDetail('u1', 10);
    expect(mocks.getExamples).toHaveBeenCalledWith(10, 'u1');
    expect(detail.items.map((item) => item.item_id)).toEqual([2, 1]);
  });
});
