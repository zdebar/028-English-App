import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserBlockType } from '@/types/generic.types';
import type { UserItemLocal } from '@/types/user-item.types';

const getUserBlockByIdMock = vi.fn();
const markBlockMasteredMock = vi.fn();
const unlockBlockMock = vi.fn();
const getByBlockIdMock = vi.fn();
const savePracticeDeckMock = vi.fn();
const saveInitialTrainingBlockCompletionMock = vi.fn();
const getGrammarByIdMock = vi.fn();
const addItemCountMock = vi.fn();
const playAudioMock = vi.fn();
const resetHintMock = vi.fn();
const plusHintMock = vi.fn();

vi.mock('@/config/config', () => ({
  default: {
    practice: { audioDelay: 300 },
    progress: { skipProgress: 100 },
  },
}));

vi.mock('@/database/models/user-blocks', () => ({
  default: {
    getByBlockId: (...args: unknown[]) => getUserBlockByIdMock(...args),
    unlockBlock: (...args: unknown[]) => unlockBlockMock(...args),
    markBlockMastered: (...args: unknown[]) => markBlockMasteredMock(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getByBlockId: (...args: unknown[]) => getByBlockIdMock(...args),
    savePracticeDeck: (...args: unknown[]) => savePracticeDeckMock(...args),
    saveInitialTrainingBlockCompletion: (...args: unknown[]) =>
      saveInitialTrainingBlockCompletionMock(...args),
  },
}));

vi.mock('@/database/models/grammar-chunks', () => ({
  default: {
    getById: (...args: unknown[]) => getGrammarByIdMock(...args),
  },
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    addItemCount: (...args: unknown[]) => addItemCountMock(...args),
  },
}));

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: playAudioMock,
    audioError: false,
    loading: false,
    isPlaying: false,
  }),
}));

vi.mock('@/features/practice/hooks/use-hint', () => ({
  NBSP: '\u00A0',
  useHint: () => ({
    czechHinted: 'CZ_HINT',
    englishHinted: 'EN_HINT',
    resetHint: resetHintMock,
    plusHint: plusHintMock,
  }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: vi.fn(),
}));

import { useBlockTrainingDeck } from '../hooks/use-block-training-deck';

function makeBlock(overrides: Partial<UserBlockType> = {}): UserBlockType {
  return {
    user_id: 'user-1',
    block_id: 10,
    name: 'Grammar block',
    note: '',
    lesson_id: 1,
    is_vocabulary: false,
    grammar_chunk_id: 20,
    sort_order: 1,
    progress: 0,
    show_in_topics: true,
    is_practice_block: true,
    requires_initial_training: true,
    started_at: '2026-01-01',
    updated_at: '2026-01-01',
    next_at: '2026-01-01',
    mastered_at: '',
    deleted_at: '',
    ...overrides,
  };
}

function makeItem(overrides: Partial<UserItemLocal> = {}): UserItemLocal {
  return {
    user_id: 'user-1',
    item_id: 1,
    czech: 'ahoj',
    english: 'hello',
    pronunciation: 'hello-pron',
    audio: 'hello.opus',
    sort_order: 1,
    curriculum_sort_path: [1, 1, 1],
    progress: 0,
    progress_history: [],
    note_id: null,
    lesson_id: 1,
    updated_at: '2026-01-01',
    is_vocabulary: 0,
    is_practice_item: 1,
    requires_initial_training: true,
    block_id: 10,
    grammar_chunk_id: 20,
    started_at: '2026-01-01',
    deleted_at: '',
    next_at: '2026-01-01',
    mastered_at: '',
    ...overrides,
  };
}

describe('useBlockTrainingDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getUserBlockByIdMock.mockResolvedValue(makeBlock());
    getByBlockIdMock.mockResolvedValue([makeItem()]);
    getGrammarByIdMock.mockResolvedValue({ id: 20, name: 'Articles', note: 'Grammar note' });
    addItemCountMock.mockResolvedValue(undefined);
    savePracticeDeckMock.mockResolvedValue(undefined);
    saveInitialTrainingBlockCompletionMock.mockResolvedValue(undefined);
    markBlockMasteredMock.mockResolvedValue(undefined);
    unlockBlockMock.mockResolvedValue(undefined);
  });

  it('loads the selected training block and exposes card state', async () => {
    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.block?.block_id).toBe(10));

    expect(getUserBlockByIdMock).toHaveBeenCalledWith('user-1', 10);
    expect(getByBlockIdMock).toHaveBeenCalledWith('user-1', 10);
    expect(getGrammarByIdMock).toHaveBeenCalledWith(20);
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.grammar?.name).toBe('Articles');
    expect(result.current.progressLabel).toBe('1/2 · 0/1');
    expect('repeatDisabled' in result.current).toBe(false);
  });

  it('loads a grammarless block when it explicitly requires initial training', async () => {
    getUserBlockByIdMock.mockResolvedValue(
      makeBlock({ grammar_chunk_id: null, is_vocabulary: true }),
    );
    getByBlockIdMock.mockResolvedValue([makeItem({ grammar_chunk_id: 0, is_vocabulary: 1 })]);

    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.block?.block_id).toBe(10));

    expect(result.current.grammar).toBeNull();
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(getGrammarByIdMock).not.toHaveBeenCalled();
  });

  it('rejects a grammar-linked block that does not require initial training', async () => {
    getUserBlockByIdMock.mockResolvedValue(makeBlock({ requires_initial_training: false }));

    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.block).toBeNull();
    expect(getByBlockIdMock).not.toHaveBeenCalled();
    expect(getGrammarByIdMock).not.toHaveBeenCalled();
  });

  it('uses the same reveal flow, including direction confirmation before audio reveal', async () => {
    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    act(() => {
      result.current.handleReveal();
    });

    expect(playAudioMock).not.toHaveBeenCalled();
    expect(result.current.showDirectionChange).toBe(false);

    act(() => {
      result.current.handleReveal();
    });

    expect(playAudioMock).toHaveBeenCalledTimes(1);
    expect(result.current.revealed).toBe(true);
  });

  it('repeat in round 1 requeues the item after the original block pass', async () => {
    getByBlockIdMock.mockResolvedValue([
      makeItem({ item_id: 1, sort_order: 1 }),
      makeItem({ item_id: 2, sort_order: 2 }),
    ]);

    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => {
      await result.current.nextRepeat();
    });
    expect(result.current.currentItem?.item_id).toBe(2);
    expect(result.current.progressLabel).toBe('1/2 · 0/2');

    await act(async () => {
      await result.current.nextKnown();
    });
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.progressLabel).toBe('1/2 · 1/2');

    await act(async () => {
      await result.current.nextKnown();
    });

    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.progressLabel).toBe('2/2 · 0/2');
    expect(saveInitialTrainingBlockCompletionMock).not.toHaveBeenCalled();
    expect(markBlockMasteredMock).not.toHaveBeenCalled();
    expect(addItemCountMock).toHaveBeenCalledTimes(3);
  });

  it('repeat in round 2 requeues the item in the same round', async () => {
    getByBlockIdMock.mockResolvedValue([
      makeItem({ item_id: 1, sort_order: 1 }),
      makeItem({ item_id: 2, sort_order: 2 }),
    ]);

    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => {
      await result.current.nextKnown();
    });
    await act(async () => {
      await result.current.nextKnown();
    });
    expect(result.current.progressLabel).toBe('2/2 · 0/2');
    expect(result.current.currentItem?.item_id).toBe(1);

    await act(async () => {
      await result.current.nextKnown();
    });
    expect(result.current.currentItem?.item_id).toBe(2);

    await act(async () => {
      await result.current.nextRepeat();
    });
    expect(result.current.currentItem?.item_id).toBe(2);
    expect(result.current.progressLabel).toBe('2/2 · 1/2');
    expect(result.current.isComplete).toBe(false);

    await act(async () => {
      await result.current.nextKnown();
    });

    expect(result.current.isComplete).toBe(true);
    expect(saveInitialTrainingBlockCompletionMock).toHaveBeenCalledWith(
      'user-1',
      10,
      expect.any(String),
    );
    expect(unlockBlockMock).toHaveBeenCalledWith('user-1', 10, expect.any(String));
    expect(markBlockMasteredMock).toHaveBeenCalledWith('user-1', 10, expect.any(String));
    expect(addItemCountMock).toHaveBeenCalledTimes(5);
  });

  it('keeps running repeat waves until repeated items are marked known', async () => {
    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => {
      await result.current.nextRepeat();
    });
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.progressLabel).toBe('1/2 · 0/1');

    await act(async () => {
      await result.current.nextRepeat();
    });
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.progressLabel).toBe('1/2 · 0/1');

    await act(async () => {
      await result.current.nextKnown();
    });
    expect(result.current.progressLabel).toBe('2/2 · 0/1');
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.isComplete).toBe(false);
  });

  it('known advances two rounds and saves completion after the final round', async () => {
    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => {
      await result.current.nextKnown();
    });
    expect(result.current.progressLabel).toBe('2/2 · 0/1');

    await act(async () => {
      await result.current.nextKnown();
    });

    expect(result.current.isComplete).toBe(true);
    expect(saveInitialTrainingBlockCompletionMock).toHaveBeenCalledWith(
      'user-1',
      10,
      expect.any(String),
    );
    expect(unlockBlockMock).toHaveBeenCalledWith('user-1', 10, expect.any(String));
    expect(markBlockMasteredMock).toHaveBeenCalledWith('user-1', 10, expect.any(String));
    expect(addItemCountMock).toHaveBeenCalledTimes(2);
  });

  it('skip persists the current item immediately and removes it from later rounds', async () => {
    getByBlockIdMock.mockResolvedValue([
      makeItem({ item_id: 1, progress: 1, sort_order: 1 }),
      makeItem({ item_id: 2, sort_order: 2 }),
    ]);

    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => {
      await result.current.completeCurrent();
    });

    expect(savePracticeDeckMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          item_id: 1,
          progress: 101,
          progress_history: [expect.objectContaining({ progress: 101 })],
        }),
      ],
      expect.any(String),
    );
    expect(result.current.currentItem?.item_id).toBe(2);

    await act(async () => {
      await result.current.nextKnown();
    });

    expect(result.current.progressLabel).toBe('2/2 · 0/2');
    expect(result.current.currentItem?.item_id).toBe(2);

    await act(async () => {
      await result.current.nextKnown();
    });

    expect(result.current.isComplete).toBe(true);
    expect(addItemCountMock).toHaveBeenCalledTimes(3);
  });

  it('skipping all active items completes the block', async () => {
    const { result } = renderHook(() => useBlockTrainingDeck('user-1', 10));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => {
      await result.current.completeCurrent();
    });

    expect(result.current.isComplete).toBe(true);
    expect(savePracticeDeckMock).toHaveBeenCalledTimes(1);
    expect(saveInitialTrainingBlockCompletionMock).toHaveBeenCalledWith(
      'user-1',
      10,
      expect.any(String),
    );
    expect(markBlockMasteredMock).toHaveBeenCalledWith('user-1', 10, expect.any(String));
  });
});
