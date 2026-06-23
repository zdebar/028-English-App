import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserBlockType } from '@/types/generic.types';
import type { UserItemLocal } from '@/types/user-item.types';

const getFirstUnlockedGrammarBlockMock = vi.fn();
const markBlockMasteredMock = vi.fn();
const getByBlockIdMock = vi.fn();
const saveNewGrammarBlockCompletionMock = vi.fn();
const getGrammarByIdMock = vi.fn();
const addItemCountMock = vi.fn();
const playAudioMock = vi.fn();
const resetHintMock = vi.fn();
const plusHintMock = vi.fn();

vi.mock('@/config/config', () => ({
  default: {
    practice: { audioDelay: 300 },
  },
}));

vi.mock('@/database/models/user-blocks', () => ({
  default: {
    getFirstUnlockedGrammarBlock: (...args: unknown[]) =>
      getFirstUnlockedGrammarBlockMock(...args),
    markBlockMastered: (...args: unknown[]) => markBlockMasteredMock(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getByBlockId: (...args: unknown[]) => getByBlockIdMock(...args),
    saveNewGrammarBlockCompletion: (...args: unknown[]) =>
      saveNewGrammarBlockCompletionMock(...args),
  },
}));

vi.mock('@/database/models/grammar', () => ({
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

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    newGrammarRound: 'Round',
  },
}));

import { useNewGrammarPracticeDeck } from '../hooks/use-new-grammar-practice-deck';

function makeBlock(overrides: Partial<UserBlockType> = {}): UserBlockType {
  return {
    user_id: 'user-1',
    block_id: 10,
    name: 'Grammar block',
    note: '',
    lesson_id: 1,
    is_vocabulary: false,
    grammar_id: 20,
    sort_order: 1,
    progress: 0,
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
    progress: 0,
    progress_history: [],
    note_id: null,
    lesson_id: 1,
    updated_at: '2026-01-01',
    is_vocabulary: 0,
    block_id: 10,
    grammar_id: 20,
    started_at: '2026-01-01',
    deleted_at: '',
    next_at: '2026-01-01',
    mastered_at: '',
    ...overrides,
  };
}

describe('useNewGrammarPracticeDeck', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getFirstUnlockedGrammarBlockMock.mockResolvedValue(makeBlock());
    getByBlockIdMock.mockResolvedValue([makeItem()]);
    getGrammarByIdMock.mockResolvedValue({ id: 20, name: 'Articles', note: 'Grammar note' });
    addItemCountMock.mockResolvedValue(undefined);
    saveNewGrammarBlockCompletionMock.mockResolvedValue(undefined);
    markBlockMasteredMock.mockResolvedValue(undefined);
  });

  it('loads the first unlocked grammar block and exposes card state', async () => {
    const { result } = renderHook(() => useNewGrammarPracticeDeck('user-1'));

    await waitFor(() => expect(result.current.block?.block_id).toBe(10));

    expect(getFirstUnlockedGrammarBlockMock).toHaveBeenCalledWith('user-1');
    expect(getByBlockIdMock).toHaveBeenCalledWith('user-1', 10);
    expect(getGrammarByIdMock).toHaveBeenCalledWith(20);
    expect(result.current.currentItem?.item_id).toBe(1);
    expect(result.current.grammar?.name).toBe('Articles');
    expect(result.current.progressLabel).toBe('Round 1/4');
    expect(result.current.repeatDisabled).toBe(true);
  });

  it('uses the same reveal flow, including direction confirmation before audio reveal', async () => {
    const { result } = renderHook(() => useNewGrammarPracticeDeck('user-1'));

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

  it('repeat advances random rounds without completing the block', async () => {
    const { result } = renderHook(() => useNewGrammarPracticeDeck('user-1'));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));
    expect(result.current.repeatDisabled).toBe(true);

    await act(async () => {
      await result.current.nextKnown();
    });
    expect(result.current.repeatDisabled).toBe(true);
    await act(async () => {
      await result.current.nextKnown();
    });
    expect(result.current.repeatDisabled).toBe(false);
    await act(async () => {
      await result.current.nextRepeat();
    });

    expect(result.current.progressLabel).toBe('Round 3/4');
    expect(result.current.isComplete).toBe(false);
    expect(saveNewGrammarBlockCompletionMock).not.toHaveBeenCalled();
    expect(markBlockMasteredMock).not.toHaveBeenCalled();
    expect(addItemCountMock).toHaveBeenCalledTimes(3);
  });

  it('known advances random rounds and saves completion after the final round', async () => {
    const { result } = renderHook(() => useNewGrammarPracticeDeck('user-1'));

    await waitFor(() => expect(result.current.currentItem?.item_id).toBe(1));

    await act(async () => {
      await result.current.nextKnown();
    });
    await act(async () => {
      await result.current.nextKnown();
    });
    await act(async () => {
      await result.current.nextKnown();
    });
    await act(async () => {
      await result.current.nextKnown();
    });

    expect(result.current.isComplete).toBe(true);
    expect(saveNewGrammarBlockCompletionMock).toHaveBeenCalledWith(
      'user-1',
      10,
      expect.any(String),
    );
    expect(markBlockMasteredMock).toHaveBeenCalledWith('user-1', 10, expect.any(String));
    expect(addItemCountMock).toHaveBeenCalledTimes(4);
  });
});
