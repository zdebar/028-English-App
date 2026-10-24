import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getById: vi.fn(),
  getExamples: vi.fn(),
  getStartedByUser: vi.fn(),
}));

vi.mock('@/database/models/groups', () => ({
  default: {
    getById: (...args: unknown[]) => mocks.getById(...args),
    getExamples: (...args: unknown[]) => mocks.getExamples(...args),
    getStartedByUser: (...args: unknown[]) => mocks.getStartedByUser(...args),
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    group_relations: {
      filter: () => ({ toArray: async () => [] }),
    },
  },
}));

import GrammarGroup from '@/database/models/grammar-chunks';

describe('grammar group adapter', () => {
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
    mocks.getStartedByUser.mockResolvedValue([{ id: 10, type: 'grammar', examples: [] }]);
  });

  it('loads a grammar leaf from the generic groups store', async () => {
    await expect(GrammarGroup.getById(10)).resolves.toMatchObject({ id: 10, type: 'grammar' });
    expect(mocks.getById).toHaveBeenCalledWith(10);
  });

  it('rejects a missing or non-grammar group', async () => {
    mocks.getById.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 11, type: 'topic' });
    await expect(GrammarGroup.getById(11)).rejects.toThrow('Grammar group 11 not found.');
    await expect(GrammarGroup.getById(11)).rejects.toThrow('Grammar group 11 not found.');
  });

  it('loads examples from generic group_items in their stored order', async () => {
    const detail = await GrammarGroup.getDetail('u1', 10);
    expect(mocks.getExamples).toHaveBeenCalledWith(10, 'u1');
    expect(detail.items.map((item) => item.item_id)).toEqual([2, 1]);
  });

  it('uses the shared started lesson and item visibility query', async () => {
    await expect(GrammarGroup.getInitiated('u1')).resolves.toHaveLength(1);
    expect(mocks.getStartedByUser).toHaveBeenCalledWith('u1', 'grammar');
  });
});
