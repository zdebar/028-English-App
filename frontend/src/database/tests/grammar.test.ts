import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GroupType } from '@/types/table.types';

const mocks = vi.hoisted(() => ({
  getExamples: vi.fn(),
}));

vi.mock('@/database/models/groups', () => ({
  default: {
    getExamples: (...args: unknown[]) => mocks.getExamples(...args),
  },
}));

import { getGrammarChunkWithExamples } from '@/database/queries/grammar-queries';

describe('grammar chunk queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getExamples.mockResolvedValue([{ item_id: 2 }, { item_id: 1 }]);
  });

  it('loads a grammar chunk and its examples in stored order', async () => {
    const group: GroupType = {
      id: 10,
      type: 'grammar',
      name: 'Articles',
      note: 'Explanation',
      sort_order: 1,
      updated_at: '2026-01-01',
      deleted_at: null,
      sound_class: null,
      sound_category: null,
    };

    const detail = await getGrammarChunkWithExamples('u1', group);
    expect(detail).toMatchObject({
      id: 10,
      type: 'grammar',
    });
    expect(mocks.getExamples).toHaveBeenCalledWith(10, 'u1');
    expect(detail.items.map((item) => item.item_id)).toEqual([2, 1]);
  });
});
