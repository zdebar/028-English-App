import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  startLesson: vi.fn(),
  saveInitialTrainingProgress: vi.fn(),
  applyPracticeProgress: vi.fn(),
  syncReviewItemToCache: vi.fn(),
  invalidateNextInitialLesson: vi.fn(),
  resetQuestionState: vi.fn(),
  renderStates: [] as Array<{ itemId: number | null; revealed: boolean }>,
  transitionEvents: [] as string[],
}));

vi.mock('../practice-availability-controller', () => ({
  beginPracticeAvailabilityBoundary: () => async () => {},
}));

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '1970-01-01T00:00:00.000Z' },
    practice: {},
  },
}));
vi.mock('@/database/models/user-lessons', () => ({
  default: { startIfAllowed: (...args: unknown[]) => mocks.startLesson(...args) },
}));
vi.mock('@/database/models/lessons', () => ({ default: { getById: vi.fn() } }));
vi.mock('@/database/models/user-items', () => ({
  default: {
    savePracticeDeck: vi.fn(),
    saveInitialTrainingProgress: (...args: unknown[]) => mocks.saveInitialTrainingProgress(...args),
    applyPracticeProgress: (...args: unknown[]) => mocks.applyPracticeProgress(...args),
  },
}));
vi.mock('@/database/utils/practice-content.utils', () => ({
  resolvePracticeEntries: vi.fn(),
  resolvePracticeGrammarContext: vi.fn(),
}));
vi.mock('@/features/practice/hooks/use-practice-card-state', () => ({
  usePracticeCardState: ({ currentItem, revealed, setRevealed }: any) => {
    mocks.renderStates.push({ itemId: currentItem?.item_id ?? null, revealed });
    return {
      resetQuestionState: () => {
        mocks.transitionEvents.push('reset');
        mocks.resetQuestionState();
        setRevealed(false);
      },
      czech: currentItem?.czech,
      english: revealed ? currentItem?.english : '\u00A0',
      audioDisabled: false,
      handleReveal: () => setRevealed(true),
      plusHint: vi.fn(),
      audioError: false,
      playAudio: vi.fn(),
      audioLoading: false,
      isPlaying: false,
    };
  },
}));
vi.mock('@/features/logging/monitoring-handler', () => ({ reportError: vi.fn() }));
vi.mock('../review-prefetch', () => ({
  invalidateReviewArrays: vi.fn(),
  rebuildReviewArrays: vi.fn().mockResolvedValue(undefined),
  syncReviewItemToCache: (...args: unknown[]) => mocks.syncReviewItemToCache(...args),
}));vi.mock('../practice-prefetch', () => ({
  getPrefetchedNextInitialLesson: vi.fn(),
  invalidateNextInitialLesson: (...args: unknown[]) => mocks.invalidateNextInitialLesson(...args),
}));

import { useInitialTrainingDeck } from '../hooks/use-initial-training-deck';

const lesson = {
  id: 1,
  name: 'Lesson',
  note: null,
  level_id: 1,
  sort_order: 1,
  grammar_chunk_id: null,
  updated_at: '2026-01-01',
  deleted_at: null,
};
const items = [item(1), item(2)];
const initialData = {
  lesson,
  items,
  entries: items.map((value) => ({ item: value, note: null, grammar: null })),
  grammar: null,
  grammarGroup: null,
};

describe('useInitialTrainingDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.renderStates.length = 0;
    mocks.transitionEvents.length = 0;
    mocks.startLesson.mockResolvedValue(true);
    mocks.saveInitialTrainingProgress.mockResolvedValue(undefined);
    mocks.syncReviewItemToCache.mockResolvedValue(undefined);
    mocks.applyPracticeProgress.mockImplementation((item) => ({
      ...item,
      started_at: '2026-08-23',
    }));
  });

  it('starts the first ordered phase and persists progress after each answer', async () => {
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));
    expect(mocks.startLesson).toHaveBeenCalledWith('u1', 1, [1, 2]);
    await act(async () => result.current.nextKnown());
    expect(mocks.saveInitialTrainingProgress).toHaveBeenCalledWith(expect.objectContaining({ item_id: 1 }));
    expect(mocks.applyPracticeProgress).toHaveBeenCalledWith(
      expect.anything(),
      'correct',
      expect.any(String),
      { initialTraining: true },
    );
    expect(mocks.syncReviewItemToCache).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ item_id: 1 }),
    );
  });

  it('resets reveal before showing the next audio-less item', async () => {
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    act(() => result.current.handleReveal());
    mocks.renderStates.length = 0;
    mocks.transitionEvents.length = 0;

    await act(async () => result.current.nextKnown());

    expect(result.current.currentItem?.item_id).toBe(2);
    expect(mocks.renderStates).not.toContainEqual({ itemId: 2, revealed: true });
    expect(mocks.transitionEvents[0]).toBe('reset');
  });

  it('completes after the single ordered phase', async () => {
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.nextKnown());
    await act(async () => result.current.nextKnown());

    await waitFor(() => expect(result.current.isComplete).toBe(true));
    expect(result.current.progressLabel).toBe('2/2');
    expect(mocks.saveInitialTrainingProgress).toHaveBeenCalledTimes(2);
  });

  it('retries incorrect items before completing the phase', async () => {
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.nextRepeat());
    expect(result.current.currentItem?.item_id).toBe(2);

    await act(async () => result.current.nextKnown());
    expect(result.current.currentItem?.item_id).toBe(1);

    await act(async () => result.current.nextKnown());
    await waitFor(() => expect(result.current.isComplete).toBe(true));
    expect(mocks.saveInitialTrainingProgress).toHaveBeenCalledTimes(3);
  });

  it('passes the initial-training skip option for CZ-to-EN', async () => {
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.completeCurrent());

    expect(mocks.applyPracticeProgress).toHaveBeenCalledWith(
      expect.anything(),
      'skip',
      expect.any(String),
      { initialTraining: true },
    );
  });

  it('keeps the final card visible while completion is being persisted', async () => {
    let resolveCompletion!: (value: number) => void;
    mocks.saveInitialTrainingProgress.mockReturnValue(
      new Promise((resolve) => {
        resolveCompletion = resolve;
      }),
    );
    const { result, unmount } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    let completionPromise: Promise<void> | undefined;
    act(() => {
      completionPromise = result.current.nextKnown();
    });
    act(() => {
      void result.current.nextKnown();
    });
    expect(result.current.isComplete).toBe(false);
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(mocks.saveInitialTrainingProgress).toHaveBeenCalledOnce();

    await act(async () => {
      resolveCompletion(1);
      await completionPromise;
    });

    await waitFor(() => expect(result.current.isComplete).toBe(true));
    unmount();
  });

  it('keeps the final card and allows retry when completion persistence fails', async () => {
    mocks.saveInitialTrainingProgress
      .mockRejectedValueOnce(new Error('completion failed'))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.nextKnown());

    expect(result.current.isComplete).toBe(false);
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.error?.message).toBe('completion failed');
    expect(mocks.syncReviewItemToCache).not.toHaveBeenCalled();

    await act(async () => result.current.nextKnown());

    await waitFor(() => expect(result.current.isComplete).toBe(true));
    expect(mocks.saveInitialTrainingProgress).toHaveBeenCalledTimes(2);
    expect(mocks.syncReviewItemToCache).toHaveBeenCalledOnce();
  });
});

function item(itemId: number) {
  return {
    user_id: 'u1',
    item_id: itemId,
    czech: `cz${itemId}`,
    czech_description: null,
    english: `en${itemId}`,
    pronunciation: '',
    audio: null,
    is_vocabulary: 1 as const,
    sort_order: itemId,
    curriculum_sort_path: [1, 1, itemId] as [number, number, number],
    note_id: null,
    lesson_id: 1,
    topic_id: -1,
    grammar_chunk_id: 0,
    progress_cz_to_en: 0,
    progress_en_to_cz: 0,
    is_cz_to_en_enabled: true,
    is_en_to_cz_enabled: true,
    started_at: '1970-01-01T00:00:00.000Z',
    updated_at: '2026-01-01',
    deleted_at: '',
    next_at_cz_to_en: '1970-01-01T00:00:00.000Z',
    mastered_at_cz_to_en: '',
    next_at_en_to_cz: '',
    mastered_at_en_to_cz: '',
  };
}
