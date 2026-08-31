import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reconcileActive: vi.fn(),
  startNew: vi.fn(),
  put: vi.fn(),
  recordInitialTrainingAnswer: vi.fn(),
  completeInitialTraining: vi.fn(),
  applyPracticeProgress: vi.fn(),
  resetQuestionState: vi.fn(),
  renderStates: [] as Array<{ itemId: number | null; revealed: boolean }>,
  transitionEvents: [] as string[],
}));

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '1970-01-01T00:00:00.000Z' },
    practice: { initialTrainingBatchSize: 8 },
  },
}));
vi.mock('@/database/models/practice-sessions', () => ({
  default: {
    reconcileActive: (...args: unknown[]) => mocks.reconcileActive(...args),
    startNew: (...args: unknown[]) => mocks.startNew(...args),
    put: (...args: unknown[]) => mocks.put(...args),
    recordInitialTrainingAnswer: (...args: unknown[]) => mocks.recordInitialTrainingAnswer(...args),
    completeInitialTraining: (...args: unknown[]) => mocks.completeInitialTraining(...args),
  },
}));
vi.mock('@/database/models/blocks', () => ({ default: { getById: vi.fn() } }));
vi.mock('@/database/models/user-items', () => ({
  default: {
    getByBlockId: vi.fn(),
    savePracticeDeck: vi.fn(),
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
      showDirectionChange: false,
      handleReveal: () => setRevealed(true),
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
  routeDataKey: vi.fn(),
}));
vi.mock('@/features/logging/monitoring-handler', () => ({ reportError: vi.fn() }));

import { useInitialTrainingDeck } from '../hooks/use-block-training-deck';

const block = {
  id: 10,
  name: 'Block',
  note: null,
  lesson_id: 1,
  grammar_chunk_id: null,
  updated_at: '2026-01-01',
  deleted_at: null,
};
const items = [item(1), item(2)];
const initialData = {
  block,
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
    mocks.reconcileActive.mockResolvedValue(null);
    mocks.startNew.mockResolvedValue(newSession());
    mocks.put.mockResolvedValue(undefined);
    mocks.recordInitialTrainingAnswer.mockResolvedValue(undefined);
    mocks.completeInitialTraining.mockResolvedValue(1);
    mocks.applyPracticeProgress.mockImplementation((item) => ({
      ...item,
      started_at: '2026-08-23',
    }));
  });

  it('starts the first ordered phase and persists progress after each answer', async () => {
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));
    await act(async () => result.current.nextKnown());
    expect(mocks.recordInitialTrainingAnswer).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'czToEn',
      expect.objectContaining({
        phase: 0,
        current_queue_item_ids: [2],
        completed_item_ids: [1],
      }),
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

  it('moves to the second ordered phase after completing the first phase', async () => {
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => result.current.nextKnown());
    await act(async () => result.current.nextKnown());

    expect(mocks.recordInitialTrainingAnswer).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      'czToEn',
      expect.objectContaining({
        phase: 1,
        current_queue_item_ids: [1, 2],
        completed_item_ids: [],
      }),
    );
  });

  it('restores the second ordered phase without reshuffling its saved queue', async () => {
    mocks.reconcileActive.mockResolvedValue({
      ...newSession(),
      phase: 1,
      current_queue_item_ids: [2, 1],
      completed_item_ids: [],
    });
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(2));
    expect(result.current.isCzToEn).toBe(false);
    expect(result.current.hasProgress).toBe(true);
  });

  it('shows the completed second-phase count and enters neutral completion', async () => {
    mocks.reconcileActive.mockResolvedValue({
      ...newSession(),
      phase: 1,
      completed_count: 1,
      current_queue_item_ids: [1],
      completed_item_ids: [2],
    });
    const { result } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    act(() => {
      void result.current.nextKnown();
    });

    await waitFor(() => expect(result.current.isComplete).toBe(true));
    expect(result.current.progressLabel).toBe('2/2 · 2/2');
  });

  it('persists New completion before rendering the neutral completion card', async () => {
    mocks.reconcileActive.mockResolvedValue({
      ...newSession(),
      phase: 1,
      completed_count: 1,
      current_queue_item_ids: [1],
      completed_item_ids: [2],
    });
    const { result, unmount } = renderHook(() => useInitialTrainingDeck('u1', initialData));
    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    let completionPromise: Promise<void> | undefined;
    act(() => {
      completionPromise = result.current.nextKnown();
    });
    await waitFor(() => expect(result.current.isComplete).toBe(true));

    await completionPromise;

    expect(mocks.completeInitialTraining).toHaveBeenCalledWith(
      'u1',
      [1, 2],
      expect.any(String),
      expect.anything(),
      'enToCz',
    );
    unmount();
  });
});

function newSession() {
  return {
    user_id: 'u1',
    mode: 'new' as const,
    completed_count: 0,
    target_count: 2,
    block_id: 10,
    phase: 0 as const,
    current_queue_item_ids: [1, 2],
    retry_queue_item_ids: [],
    completed_item_ids: [],
    started_at: '2026-08-23',
    updated_at: '2026-08-23',
  };
}

function item(itemId: number) {
  return {
    user_id: 'u1',
    item_id: itemId,
    czech: `cz${itemId}`,
    english: `en${itemId}`,
    pronunciation: '',
    audio: null,
    is_vocabulary: 1 as const,
    has_pronunciation_practice: 0 as const,
    sort_order: itemId,
    curriculum_sort_path: [1, 1, itemId] as [number, number, number],
    note_id: null,
    block_id: 10,
    topic_id: -1,
    grammar_chunk_id: 0,
    progress_cz_to_en: 0,
    progress_en_to_cz: 0,
    started_at: '1970-01-01T00:00:00.000Z',
    updated_at: '2026-01-01',
    deleted_at: '',
    next_at_cz_to_en: '1970-01-01T00:00:00.000Z',
    next_at_en_to_cz: '1970-01-01T00:00:00.000Z',
    mastered_at_cz_to_en: '',
    mastered_at_en_to_cz: '',
    lesson_id: 1,
  };
}
