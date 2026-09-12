import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';

const mocks = vi.hoisted(() => ({
  reload: vi.fn(),
  savePracticeDeck: vi.fn(),
  applyPracticeProgress: vi.fn(),
  getNewlyAvailableReviewItemCount: vi.fn(),
  resetHint: vi.fn(),
  resetQuestionState: vi.fn(),
  renderStates: [] as Array<{ itemId: number | null; revealed: boolean }>,
  transitionEvents: [] as string[],
  fetchData: null as any,
}));

vi.mock('@/config/config', () => ({
  default: { practice: { reviewMinimumSize: 20 } },
}));

vi.mock('@/hooks/use-fetch', () => ({
  useFetch: (_fetchFunction: unknown, options: { initialData?: unknown } = {}) => {
    const [data, setData] = React.useState(
      options.initialData !== undefined ? options.initialData : mocks.fetchData,
    );
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
}));

vi.mock('@/features/practice/hooks/use-practice-card-state', () => ({
  usePracticeCardState: ({ currentItem, revealed, setRevealed }: any) => {
    mocks.renderStates.push({ itemId: currentItem?.item_id ?? null, revealed });
    return {
      resetHint: mocks.resetHint,
      resetQuestionState: () => {
        mocks.transitionEvents.push('reset');
        mocks.resetQuestionState();
        setRevealed(false);
        mocks.resetHint();
      },
      czech: 'ahoj',
      english: revealed ? currentItem?.english : '\u00A0',
      audioDisabled: false,
      showDirectionChange: false,
      hideDirectionChange: vi.fn(),
      handleReveal: vi.fn(),
      plusHint: vi.fn(),
      audioError: false,
      playAudio: vi.fn(),
      audioLoading: false,
      isPlaying: false,
    };
  },
}));

vi.mock('@/routing/route-data-handoff', () => ({
  invalidateRouteData: vi.fn(),
  routeDataKey: vi.fn(() => 'practice'),
}));
vi.mock('@/features/logging/monitoring-handler', () => ({ reportError: vi.fn() }));

import { usePracticeDeck } from '../hooks/use-practice-deck';
import type { PracticeDeckEntry } from '@/types/user-item.types';

describe('usePracticeDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reload.mockResolvedValue(undefined);
    mocks.renderStates.length = 0;
    mocks.transitionEvents.length = 0;
    mocks.fetchData = reviewDeckResult([entry(1), entry(2)], 20);
    mocks.applyPracticeProgress.mockImplementation((item) => ({ ...item, updated_at: 'now' }));
    mocks.getNewlyAvailableReviewItemCount.mockResolvedValue(0);
    mocks.savePracticeDeck.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts the review counter at zero against the available directional review items', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1', mocks.fetchData));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.progressLabel).toBe('0 / 20');
  });

  it('loads and displays one item from a review direction', async () => {
    const entries = [entry(1)];
    mocks.fetchData = reviewDeckResult(entries, 2);

    const { result } = renderHook(() => usePracticeDeck('u1', mocks.fetchData));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.progressLabel).toBe('0 / 2');
    expect(result.current.currentItem?.item_id).toBe(1);
  });

  it('keeps the count across direction changes and refreshes available items after saving', async () => {
    mocks.savePracticeDeck.mockImplementationOnce(async () => {
      mocks.fetchData = reviewDeckResult([entry(2, 'enToCz')], 19);
    });
    const { result } = renderHook(() => usePracticeDeck('u1', mocks.fetchData));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setRevealed(true));
    mocks.renderStates.length = 0;
    mocks.transitionEvents.length = 0;

    await act(async () => result.current.nextItem('correct'));

    expect(mocks.savePracticeDeck).toHaveBeenCalledOnce();
    expect(mocks.getNewlyAvailableReviewItemCount).toHaveBeenCalledWith(
      'u1',
      '2026-06-24T10:00:00.000Z',
      expect.any(String),
    );
    expect(mocks.reload).toHaveBeenCalledOnce();
    expect(result.current.currentItem?.practice_direction).toBe('enToCz');
    expect(result.current.progressLabel).toBe('1 / 20');
    expect(mocks.transitionEvents[0]).toBe('reset');
    expect(mocks.renderStates).not.toContainEqual({ itemId: 2, revealed: true });
  });

  it.each(['correct', 'incorrect', 'skip'] as const)(
    'counts a successfully saved %s response as one practice',
    async (outcome) => {
      mocks.savePracticeDeck.mockImplementationOnce(async () => {
        mocks.fetchData = reviewDeckResult([entry(2)], 19);
      });
      const { result } = renderHook(() => usePracticeDeck('u1', mocks.fetchData));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => result.current.nextItem(outcome));

      expect(result.current.progressLabel).toBe('1 / 20');
    },
  );

  it('adds newly available review items to the running denominator', async () => {
    mocks.getNewlyAvailableReviewItemCount.mockResolvedValueOnce(1);
    mocks.savePracticeDeck.mockImplementationOnce(async () => {
      mocks.fetchData = reviewDeckResult([entry(2)], 500);
    });
    const { result } = renderHook(() => usePracticeDeck('u1', mocks.fetchData));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.nextItem('incorrect'));

    expect(result.current.progressLabel).toBe('1 / 21');
  });

  it('keeps the review view empty until review data is available', () => {
    mocks.fetchData = null;
    const { result } = renderHook(() => usePracticeDeck('u1', mocks.fetchData));

    expect(result.current.currentItem).toBeNull();
    expect(result.current.progressLabel).toBe('0 / 0');
  });

  it('does not increment the review counter when saving an answer fails', async () => {
    mocks.savePracticeDeck.mockRejectedValueOnce(new Error('save failed'));
    const { result } = renderHook(() => usePracticeDeck('u1', mocks.fetchData));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.nextItem('incorrect'));

    expect(result.current.progressLabel).toBe('0 / 20');
  });

  it('marks review complete when there is no next direction', async () => {
    mocks.fetchData = {
      entries: [],
      availableCount: 0,
      availabilityCheckedAt: '2026-06-24T10:00:00.000Z',
      abandoned: true,
    };

    const { result } = renderHook(() => usePracticeDeck('u1', mocks.fetchData));

    await waitFor(() => expect(result.current.finishedReview).toBe(true));
    expect(result.current.currentItem).toBeNull();
    expect(result.current.progressLabel).toBe('0 / 0');
  });
});

function reviewDeckResult(entries: PracticeDeckEntry[], availableCount: number) {
  return {
    entries,
    availableCount,
    availabilityCheckedAt: '2026-06-24T10:00:00.000Z',
    abandoned: false,
  };
}

function entry(itemId: number, direction: 'czToEn' | 'enToCz' = 'czToEn'): PracticeDeckEntry {
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
      progress_en_to_cz: 0,
      started_at: '2026-01-01',
      updated_at: '2026-01-01',
      deleted_at: '9999-01-01',
      next_at_cz_to_en: '2026-01-01',
      next_at_en_to_cz: '2026-01-01',
      mastered_at_cz_to_en: '9999-01-01',
      mastered_at_en_to_cz: '9999-01-01',
      lesson_id: 1,
      practice_direction: direction,
    },
    note: null,
    grammar: null,
  };
}
