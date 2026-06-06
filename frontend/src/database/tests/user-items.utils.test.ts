import { describe, it, expect, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
      nullReplacementNumber: 0,
    },
    srs: {
      intervals: [10, 20, 30],
      randomness: 0.1,
    },
  },
}));

import { convertAPIToLocal } from '@/database/utils/user-items.utils';

describe('user-items.utils', () => {
  it('convertAPIToLocal keeps passthrough fields from API payload', () => {
    const api = {
      user_id: 'u1',
      item_id: 1,
      czech: 'A',
      english: 'B',
      pronunciation: '',
      audio: null,
      is_study_item: true,
      is_vocabulary: false,
      sort_order: 0,
      progress: 0,
      progress_history: [],
      updated_at: '2020-01-01T00:00:00.000Z',
      started_at: null,
      next_at: null,
      mastered_at: null,
      deleted_at: null,
      block_id: null,
      grammar_id: null,
      lesson_id: 0,
      note: '<p>some note</p>',
    } as any;

    const local = convertAPIToLocal(api);
    expect((local as any).note).toBe('<p>some note</p>');
  });
});
