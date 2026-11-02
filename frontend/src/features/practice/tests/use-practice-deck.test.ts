import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PracticeDeckEntry } from '@/types/user-item.types';

const mocks = vi.hoisted(() => ({
  reload: vi.fn(),
  savePracticeDeck: vi.fn(),
  applyPracticeProgress: vi.fn(),
  resetHint: vi.fn(),
  fetchData: null as ReviewDeckData | null,
  directionDecks: {} as Record<string, ReviewDeckData>,
  dataState: { userId: 'u1', status: 'ready', nowIso: '2026-06-24T10:00:00.000Z', user_items: [] as PracticeDeckEntry['item'][] },
  availability: {
    grammarReviewReadyAt: null,
    vocabularyReviewReadyAt: null,
    grammarReviewDueCount: 0,
    vocabularyReviewDueCount: 2,
    nextReviewAt: null,
  },
  selectReviewDeck: vi.fn(),
  ensureDetailLoaded: vi.fn(),
}));

type ReviewDeckData = {
  entries: PracticeDeckEntry[];
  prefetchedEntries?: PracticeDeckEntry[];
  availabilityCheckedAt: string;
  abandoned: boolean;
  reviewKind: 'grammar' | 'vocabulary';
  reviewDirection: 'cz_to_en' | 'en_to_cz';
  availableCount?: number;
};

vi.mock('@/database/models/user-items', () => ({
  default: {
    applyPracticeProgress: (...args: unknown[]) => mocks.applyPracticeProgress(...args),
    savePracticeDeck: (...args: unknown[]) => mocks.savePracticeDeck(...args),
  },
}));

vi.mock('@/database/state/data-store', () => ({
  useDataManager: (selector: (state: any) => unknown) => selector(mocks.dataState),
  dataManagerStore: { getState: () => mocks.dataState },
}));

vi.mock('@/database/state/data-selectors', () => ({
  selectReviewDeck: (...args: unknown[]) => mocks.selectReviewDeck(...args),
  selectReviewAvailability: () => mocks.availability,
  compareReviewItems: (left: PracticeDeckEntry['item'], right: PracticeDeckEntry['item']) =>
    left.next_at_cz_to_en.localeCompare(right.next_at_cz_to_en),
}));

vi.mock('../hooks/use-review-entry-details', () => ({
  useReviewEntryDetails: (_userId: string | null, entry: PracticeDeckEntry | null) => ({
    note: null,
    grammar: null,
    noteAvailable: Boolean(entry?.item.note_id),
    grammarAvailable: entry?.item.is_vocabulary === 0,
    noteLoadFailed: false,
    grammarLoadFailed: false,
    ensureDetailLoaded: (...args: unknown[]) => mocks.ensureDetailLoaded(...args),
  }),
}));

vi.mock('@/features/practice/hooks/use-practice-card-state', () => ({
  usePracticeCardState: ({ currentItem, revealed, setRevealed }: any) => ({
    resetHint: mocks.resetHint,
    resetQuestionState: () => setRevealed(false),
    czech: currentItem?.czech ?? '',
    english: revealed ? currentItem?.english : '\u00A0',
    audioDisabled: false,
    handleReveal: vi.fn(),
    plusHint: vi.fn(),
    audioError: false,
    playAudio: vi.fn(),
    audioLoading: false,
    isPlaying: false,
  }),
}));

vi.mock('@/features/logging/logging-handler', () => ({ reportError: vi.fn() }));

import { usePracticeDeck } from '../hooks/use-practice-deck';

describe('usePracticeDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchData = reviewDeckResult([entry(1), entry(2)]);
    mocks.directionDecks = {};
    mocks.dataState = { userId: 'u1', status: 'ready', nowIso: '2026-06-24T10:00:00.000Z', user_items: [] };
    mocks.availability = {
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      grammarReviewDueCount: 2,
      vocabularyReviewDueCount: 2,
      nextReviewAt: null,
    };
    mocks.reload.mockResolvedValue(undefined);
    mocks.applyPracticeProgress.mockImplementation((item) => ({ ...item, updated_at: 'now' }));
    mocks.ensureDetailLoaded.mockResolvedValue(true);
    mocks.selectReviewDeck.mockImplementation((_state: unknown, _userId: string, _kind: string, direction?: string) =>
      direction ? mocks.directionDecks[direction] ?? reviewDeckResult([], direction as 'cz_to_en' | 'en_to_cz') : mocks.fetchData,
    );
    mocks.savePracticeDeck.mockImplementation(async (items: PracticeDeckEntry['item'][]) => {
      mocks.dataState = { ...mocks.dataState, user_items: [...mocks.dataState.user_items, ...items] };
      if ((mocks.fetchData?.reviewKind ?? 'grammar') === 'vocabulary') {
        mocks.availability.vocabularyReviewDueCount = Math.max(0, mocks.availability.vocabularyReviewDueCount - items.length);
      } else {
        mocks.availability.grammarReviewDueCount = Math.max(0, mocks.availability.grammarReviewDueCount - items.length);
      }
    });
  });

  it('saves each answered card while advancing to the next card', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));

    expect(result.current.currentItem?.item_id).toBe(2);
    expect(mocks.savePracticeDeck).toHaveBeenCalledOnce();
    expect(mocks.savePracticeDeck).toHaveBeenCalledWith([
      expect.objectContaining({ item_id: 1, updated_at: 'now' }),
    ]);
    expect(mocks.reload).not.toHaveBeenCalled();
    expect(result.current.progressLabel).toBe('1 / 2');
  });

  it('adds currently available prompts in both directions to the session total', async () => {
    const initialData = reviewDeckResult([entry(1), entry(2)], 'cz_to_en', 2);
    mocks.fetchData = initialData;
    mocks.availability.grammarReviewDueCount = 3;
    const { result } = renderHook(() => usePracticeDeck('u1', initialData));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));

    expect(result.current.progressLabel).toBe('1 / 3');
  });

  it('initializes the review queue from initial data before the first render', async () => {
    const initialData = reviewDeckResult([entry(7)]);
    mocks.fetchData = initialData;
    const { result } = renderHook(() => usePracticeDeck('u1', initialData));

    expect(result.current.currentItem?.item_id).toBe(7);
    expect(result.current.progressLabel).toBe('0 / 1');
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('marks an empty initial review queue as finished before the first render', () => {
    const initialData = reviewDeckResult([]);
    mocks.fetchData = initialData;
    const { result } = renderHook(() => usePracticeDeck('u1', initialData));

    expect(result.current.currentItem).toBeNull();
    expect(result.current.finishedReview).toBe(true);
    expect(result.current.progressLabel).toBe('0 / 0');
  });

  it('does not save an answered card again when leaving in the middle of a batch', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));
    expect(mocks.savePracticeDeck).toHaveBeenCalledOnce();

    await act(async () => result.current.finishPractice());

    expect(mocks.savePracticeDeck).toHaveBeenCalledOnce();
    expect(mocks.savePracticeDeck).toHaveBeenCalledWith([
      expect.objectContaining({ item_id: 1, updated_at: 'now' }),
    ]);
    expect(mocks.reload).not.toHaveBeenCalled();
  });

  it('resolves detail availability from the central data without a fetch', async () => {
    mocks.fetchData = reviewDeckResult([entry(1)]);

    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await expect(result.current.ensureDetailLoaded('grammar')).resolves.toBe(true);
    expect(mocks.ensureDetailLoaded).toHaveBeenCalledWith('grammar');
  });

  it('publishes the count after each saved answer in the prefetched queue', async () => {
    mocks.savePracticeDeck.mockImplementation(async (items: PracticeDeckEntry['item'][]) => {
      expect(items).toHaveLength(1);
      mocks.dataState = { ...mocks.dataState, user_items: [...mocks.dataState.user_items, ...items] };
      mocks.availability.grammarReviewDueCount = Math.max(
        0,
        mocks.availability.grammarReviewDueCount - items.length,
      );
      if (items[0].item_id === 2) mocks.fetchData = reviewDeckResult([entry(3)]);
    });
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));
    await act(async () => result.current.nextItem('incorrect'));

    expect(mocks.savePracticeDeck).toHaveBeenCalledTimes(2);
    expect(mocks.savePracticeDeck).toHaveBeenNthCalledWith(
      1,
      [expect.objectContaining({ item_id: 1, updated_at: 'now' })],
    );
    expect(mocks.savePracticeDeck).toHaveBeenNthCalledWith(
      2,
      [expect.objectContaining({ item_id: 2, updated_at: 'now' })],
    );
    expect(mocks.reload).not.toHaveBeenCalled();
    expect(result.current.currentItem?.item_id).toBe(2);
    expect(result.current.finishedReview).toBe(false);
    expect(result.current.progressLabel).toBe('2 / 2');
    expect(mocks.dataState.user_items).toHaveLength(2);
  });

  it('counts a final answer without adding a nonexistent next batch', async () => {
    mocks.fetchData = reviewDeckResult([entry(1)]);
    mocks.availability.grammarReviewDueCount = 1;
    mocks.savePracticeDeck.mockImplementation(async () => {
      mocks.availability.grammarReviewDueCount = 0;
      mocks.fetchData = reviewDeckResult([entry(2)]);
    });
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 1'));

    await act(async () => result.current.nextItem('correct'));

    expect(result.current.progressLabel).toBe('1 / 1');
  });

  it('keeps the batch in memory when an item save fails', async () => {
    mocks.savePracticeDeck.mockRejectedValue(new Error('save failed'));
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));
    await act(async () => result.current.nextItem('correct'));

    await waitFor(() => expect(result.current.error?.message).toBe('save failed'));
    expect(mocks.reload).not.toHaveBeenCalled();
    expect(result.current.currentItem?.item_id).toBe(1);
  });

  it('publishes a successful persistence result to the central data snapshot', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));

    expect(result.current.currentItem?.item_id).toBe(2);
    expect(mocks.dataState.user_items).toHaveLength(1);
  });

  it('keeps the active queue when a saved answer updates the central snapshot', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.nextItem('correct'));

    expect(result.current.currentItem?.item_id).toBe(2);
    expect(result.current.progressLabel).toBe('1 / 2');
  });

  it('finishes when the next batch is empty', async () => {
    mocks.fetchData = reviewDeckResult([entry(1)]);
    mocks.savePracticeDeck.mockImplementation(async () => {
      mocks.fetchData = {
        entries: [],
        availabilityCheckedAt: '2026-06-24T11:00:00.000Z',
        abandoned: true,
        reviewKind: 'vocabulary',
        reviewDirection: 'cz_to_en',
      };
    });
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.nextItem('skip'));

    expect(result.current.finishedReview).toBe(false);
    expect(result.current.currentItem?.item_id).toBe(1);
  });

  it('switches from CZ-to-EN to EN-to-CZ without reloading the CZ queue', async () => {
    mocks.fetchData = reviewDeckResult([entry(1)], 'cz_to_en', 2);
    mocks.applyPracticeProgress.mockImplementationOnce((item: PracticeDeckEntry['item']) => ({
      ...item,
      next_at_cz_to_en: '9999-01-01T00:00:00.000Z',
      updated_at: 'now',
    }));
    mocks.directionDecks.en_to_cz = reviewDeckResult([entry(2, 'en_to_cz')], 'en_to_cz', 2);
    mocks.directionDecks.cz_to_en = reviewDeckResult([], 'cz_to_en', 2);

    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));
    expect(result.current.progressLabel).toBe('0 / 2');

    await act(async () => result.current.nextItem('correct'));

    expect(result.current.currentItem?.item_id).toBe(2);
    expect(result.current.currentItem?.review_direction).toBe('en_to_cz');
    expect(result.current.progressLabel).toBe('1 / 2');
    expect(mocks.selectReviewDeck).toHaveBeenCalledWith(
      mocks.dataState,
      'u1',
      'grammar',
      'en_to_cz',
      expect.any(String),
    );
  });

  it('keeps the last card visible while the final batch is being saved', async () => {
    mocks.fetchData = reviewDeckResult([entry(1)]);
    let resolveSave!: () => void;
    mocks.savePracticeDeck.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      }),
    );
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    let answerPromise: Promise<void> | undefined;
    act(() => {
      answerPromise = result.current.nextItem('skip');
    });
    await waitFor(() => expect(mocks.savePracticeDeck).toHaveBeenCalledOnce());
    expect(result.current.finishedReview).toBe(false);
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(mocks.reload).not.toHaveBeenCalled();

    mocks.fetchData = {
      entries: [],
      availabilityCheckedAt: '2026-06-24T11:00:00.000Z',
      abandoned: true,
      reviewKind: 'vocabulary',
      reviewDirection: 'cz_to_en',
    };
    await act(async () => {
      resolveSave();
      await answerPromise;
    });

    expect(mocks.reload).not.toHaveBeenCalled();
    expect(result.current.finishedReview).toBe(false);
    expect(result.current.currentItem?.item_id).toBe(1);
  });

  it('retries a failed final save without counting the answer twice', async () => {
    mocks.fetchData = reviewDeckResult([entry(1)]);
    mocks.availability.grammarReviewDueCount = 1;
    mocks.savePracticeDeck.mockRejectedValueOnce(new Error('save failed'));
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.nextItem('correct'));

    await waitFor(() => expect(result.current.error?.message).toBe('save failed'));
    await waitFor(() => expect(result.current.retryPractice).toBeDefined());
    mocks.fetchData = reviewDeckResult([entry(2)]);
    mocks.savePracticeDeck.mockImplementation(async () => {
      mocks.availability.grammarReviewDueCount = 0;
    });

    await act(async () => result.current.retryPractice?.());

    expect(mocks.savePracticeDeck).toHaveBeenCalledTimes(2);
    expect(mocks.reload).not.toHaveBeenCalled();
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.finishedReview).toBe(false);
    expect(result.current.progressLabel).toBe('1 / 1');
  });

  it('does not reload after a successful final save', async () => {
    mocks.fetchData = reviewDeckResult([entry(1)]);
    mocks.availability.grammarReviewDueCount = 1;
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.nextItem('correct'));

    expect(mocks.savePracticeDeck).toHaveBeenCalledOnce();
    expect(result.current.finishedReview).toBe(false);
    expect(mocks.savePracticeDeck).toHaveBeenCalledOnce();
    expect(mocks.reload).not.toHaveBeenCalled();
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.progressLabel).toBe('1 / 1');
  });
});

function reviewDeckResult(
  entries: PracticeDeckEntry[],
  reviewDirection: 'cz_to_en' | 'en_to_cz' = 'cz_to_en',
  availableCount?: number,
): ReviewDeckData {
  return {
    entries,
    availabilityCheckedAt: '2026-06-24T10:00:00.000Z',
    abandoned: false,
    reviewKind: 'grammar',
    reviewDirection,
    availableCount,
  };
}

function entry(
  itemId: number,
  direction: 'cz_to_en' | 'en_to_cz' = 'cz_to_en',
): PracticeDeckEntry {
  return {
    item: {
      user_id: 'u1',
      item_id: itemId,
      review_direction: direction,
      progress_en_to_cz: 0,
      is_cz_to_en_enabled: true,
      is_en_to_cz_enabled: true,
      czech: 'ahoj',
      czech_description: null,
      english: 'hello',
      pronunciation: '',
      audio: null,
      is_vocabulary: 0,
      sort_order: itemId,
      curriculum_sort_path: [1, 1, itemId],
      note_id: null,
      progress_cz_to_en: 0,
      started_at: '2026-01-01',
      updated_at: '2026-01-01',
      deleted_at: '9999-01-01',
      next_at_cz_to_en: '2026-01-01',
      mastered_at_cz_to_en: '9999-01-01',
      next_at_en_to_cz: '2026-01-01',
      mastered_at_en_to_cz: '9999-01-01',
      lesson_id: 1,
    },
    note: null,
    grammar: null,
  };
}
