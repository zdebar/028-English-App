import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reload: vi.fn(),
  startReview: vi.fn(),
  recordReviewAnswer: vi.fn(),
  continueReview: vi.fn(),
  deleteByUserId: vi.fn(),
  applyPracticeProgress: vi.fn(),
  getReadyReviewState: vi.fn(),
  resetHint: vi.fn(),
  fetchData: [] as any[],
}));

vi.mock('@/config/config', () => ({
  default: {
    practice: { reviewStarSize: 20, starsPerRow: 10, starCelebrationDurationMs: 2000 },
  },
}));
vi.mock('@/hooks/use-fetch', () => ({
  useFetch: () => ({ data: mocks.fetchData, loading: false, error: null, reload: mocks.reload }),
}));
vi.mock('@/database/models/user-items', () => ({
  default: {
    applyPracticeProgress: (...args: unknown[]) => mocks.applyPracticeProgress(...args),
    getReadyReviewState: (...args: unknown[]) => mocks.getReadyReviewState(...args),
  },
}));
vi.mock('@/database/models/practice-sessions', () => ({
  default: {
    startReview: (...args: unknown[]) => mocks.startReview(...args),
    recordReviewAnswer: (...args: unknown[]) => mocks.recordReviewAnswer(...args),
    continueReview: (...args: unknown[]) => mocks.continueReview(...args),
    deleteByUserId: (...args: unknown[]) => mocks.deleteByUserId(...args),
  },
}));
vi.mock('@/database/utils/practice-content.utils', () => ({ loadReviewDeck: vi.fn() }));
vi.mock('@/features/practice/hooks/use-practice-card-state', () => ({
  usePracticeCardState: () => ({
    resetHint: mocks.resetHint,
    czech: 'ahoj',
    english: 'hello',
    audioDisabled: false,
    showDirectionChange: false,
    hideDirectionChange: vi.fn(),
    handleReveal: vi.fn(),
    plusHint: vi.fn(),
    audioError: false,
    playAudio: vi.fn(),
    audioLoading: false,
    isPlaying: false,
  }),
}));
vi.mock('@/routing/route-data-handoff', () => ({
  invalidateRouteData: vi.fn(),
  routeDataKey: vi.fn(() => 'practice'),
}));
vi.mock('@/features/logging/monitoring-handler', () => ({ reportError: vi.fn() }));

import { usePracticeDeck } from '../hooks/use-practice-deck';

describe('usePracticeDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchData = [entry(1), entry(2)];
    mocks.startReview.mockResolvedValue(reviewSession(7));
    mocks.applyPracticeProgress.mockImplementation((item) => ({ ...item, updated_at: 'now' }));
    mocks.recordReviewAnswer.mockResolvedValue({
      completedCount: 8,
      earnedStar: false,
      starCount: null,
    });
    mocks.getReadyReviewState.mockResolvedValue({ readyCount: 0, schedule: [] });
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
    expect(mocks.startReview).toHaveBeenCalledWith('u1');
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.progressLabel).toBe('7/20');
  });

  it('uses zero and the configured target for a new review session', async () => {
    mocks.startReview.mockResolvedValue(reviewSession(0));

    const { result } = renderHook(() => usePracticeDeck('u1'));

    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    expect(result.current.progressLabel).toBe('0/20');
  });

  it('uses the persisted target when resuming an existing review session', async () => {
    mocks.startReview.mockResolvedValue(reviewSession(2, 12));

    const { result } = renderHook(() => usePracticeDeck('u1'));

    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    expect(result.current.progressLabel).toBe('2/12');
  });

  it('keeps the counter hidden until the persisted session is available', async () => {
    let resolveSession!: (session: ReturnType<typeof reviewSession>) => void;
    mocks.startReview.mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );

    const { result } = renderHook(() => usePracticeDeck('u1'));

    expect(result.current.sessionLoading).toBe(true);
    expect(result.current.progressLabel).toBe('');

    resolveSession(reviewSession(2));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    expect(result.current.progressLabel).toBe('2/20');
  });

  it('persists every answer before advancing to the next deck item', async () => {
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    await act(async () => result.current.nextItem('correct'));
    expect(mocks.recordReviewAnswer).toHaveBeenCalledOnce();
    expect(result.current.currentItem?.item_id).toBe(2);
    expect(result.current.progressLabel).toBe('8/20');
  });

  it('shows the completed target during celebration and resets the next series', async () => {
    mocks.startReview.mockResolvedValue(reviewSession(19));
    mocks.recordReviewAnswer.mockResolvedValue({ completedCount: 20, earnedStar: true, starCount: 11 });
    mocks.getReadyReviewState.mockResolvedValue({ readyCount: 20, schedule: [] });
    let resolveReload!: () => void;
    mocks.reload.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveReload = resolve;
      }),
    );
    const { result } = renderHook(() => usePracticeDeck('u1'));
    await waitFor(() => expect(result.current.sessionLoading).toBe(false));
    vi.useFakeTimers();

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

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.celebratingStar).toBe(true);

    await act(async () => {
      resolveReload();
      await answerPromise;
    });

    expect(mocks.continueReview).toHaveBeenCalledWith('u1');
    expect(result.current.progressLabel).toBe('0/20');
    expect(result.current.celebratingStar).toBe(false);
  });
});

function entry(itemId: number) {
  return {
    item: {
      item_id: itemId,
      user_id: 'u1',
      czech: 'ahoj',
      english: 'hello',
      pronunciation: '',
      audio: null,
      is_vocabulary: 1,
      is_practice_item: 1,
      has_pronunciation_practice: 0,
      sort_order: itemId,
      curriculum_sort_path: [1, 1, 1, itemId],
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
