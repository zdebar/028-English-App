import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PracticeDeckEntry } from '@/types/user-item.types';

const mocks = vi.hoisted(() => ({
  reload: vi.fn(),
  savePracticeDeck: vi.fn(),
  applyPracticeProgress: vi.fn(),
  getNewlyAvailableReviewItemCount: vi.fn(),
  loadReviewCount: vi.fn(),
  loadReviewEntryDetails: vi.fn(),
  resetHint: vi.fn(),
  fetchData: null as ReviewDeckData | null,
}));

type ReviewDeckData = {
  entries: PracticeDeckEntry[];
  availabilityCheckedAt: string;
  abandoned: boolean;
};

vi.mock('../practice-availability-controller', () => ({
  beginPracticeAvailabilityBoundary: () => async () => {},
}));

vi.mock('@/hooks/use-fetch', () => ({
  useFetch: (_fetchFunction: unknown) => {
    const [data, setData] = React.useState(mocks.fetchData);
    return {
      data,
      loading: false,
      error: null,
      reload: async () => {
        await mocks.reload();
        setData(mocks.fetchData);
      },
    };
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    applyPracticeProgress: (...args: unknown[]) => mocks.applyPracticeProgress(...args),
    getNewlyAvailableReviewItemCount: (...args: unknown[]) =>
      mocks.getNewlyAvailableReviewItemCount(...args),
    savePracticeDeck: (...args: unknown[]) => mocks.savePracticeDeck(...args),
  },
}));

vi.mock('@/database/utils/practice-content.utils', () => ({
  loadReviewDeckData: vi.fn(),
  loadReviewCount: (...args: unknown[]) => mocks.loadReviewCount(...args),
  loadReviewEntryDetails: (...args: unknown[]) => mocks.loadReviewEntryDetails(...args),
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

vi.mock('@/features/logging/monitoring-handler', () => ({ reportError: vi.fn() }));

import { usePracticeDeck } from '../hooks/use-practice-deck';

describe('usePracticeDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchData = reviewDeckResult([entry(1), entry(2)]);
    mocks.reload.mockResolvedValue(undefined);
    mocks.applyPracticeProgress.mockImplementation((item) => ({ ...item, updated_at: 'now' }));
    mocks.getNewlyAvailableReviewItemCount.mockResolvedValue(0);
    mocks.loadReviewCount.mockResolvedValue({
      count: 2,
      countedThrough: '2026-06-24T10:00:00.000Z',
    });
    mocks.loadReviewEntryDetails.mockResolvedValue({ note: null, grammar: null });
    mocks.savePracticeDeck.mockResolvedValue(undefined);
  });

  it('loads the full batch and advances without saving each card', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));

    expect(result.current.currentItem?.item_id).toBe(2);
    expect(mocks.savePracticeDeck).not.toHaveBeenCalled();
    expect(mocks.reload).not.toHaveBeenCalled();
    expect(result.current.progressLabel).toBe('1 / 2');
  });

  it('bulk-saves once at the end of a batch and loads the next batch', async () => {
    mocks.savePracticeDeck.mockImplementationOnce(async (items: PracticeDeckEntry['item'][]) => {
      expect(items).toHaveLength(2);
      mocks.fetchData = reviewDeckResult([entry(3)]);
    });
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));
    await act(async () => result.current.nextItem('incorrect'));

    expect(mocks.savePracticeDeck).toHaveBeenCalledOnce();
    expect(mocks.getNewlyAvailableReviewItemCount).toHaveBeenCalledOnce();
    expect(mocks.reload).toHaveBeenCalledOnce();
    expect(result.current.currentItem?.item_id).toBe(3);
    expect(result.current.progressLabel).toBe('2 / 2');
  });

  it('extends the running counter with newly available items at a batch boundary', async () => {
    mocks.getNewlyAvailableReviewItemCount.mockResolvedValueOnce(1);
    mocks.fetchData = reviewDeckResult([entry(1)]);
    mocks.savePracticeDeck.mockImplementationOnce(async () => {
      mocks.fetchData = reviewDeckResult([entry(2)]);
    });
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));

    expect(result.current.progressLabel).toBe('1 / 3');
  });

  it('keeps the batch in memory when the bulk save fails', async () => {
    mocks.savePracticeDeck.mockRejectedValueOnce(new Error('save failed'));
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.progressLabel).toBe('0 / 2'));

    await act(async () => result.current.nextItem('correct'));
    await act(async () => result.current.nextItem('correct'));

    expect(result.current.error?.message).toBe('save failed');
    expect(mocks.reload).not.toHaveBeenCalled();
  });

  it('finishes when the next batch is empty', async () => {
    mocks.fetchData = reviewDeckResult([entry(1)]);
    mocks.savePracticeDeck.mockImplementationOnce(async () => {
      mocks.fetchData = { entries: [], availabilityCheckedAt: '2026-06-24T11:00:00.000Z', abandoned: true };
    });
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.nextItem('skip'));

    await waitFor(() => expect(result.current.finishedReview).toBe(true));
    expect(result.current.currentItem).toBeNull();
  });
});

function reviewDeckResult(entries: PracticeDeckEntry[]): ReviewDeckData {
  return {
    entries,
    availabilityCheckedAt: '2026-06-24T10:00:00.000Z',
    abandoned: false,
  };
}

function entry(itemId: number): PracticeDeckEntry {
  return {
    item: {
      user_id: 'u1',
      item_id: itemId,
      czech: 'ahoj',
      english: 'hello',
      pronunciation: '',
      audio: null,
      is_vocabulary: 1,
      sort_order: itemId,
      curriculum_sort_path: [1, 1, itemId],
      topic_id: 1,
      note_id: null,
      block_id: 1,
      grammar_chunk_id: 0,
      progress_cz_to_en: 0,
      started_at: '2026-01-01',
      updated_at: '2026-01-01',
      deleted_at: '9999-01-01',
      next_at_cz_to_en: '2026-01-01',
      mastered_at_cz_to_en: '9999-01-01',
      lesson_id: 1,
    },
    note: null,
    grammar: null,
  };
}
