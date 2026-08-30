import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reload: vi.fn(),
  recordReviewAnswer: vi.fn(),
  continueReview: vi.fn(),
  deleteByUserId: vi.fn(),
  applyPracticeProgress: vi.fn(),
  getReadyReviewState: vi.fn(),
  resetHint: vi.fn(),
  resetQuestionState: vi.fn(),
  renderStates: [] as Array<{ itemId: number | null; revealed: boolean }>,
  transitionEvents: [] as string[],
  fetchData: null as any,
}));

vi.mock('@/config/config', () => ({
  default: {
    practice: { reviewStarSize: 20, starsPerRow: 10 },
  },
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
    getReadyReviewState: (...args: unknown[]) => mocks.getReadyReviewState(...args),
  },
}));
vi.mock('@/database/models/practice-sessions', () => ({
  default: {
    recordReviewAnswer: (...args: unknown[]) => mocks.recordReviewAnswer(...args),
    continueReview: (...args: unknown[]) => mocks.continueReview(...args),
    deleteByUserId: (...args: unknown[]) => mocks.deleteByUserId(...args),
  },
}));
vi.mock('@/database/utils/practice-content.utils', () => ({ loadReviewSessionDeck: vi.fn() }));
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
    mocks.renderStates.length = 0;
    mocks.transitionEvents.length = 0;
    mocks.fetchData = reviewDeckResult(reviewSession(7), [entry(1), entry(2)]);
    mocks.applyPracticeProgress.mockImplementation((item) => ({ ...item, updated_at: 'now' }));
    mocks.recordReviewAnswer.mockResolvedValue({
      completedCount: 8,
      earnedStar: false,
      starCount: null,
    });
    mocks.getReadyReviewState.mockResolvedValue({ reviewReadyAt: null });
    mocks.continueReview.mockResolvedValue(undefined);
    mocks.deleteByUserId.mockResolvedValue(undefined);
    mocks.reload.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('restores the persisted answer count independently of the fetched deck', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.progressLabel).toBe('7/20');
  });

  it('uses zero and the configured target for a new review session', async () => {
    mocks.fetchData = reviewDeckResult(reviewSession(0), [entry(1), entry(2)]);

    const { result } = renderHook(() => usePracticeDeck('u1'));

    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    expect(result.current.progressLabel).toBe('0/20');
  });

  it('uses the persisted target when resuming an existing review session', async () => {
    mocks.fetchData = reviewDeckResult(reviewSession(2, 12), [entry(1), entry(2)]);

    const { result } = renderHook(() => usePracticeDeck('u1'));

    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    expect(result.current.progressLabel).toBe('2/12');
  });

  it('keeps the counter hidden until the persisted session is available', async () => {
    mocks.fetchData = null;

    const { result } = renderHook(() => usePracticeDeck('u1'));

    expect(result.current.sessionLoading).toBe(true);
    expect(result.current.progressLabel).toBe('');

    expect(result.current.progressLabel).toBe('');
  });

  it('does not reload repeatedly when rerendered with an initial route deck', () => {
    const initialDeck = [entry(1), entry(2)];
    const { rerender } = renderHook(() => usePracticeDeck('u1', initialDeck));

    expect(mocks.reload).toHaveBeenCalledTimes(1);

    rerender();

    expect(mocks.reload).toHaveBeenCalledTimes(1);
  });

  it('persists every answer before advancing to the next deck item', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    await act(async () => result.current.nextItem('correct'));
    expect(mocks.recordReviewAnswer).toHaveBeenCalledOnce();
    expect(result.current.currentItem?.item_id).toBe(2);
    expect(result.current.progressLabel).toBe('8/20');
  });

  it('resets reveal before showing the next audio-less item', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));

    act(() => result.current.setRevealed(true));
    mocks.renderStates.length = 0;
    mocks.transitionEvents.length = 0;

    await act(async () => result.current.nextItem('correct'));

    expect(result.current.currentItem?.item_id).toBe(2);
    expect(mocks.renderStates).not.toContainEqual({ itemId: 2, revealed: true });
    expect(mocks.transitionEvents[0]).toBe('reset');
  });

  it('shows the completed target during celebration and resets the next series', async () => {
    mocks.fetchData = reviewDeckResult(reviewSession(19), [entry(1)]);
    mocks.recordReviewAnswer.mockResolvedValue({
      completedCount: 20,
      earnedStar: true,
      starCount: 11,
    });
    mocks.getReadyReviewState.mockResolvedValue({ reviewReadyAt: new Date().toISOString() });
    let resolveReload!: () => void;
    mocks.reload.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveReload = resolve;
      }),
    );
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    act(() => result.current.setRevealed(true));
    expect(result.current.revealed).toBe(true);
    let answerPromise: Promise<void> | undefined;
    act(() => {
      answerPromise = result.current.nextItem('correct');
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.progressLabel).toBe('20/20');
    expect(result.current.celebratingStar).toBe(true);
    expect(result.current.celebrationStarTier).toBe('silver');
    expect(result.current.revealed).toBe(false);

    expect(mocks.getReadyReviewState).not.toHaveBeenCalled();
    expect(result.current.celebratingStar).toBe(true);

    await act(async () => {
      result.current.acknowledgeCelebration();
      await Promise.resolve();
    });

    expect(result.current.celebratingStar).toBe(true);
    expect(mocks.getReadyReviewState).toHaveBeenCalledWith('u1');

    await act(async () => {
      resolveReload();
      await answerPromise;
    });

    expect(mocks.continueReview).toHaveBeenCalledWith('u1');
    expect(result.current.progressLabel).toBe('0/20');
    expect(result.current.celebratingStar).toBe(false);
  });

  it('finalizes a completed review session when the celebration unmounts', async () => {
    mocks.fetchData = reviewDeckResult(reviewSession(19), [entry(1)]);
    mocks.recordReviewAnswer.mockResolvedValue({
      completedCount: 20,
      earnedStar: true,
      starCount: 11,
    });
    const { result, unmount } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));

    let answerPromise: Promise<void> | undefined;
    act(() => {
      answerPromise = result.current.nextItem('correct');
    });
    await waitFor(() => expect(result.current.celebratingStar).toBe(true));

    unmount();
    await answerPromise;

    expect(mocks.getReadyReviewState).toHaveBeenCalledWith('u1');
    expect(mocks.deleteByUserId).toHaveBeenCalledWith('u1');
  });

  it('ends an abandoned review session without awarding a star', async () => {
    mocks.fetchData = { entries: [], session: null, abandoned: true };

    const { result } = renderHook(() => usePracticeDeck('u1'));

    await waitFor(() => expect(result.current.finishedReview).toBe(true));
    expect(result.current.progressLabel).toBe('');
    expect(mocks.deleteByUserId).not.toHaveBeenCalled();
  });
});

function reviewDeckResult(session: ReturnType<typeof reviewSession>, entries: any[]) {
  return { entries, session, abandoned: false };
}

function entry(itemId: number): PracticeDeckEntry {
  return {
    item: {
      item_id: itemId,
      user_id: 'u1',
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
      progress_history: [],
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

function reviewSession(completedCount: number, targetCount = 20) {
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
