import { beforeEach, describe, expect, it, vi } from 'vitest';
import config from '@/config/config';
import type { PracticeDeckEntry, UserItemLocal } from '@/types/user-item.types';
import {
  answerCurrentReviewItem,
  createReviewQueue,
  extendReviewQueue,
  getCurrentReviewEntry,
  getRemainingReviewEntries,
} from '../review-queue';

const NULL_DATE = config.database.nullReplacementDate;
const NOW = '2026-01-01T12:00:00.000Z';

describe('review queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  it('detects the initial valid stretch, including reset-ready items', () => {
    const queue = createReviewQueue([
      entry(1, '2026-01-01T10:00:00.000Z'),
      entry(2, '2026-01-01T13:00:00.000Z'),
      entry(3, NULL_DATE, { progress_cz_to_en: 0 }),
    ]);

    expect(queue.validEndIndex).toBe(2);
    expect(queue.activeItemCount).toBe(2);
    expect(getCurrentReviewEntry(queue)?.item.item_id).toBe(1);
  });

  it('advances without removing entries and retains duplicate item ids', () => {
    const queue = createReviewQueue([entry(1, '2026-01-01T10:00:00.000Z')]);
    const updated = item(1, '2026-01-01T14:00:00.000Z');

    const result = answerCurrentReviewItem(queue, updated);

    expect(result?.hasNextItem).toBe(false);
    expect(queue.activeIndex).toBe(1);
    expect(queue.entries).toHaveLength(2);
    expect(queue.entries.map((entry) => entry.item.item_id)).toEqual([1, 1]);
    expect(queue.completedCount).toBe(1);
  });

  it('does not reinsert mastered items', () => {
    const queue = createReviewQueue([entry(1, '2026-01-01T10:00:00.000Z')]);
    const mastered = item(1, NULL_DATE, {
      progress_cz_to_en: 0,
      mastered_at_cz_to_en: NOW,
    });

    answerCurrentReviewItem(queue, mastered);

    expect(queue.entries).toHaveLength(1);
    expect(getRemainingReviewEntries(queue)).toEqual([]);
  });

  it('orders a non-mastered copy by its updated next_at', () => {
    const queue = createReviewQueue([
      entry(1, '2026-01-01T10:00:00.000Z'),
      entry(2, '2026-01-01T16:00:00.000Z'),
    ]);
    const updated = item(1, '2026-01-01T14:00:00.000Z');

    answerCurrentReviewItem(queue, updated);

    expect(getRemainingReviewEntries(queue).map((entry) => entry.item.item_id)).toEqual([1, 2]);
    expect(queue.entries).toHaveLength(3);
  });

  it('admits newly valid items and updates the active progress count', () => {
    const queue = createReviewQueue([
      entry(1, '2026-01-01T10:00:00.000Z'),
      entry(2, '2026-01-01T13:00:00.000Z'),
    ]);

    expect(queue.activeItemCount).toBe(1);
    vi.setSystemTime(new Date('2026-01-01T14:00:00.000Z'));
    extendReviewQueue(queue);

    expect(queue.validEndIndex).toBe(2);
    expect(queue.activeItemCount).toBe(2);
    expect(getCurrentReviewEntry(queue)?.item.item_id).toBe(1);
  });
});

function entry(
  itemId: number,
  nextAt: string,
  overrides: Partial<UserItemLocal> = {},
): PracticeDeckEntry {
  return { item: item(itemId, nextAt, overrides), note: null, grammar: null };
}

function item(itemId: number, nextAt: string, overrides: Partial<UserItemLocal> = {}): UserItemLocal {
  return {
    user_id: 'u1',
    item_id: itemId,
    czech: 'ahoj',
    english: 'hello',
    pronunciation: '',
    audio: null,
    sort_order: itemId,
    progress_cz_to_en: 1,
    note_id: null,
    lesson_id: 1,
    is_vocabulary: 1,
    block_id: 1,
    topic_id: 1,
    grammar_chunk_id: 0,
    started_at: '2026-01-01T00:00:00.000Z',
    deleted_at: NULL_DATE,
    updated_at: NOW,
    next_at_cz_to_en: nextAt,
    mastered_at_cz_to_en: NULL_DATE,
    curriculum_sort_path: [1, 1, itemId],
    ...overrides,
  };
}
