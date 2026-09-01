import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAudioMock = vi.fn();

class MockAudio {
  src = '';
  volume = 1;
  currentTime = 0;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn((attribute: string) => {
    if (attribute === 'src') this.src = '';
  });

  addEventListener() {}

  removeEventListener() {}
}

const audioInstances: MockAudio[] = [];

vi.mock('@/config/config', () => ({
  default: {
    practice: { audioDelay: 300 },
  },
}));

vi.mock('@/database/models/audio-records', () => ({
  default: {
    getByFilename: (...args: unknown[]) => getAudioMock(...args),
  },
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: vi.fn(),
}));

import type { UserItemLocal } from '@/types/user-item.types';
import { usePracticeCardState } from '../hooks/use-practice-card-state';

const failedAudioItem = createItem(1, 'missing.opus', 'missing');
const nextAudioItem = createItem(2, 'next.opus', 'next');

describe('usePracticeCardState audio transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioInstances.length = 0;
    vi.stubGlobal(
      'Audio',
      class extends MockAudio {
        constructor(src?: string) {
          super();
          this.src = src ?? '';
          audioInstances.push(this);
        }
      },
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob://audio-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('keeps the next enToCz item hidden after the previous audio failed', async () => {
    getAudioMock.mockImplementation((filename: string) => {
      if (filename === failedAudioItem.audio) return Promise.resolve(null);
      return Promise.resolve({ audioBlob: new Blob(['next']) });
    });

    const renders: Array<{ itemId: number; english: string | undefined }> = [];
    const setRevealed = vi.fn();
    const { result, rerender } = renderHook(
      ({ item, revealed }: { item: UserItemLocal; revealed: boolean }) => {
        const state = usePracticeCardState({
          currentItem: item,
          isCzToEn: false,
          revealed,
          setRevealed,
        });
        renders.push({ itemId: item.item_id, english: state.english });
        return state;
      },
      { initialProps: { item: failedAudioItem, revealed: true } },
    );

    await waitFor(() => expect(result.current.audioError).toBe(true));
    renders.length = 0;

    rerender({ item: nextAudioItem, revealed: false });

    expect(renders[0]).toEqual({ itemId: nextAudioItem.item_id, english: '\u00A0' });
    expect(
      renders.some(({ itemId, english }) => itemId === nextAudioItem.item_id && english === 'next'),
    ).toBe(false);

    await waitFor(() => expect(result.current.audioLoading).toBe(false));

    expect(result.current.english).toBe('\u00A0');
  });
});

function createItem(itemId: number, audio: string, english: string): UserItemLocal {
  return {
    user_id: 'u1',
    item_id: itemId,
    czech: 'ahoj',
    english,
    pronunciation: '',
    audio,
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
  };
}
