import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reload: vi.fn(),
  recordReviewAnswer: vi.fn(),
  applyPracticeProgress: vi.fn(),
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
  useFetch: (_fetchFunction: unknown, options: { initialData?: unknown } = {}) => ({
    data: options.initialData !== undefined ? options.initialData : mocks.fetchData,
    loading: false,
    error: null,
    reload: mocks.reload,
  }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    applyPracticeProgress: (...args: unknown[]) => mocks.applyPracticeProgress(...args),
  },
}));

vi.mock('@/database/models/practice-sessions', () => ({
  default: {
    recordReviewAnswer: (...args: unknown[]) => mocks.recordReviewAnswer(...args),
  },
}));

vi.mock('@/database/utils/practice-content.utils', () => ({
  loadReviewSessionDeck: vi.fn(),
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
    mocks.fetchData = reviewDeckResult(reviewSession(7, 20), [entry(1), entry(2)]);
    mocks.applyPracticeProgress.mockImplementation((item) => ({ ...item, updated_at: 'now' }));
    mocks.recordReviewAnswer.mockResolvedValue({ completedCount: 8 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('restores the persisted answer count and current item', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));

    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.progressLabel).toBe('7/20');
  });

  it('loads and displays a complete 150-item review direction', async () => {
    const entries = Array.from({ length: 150 }, (_, index) => entry(index + 1));
    mocks.fetchData = reviewDeckResult(reviewSession(0, 150), entries);

    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));

    expect(result.current.progressLabel).toBe('0/150');
    expect(result.current.currentItem?.item_id).toBe(1);
  });

  it('persists every answer before advancing and resets the question', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    act(() => result.current.setRevealed(true));
    mocks.renderStates.length = 0;
    mocks.transitionEvents.length = 0;

    await act(async () => result.current.nextItem('correct'));

    expect(mocks.recordReviewAnswer).toHaveBeenCalledOnce();
    expect(result.current.currentItem?.item_id).toBe(2);
    expect(result.current.progressLabel).toBe('8/20');
    expect(mocks.transitionEvents[0]).toBe('reset');
    expect(mocks.renderStates).not.toContainEqual({ itemId: 2, revealed: true });
  });

  it('keeps the counter hidden until a persisted session is available', () => {
    mocks.fetchData = null;
    const { result } = renderHook(() => usePracticeDeck('u1'));

    expect(result.current.sessionLoading).toBe(true);
    expect(result.current.progressLabel).toBe('');
  });

  it('marks review complete when there is no next direction', async () => {
    mocks.fetchData = { entries: [], session: null, abandoned: true };

    const { result } = renderHook(() => usePracticeDeck('u1'));

    await waitFor(() => expect(result.current.finishedReview).toBe(true));
    expect(result.current.currentItem).toBeNull();
    expect(result.current.progressLabel).toBe('');
  });
});

function reviewDeckResult(session: ReturnType<typeof reviewSession>, entries: PracticeDeckEntry[]) {
  return { entries, session, abandoned: false };
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
      has_pronunciation_practice: 0,
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
      practice_direction: 'czToEn' as const,
    },
    note: null,
    grammar: null,
  };
}

function reviewSession(completedCount: number, targetCount: number) {
  return {
    user_id: 'u1',
    mode: 'review' as const,
    completed_count: completedCount,
    target_count: targetCount,
    block_id: null,
    phase: null,
    current_queue_item_ids: [],
    retry_queue_item_ids: [],
    completed_item_ids: [],
    started_at: '2026-08-23',
    updated_at: '2026-08-23',
  };
}
