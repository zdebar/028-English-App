import { beforeEach, describe, expect, it, vi } from 'vitest';
import config from '@/config/config';
import type { ReviewKind } from '@/types/practice.types';
import type { PracticeDeckItem } from '@/types/user-item.types';

const mocks = vi.hoisted(() => ({
  getAllReviewItems: vi.fn(),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getAllReviewItems: (...args: unknown[]) => mocks.getAllReviewItems(...args),
  },
}));

import {
  clearReviewArrays,
  getPrefetchedReviewItems,
  getReviewAvailabilityFromArrays,
  getReviewReadyAtFromItems,
  invalidateReviewArrays,
  rebuildReviewArrays,
  syncReviewItemToCache,
  warmReviewArrays,
} from '../review-prefetch';

const NULL_DATE = config.database.nullReplacementDate;
const NOW = '2026-01-01T12:00:00.000Z';

describe('review prefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearReviewArrays(null);
    mocks.getAllReviewItems.mockImplementation(async (_userId: string, reviewKind: ReviewKind) => [
      item(reviewKind === 'grammar' ? 1 : 2, reviewKind),
    ]);
  });

  it('prefetches both review arrays without applying a time cutoff', async () => {
    const futureGrammar = item(1, 'grammar', '2026-01-01T18:00:00.000Z');
    const futureVocabulary = item(2, 'vocabulary', '2026-01-01T19:00:00.000Z');
    mocks.getAllReviewItems.mockImplementation(async (_userId: string, reviewKind: ReviewKind) =>
      reviewKind === 'grammar' ? [futureGrammar] : [futureVocabulary],
    );

    await warmReviewArrays('u1');

    await expect(getPrefetchedReviewItems('u1', 'grammar')).resolves.toEqual([futureGrammar]);
    await expect(getPrefetchedReviewItems('u1', 'vocabulary')).resolves.toEqual([futureVocabulary]);
    expect(mocks.getAllReviewItems).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent prefetches', async () => {
    let resolveQuery!: () => void;
    const queryFinished = new Promise<void>((resolve) => {
      resolveQuery = resolve;
    });
    mocks.getAllReviewItems.mockImplementation(async (_userId: string, reviewKind: ReviewKind) => {
      await queryFinished;
      return [item(reviewKind === 'grammar' ? 1 : 2, reviewKind)];
    });

    const first = warmReviewArrays('u1');
    const second = warmReviewArrays('u1');
    expect(first).toBe(second);
    expect(mocks.getAllReviewItems).toHaveBeenCalledTimes(2);

    resolveQuery();
    await first;
  });

  it('rebuilds after invalidation and derives availability from the prefetched arrays', async () => {
    const dueGrammar = item(1, 'grammar', '2026-01-01T10:00:00.000Z');
    const futureGrammar = item(2, 'grammar', '2026-01-01T18:00:00.000Z');
    mocks.getAllReviewItems.mockImplementation(async (_userId: string, reviewKind: ReviewKind) =>
      reviewKind === 'grammar' ? [dueGrammar, futureGrammar] : [],
    );

    await warmReviewArrays('u1');
    invalidateReviewArrays('u1');
    await warmReviewArrays('u1');

    expect(mocks.getAllReviewItems).toHaveBeenCalledTimes(4);
    expect(getReviewReadyAtFromItems([dueGrammar, futureGrammar], 2, NOW)).toBe(
      futureGrammar.next_at_cz_to_en,
    );
    const availability = getReviewAvailabilityFromArrays(
      {
        grammar: [
          ...Array.from({ length: config.practice.grammarReviewLimitSize - 1 }, (_, index) =>
            item(index + 10, 'grammar'),
          ),
          futureGrammar,
        ],
        vocabulary: [],
      },
      NOW,
    );

    expect(availability.grammarReviewReadyAt).toBe(futureGrammar.next_at_cz_to_en);
    expect(availability.grammarReviewDueCount).toBe(config.practice.grammarReviewLimitSize - 1);
    expect(availability.nextReviewAt).toBe(futureGrammar.next_at_cz_to_en);
  });

  it('merges a persisted item into the refreshed arrays without duplication', async () => {
    await warmReviewArrays('u1');

    let resolveQuery!: () => void;
    const queryFinished = new Promise<void>((resolve) => {
      resolveQuery = resolve;
    });
    mocks.getAllReviewItems.mockImplementation(async (_userId: string, reviewKind: ReviewKind) => {
      await queryFinished;
      return [item(reviewKind === 'grammar' ? 2 : 3, reviewKind)];
    });

    const rebuild = rebuildReviewArrays('u1');
    const persistedGrammar = item(4, 'grammar', '2026-01-01T11:00:00.000Z');
    const sync = syncReviewItemToCache('u1', persistedGrammar);
    resolveQuery();
    await rebuild;
    await sync;

    await expect(getPrefetchedReviewItems('u1', 'grammar')).resolves.toEqual([
      item(2, 'grammar'),
      persistedGrammar,
    ]);
  });

  it('replaces and removes items while preserving sorted unique arrays', async () => {
    const original = item(1, 'grammar', '2026-01-01T10:00:00.000Z');
    const other = item(2, 'grammar', '2026-01-01T12:00:00.000Z');
    mocks.getAllReviewItems.mockImplementation(async (_userId: string, reviewKind: ReviewKind) =>
      reviewKind === 'grammar' ? [original, other] : [],
    );

    await warmReviewArrays('u1');
    const updated = item(1, 'grammar', '2026-01-01T13:00:00.000Z');
    await syncReviewItemToCache('u1', updated);

    expect(await getPrefetchedReviewItems('u1', 'grammar')).toEqual([other, updated]);

    await syncReviewItemToCache(
      'u1',
      item(1, 'grammar', NULL_DATE, { progress_cz_to_en: 0, mastered_at_cz_to_en: NOW }),
    );

    expect(await getPrefetchedReviewItems('u1', 'grammar')).toEqual([other]);
  });
});

function item(
  itemId: number,
  _reviewKind: ReviewKind,
  nextAt = '2026-01-01T10:00:00.000Z',
  overrides: Partial<PracticeDeckItem> = {},
): PracticeDeckItem {
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
    is_vocabulary: _reviewKind === 'vocabulary' ? 1 : 0,
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
