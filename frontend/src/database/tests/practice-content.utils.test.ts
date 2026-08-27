import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PracticeDeckItem, UserItemLocal } from '@/types/user-item.types';

const mocks = vi.hoisted(() => ({
  notesBulkGet: vi.fn(),
  grammarBulkGet: vi.fn(),
  grammarGroupGet: vi.fn(),
  addExamples: vi.fn(),
  getReviewDeck: vi.fn(),
  getByItemIds: vi.fn(),
  getPronunciationPracticeDeck: vi.fn(),
  startReview: vi.fn(),
  continueReview: vi.fn(),
  put: vi.fn(),
  deleteByUserId: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    notes: { bulkGet: (...args: unknown[]) => mocks.notesBulkGet(...args) },
    grammar_chunks: { bulkGet: (...args: unknown[]) => mocks.grammarBulkGet(...args) },
    grammar_groups: { get: (...args: unknown[]) => mocks.grammarGroupGet(...args) },
  },
}));

vi.mock('@/database/models/grammar-chunks', () => ({
  default: {
    addExamples: (...args: unknown[]) => mocks.addExamples(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getReviewDeck: (...args: unknown[]) => mocks.getReviewDeck(...args),
    getByItemIds: (...args: unknown[]) => mocks.getByItemIds(...args),
    getPronunciationPracticeDeck: (...args: unknown[]) =>
      mocks.getPronunciationPracticeDeck(...args),
  },
}));

vi.mock('@/database/models/practice-sessions', () => ({
  default: {
    startReview: (...args: unknown[]) => mocks.startReview(...args),
    continueReview: (...args: unknown[]) => mocks.continueReview(...args),
    put: (...args: unknown[]) => mocks.put(...args),
    deleteByUserId: (...args: unknown[]) => mocks.deleteByUserId(...args),
  },
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '9999-12-31' },
    practice: { reviewStarSize: 20 },
  },
}));

import {
  loadReviewDeck,
  loadReviewSessionDeck,
  resolvePracticeEntries,
  resolvePracticeGrammarContext,
} from '@/database/utils/practice-content.utils';

function makeItem(overrides: Partial<UserItemLocal> = {}): UserItemLocal {
  return {
    user_id: 'u1',
    item_id: 1,
    czech: 'ahoj',
    english: 'hello',
    pronunciation: 'hello',
    audio: null,
    sort_order: 1,
    progress_cz_to_en: 0,
    progress_en_to_cz: 0,
    progress_history: [],
    note_id: 1,
    lesson_id: 1,
    updated_at: '2026-01-01',
    is_vocabulary: 1,
    has_pronunciation_practice: 0,
    block_id: 1,
    topic_id: -1,
    grammar_chunk_id: 10,
    started_at: '2026-01-01',
    deleted_at: '9999-12-31',
    next_at_cz_to_en: '2026-01-01',
    next_at_en_to_cz: '2026-01-01',
    mastered_at_cz_to_en: '9999-12-31',
    mastered_at_en_to_cz: '9999-12-31',
    curriculum_sort_path: [1, 1, 1],
    ...overrides,
  };
}

function makeGrammar(id: number) {
  return {
    id,
    name: `Grammar ${id}`,
    note: `Explanation ${id}`,
    grammar_group_id: 1,
    sort_order: id,
    deleted_at: null,
  };
}

describe('practice content resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notesBulkGet.mockResolvedValue([{ id: 1, name: 'Note', note: 'Body' }]);
    mocks.grammarBulkGet.mockResolvedValue([makeGrammar(10)]);
    mocks.grammarGroupGet.mockResolvedValue({
      id: 1,
      name: 'Basics',
      note: 'Group explanation',
      sort_order: 1,
      deleted_at: null,
    });
    mocks.addExamples.mockImplementation(async (_userId, grammar) => ({
      ...grammar,
      items: [],
    }));
    mocks.startReview.mockResolvedValue(reviewSession(4));
    mocks.getByItemIds.mockResolvedValue([]);
    mocks.put.mockResolvedValue(undefined);
    mocks.deleteByUserId.mockResolvedValue(undefined);
    mocks.continueReview.mockResolvedValue(null);
  });

  it('deduplicates relation ids and attaches resolved content without dropping items', async () => {
    const items = [makeItem(), makeItem({ item_id: 2 })];

    const entries = await resolvePracticeEntries('u1', items);

    expect(mocks.notesBulkGet).toHaveBeenCalledWith([1]);
    expect(mocks.grammarBulkGet).toHaveBeenCalledWith([10]);
    expect(mocks.addExamples).toHaveBeenCalledTimes(1);
    expect(entries).toHaveLength(2);
    expect(entries[0].note?.name).toBe('Note');
    expect(entries[1].grammar?.name).toBe('Grammar 10');
  });

  it('keeps grammar when the notes batch fails', async () => {
    const error = new Error('notes unavailable');
    mocks.notesBulkGet.mockRejectedValue(error);

    const [entry] = await resolvePracticeEntries('u1', [makeItem()]);

    expect(entry.note).toBeNull();
    expect(entry.grammar?.id).toBe(10);
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Failed to resolve practice notes',
      error,
      { noteIds: '1' },
    );
  });

  it('keeps notes when the grammar batch fails', async () => {
    const error = new Error('grammar unavailable');
    mocks.grammarBulkGet.mockRejectedValue(error);

    const [entry] = await resolvePracticeEntries('u1', [makeItem()]);

    expect(entry.note?.id).toBe(1);
    expect(entry.grammar).toBeNull();
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Failed to resolve practice grammar chunks',
      error,
      { grammarChunkIds: '10' },
    );
  });

  it('isolates an example-loading failure to its grammar chunk', async () => {
    const error = new Error('examples unavailable');
    mocks.grammarBulkGet.mockResolvedValue([makeGrammar(10), makeGrammar(20)]);
    mocks.addExamples.mockImplementation(async (_userId, grammar) => {
      if (grammar.id === 10) throw error;
      return { ...grammar, items: [] };
    });

    const entries = await resolvePracticeEntries('u1', [
      makeItem(),
      makeItem({ item_id: 2, grammar_chunk_id: 20 }),
    ]);

    expect(entries[0].grammar).toBeNull();
    expect(entries[1].grammar?.id).toBe(20);
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Failed to resolve practice grammar examples',
      error,
      { grammarChunkId: 10 },
    );
  });

  it('resolves the grammar group belonging to the requested chunk', async () => {
    const context = await resolvePracticeGrammarContext('u1', 10);

    expect(mocks.grammarGroupGet).toHaveBeenCalledWith(1);
    expect(context.grammar?.id).toBe(10);
    expect(context.grammarGroup?.note).toBe('Group explanation');
  });

  it('skips the grammar group lookup when no chunk is attached', async () => {
    await expect(resolvePracticeGrammarContext('u1', null)).resolves.toEqual({
      grammar: null,
      grammarGroup: null,
    });
    expect(mocks.grammarGroupGet).not.toHaveBeenCalled();
  });

  it('keeps the chunk when its grammar group cannot be loaded', async () => {
    const error = new Error('group unavailable');
    mocks.grammarGroupGet.mockRejectedValue(error);

    const context = await resolvePracticeGrammarContext('u1', 10);

    expect(context.grammar?.id).toBe(10);
    expect(context.grammarGroup).toBeNull();
    expect(mocks.reportError).toHaveBeenCalledWith(
      'Failed to resolve practice grammar group',
      error,
      { grammarGroupId: 1 },
    );
  });

  it('keeps missing relations null and propagates a core deck failure', async () => {
    mocks.notesBulkGet.mockResolvedValue([undefined]);
    mocks.grammarBulkGet.mockResolvedValue([undefined]);
    const item = { ...makeItem(), practice_direction: 'czToEn' } as PracticeDeckItem;
    mocks.getReviewDeck.mockResolvedValue([item]);

    await expect(loadReviewDeck('u1')).resolves.toEqual([
      { item, note: null, grammar: null },
    ]);

    const error = new Error('items unavailable');
    mocks.getReviewDeck.mockRejectedValue(error);
    await expect(loadReviewDeck('u1')).rejects.toBe(error);
  });

  it('loads only the remaining cards in an active review session', async () => {
    const items = Array.from({ length: 16 }, (_, index) => ({
      ...makeItem({ item_id: index + 1 }),
      practice_direction: 'czToEn' as const,
    }));
    mocks.getReviewDeck.mockResolvedValue(items);

    const result = await loadReviewSessionDeck('u1');

    expect(mocks.getReviewDeck).toHaveBeenCalledWith('u1', 16);
    expect(result).toMatchObject({
      session: expect.objectContaining({
        user_id: 'u1',
        mode: 'review',
        completed_count: 4,
        block_id: null,
        phase: null,
        current_queue_item_ids: [],
        retry_queue_item_ids: [],
        completed_item_ids: [],
        target_count: 20,
        review_queue: items.map((item) => ({ item_id: item.item_id, direction: 'czToEn' })),
      }),
      abandoned: false,
    });
    expect(result.entries).toHaveLength(16);
    expect(mocks.put).toHaveBeenCalledOnce();
  });

  it('abandons an incomplete review session when too few cards remain', async () => {
    mocks.getReviewDeck.mockResolvedValue([]);

    await expect(loadReviewSessionDeck('u1')).resolves.toEqual({
      entries: [],
      session: null,
      abandoned: true,
    });
    expect(mocks.deleteByUserId).toHaveBeenCalledWith('u1');
  });

  it('repairs a completed review session by starting a fresh full deck', async () => {
    mocks.startReview.mockResolvedValue(reviewSession(20));
    const fullDeck = Array.from({ length: 20 }, (_, index) => ({
      ...makeItem({ item_id: index + 1 }),
      practice_direction: 'czToEn' as const,
    }));
    const continuedSession = { ...reviewSession(0), review_queue: [] };
    mocks.continueReview.mockResolvedValue(continuedSession);
    mocks.getReviewDeck.mockResolvedValue(fullDeck);

    const result = await loadReviewSessionDeck('u1');

    expect(mocks.continueReview).toHaveBeenCalledWith('u1');
    expect(mocks.getReviewDeck).toHaveBeenCalledWith('u1', 20);
    expect(result.entries).toHaveLength(20);
    expect(result.session).toMatchObject({
      completed_count: 0,
      target_count: 20,
      review_queue: fullDeck.map((item) => ({ item_id: item.item_id, direction: 'czToEn' })),
    });
    expect(result.abandoned).toBe(false);
    expect(mocks.deleteByUserId).not.toHaveBeenCalled();
  });

  it('abandons a completed review session when a fresh full deck is unavailable', async () => {
    mocks.startReview.mockResolvedValue(reviewSession(20));
    mocks.continueReview.mockResolvedValue({ ...reviewSession(0), review_queue: [] });
    mocks.getReviewDeck.mockResolvedValue([]);

    await expect(loadReviewSessionDeck('u1')).resolves.toEqual({
      entries: [],
      session: null,
      abandoned: true,
    });

    expect(mocks.continueReview).toHaveBeenCalledWith('u1');
    expect(mocks.getReviewDeck).toHaveBeenCalledWith('u1', 20);
    expect(mocks.deleteByUserId).toHaveBeenCalledWith('u1');
  });

  it('resumes an active review session from its saved queue in order', async () => {
    const session = {
      ...reviewSession(18),
      review_queue: [
        { item_id: 3, direction: 'czToEn' as const },
        { item_id: 1, direction: 'enToCz' as const },
      ],
    };
    mocks.startReview.mockResolvedValue(session);
    mocks.getByItemIds.mockResolvedValue([
      makeItem({ item_id: 1 }),
      makeItem({ item_id: 3 }),
    ]);

    const result = await loadReviewSessionDeck('u1');

    expect(mocks.getByItemIds).toHaveBeenCalledWith('u1', [3, 1]);
    expect(mocks.getReviewDeck).not.toHaveBeenCalled();
    expect(result.entries.map((entry) => entry.item.item_id)).toEqual([3, 1]);
    expect(result.entries.map((entry) => entry.item.practice_direction)).toEqual([
      'czToEn',
      'enToCz',
    ]);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it('replaces a saved review queue when queued items are no longer available', async () => {
    const session = {
      ...reviewSession(18),
      review_queue: [
        { item_id: 1, direction: 'czToEn' as const },
        { item_id: 2, direction: 'czToEn' as const },
      ],
    };
    mocks.startReview.mockResolvedValue(session);
    mocks.getByItemIds.mockResolvedValue([makeItem({ item_id: 1 })]);
    const replacementItems = [
      { ...makeItem({ item_id: 3 }), practice_direction: 'enToCz' as const },
      { ...makeItem({ item_id: 4 }), practice_direction: 'enToCz' as const },
    ];
    mocks.getReviewDeck.mockResolvedValue(replacementItems);

    const result = await loadReviewSessionDeck('u1');

    expect(mocks.getReviewDeck).toHaveBeenCalledWith('u1', 2);
    expect(result.entries).toHaveLength(2);
    expect(result.session).toMatchObject({
      completed_count: 18,
      target_count: 20,
      review_queue: [
        { item_id: 3, direction: 'enToCz' },
        { item_id: 4, direction: 'enToCz' },
      ],
    });
    expect(mocks.put).toHaveBeenCalledOnce();
    expect(mocks.deleteByUserId).not.toHaveBeenCalled();
  });

  it('repairs a stale partial target when a full review deck is available', async () => {
    const staleQueue = Array.from({ length: 5 }, (_, index) => ({
      item_id: index + 1,
      direction: 'enToCz' as const,
    }));
    mocks.startReview.mockResolvedValue({
      ...reviewSession(0),
      target_count: 5,
      review_queue: staleQueue,
    });
    const fullDeck = Array.from({ length: 20 }, (_, index) => ({
      ...makeItem({ item_id: index + 1 }),
      practice_direction: 'enToCz' as const,
    }));
    mocks.getReviewDeck.mockResolvedValue(fullDeck);

    const result = await loadReviewSessionDeck('u1');

    expect(mocks.getByItemIds).not.toHaveBeenCalled();
    expect(mocks.getReviewDeck).toHaveBeenCalledWith('u1', 20);
    expect(result.entries).toHaveLength(20);
    expect(result.session).toMatchObject({
      completed_count: 0,
      target_count: 20,
      review_queue: fullDeck.map((item) => ({ item_id: item.item_id, direction: 'enToCz' })),
    });
    expect(mocks.put).toHaveBeenCalledOnce();
  });
});

function reviewSession(completedCount: number) {
  return {
    user_id: 'u1', mode: 'review' as const, completed_count: completedCount, target_count: 20,
    block_id: null, phase: null, current_queue_item_ids: [], retry_queue_item_ids: [],
    completed_item_ids: [], started_at: '2026-08-23', updated_at: '2026-08-23',
  };
}
