import { describe, expect, it } from 'vitest';
import type { GroupType } from '@/types/table.types';
import { splitPronunciationIntoSounds } from '../pronunciation.utils';

function sound(id: number, name: string, sort_order: number): GroupType {
  return {
    id,
    type: 'sound',
    name,
    note: `Poznámka k ${name}`,
    sort_order,
    updated_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
    sound_class: 'consonant',
    sound_category: 'other_consonant',
  };
}

describe('splitPronunciationIntoSounds', () => {
  it('uses the longest matching IPA symbol and preserves repeated sounds', () => {
    const sounds = [sound(1, 't', 1), sound(2, 'ʃ', 2), sound(3, 'tʃ', 3), sound(4, 'æ', 4), sound(5, 'p', 5)];

    expect(splitPronunciationIntoSounds('/tʃæptʃ/', sounds).map(({ name }) => name)).toEqual([
      'tʃ',
      'æ',
      'p',
      'tʃ',
    ]);
  });

  it('ignores stress, syllable, and length marks and skips unknown symbols', () => {
    const sounds = [sound(1, 'h', 1), sound(2, 'ə', 2), sound(3, 'l', 3), sound(4, 'oʊ', 4)];

    expect(splitPronunciationIntoSounds('həlˈoʊ ˌ☃', sounds).map(({ name }) => name)).toEqual([
      'h',
      'ə',
      'l',
      'oʊ',
    ]);
  });

  it('returns no sounds when the transcription is empty or has no catalog matches', () => {
    const sounds = [sound(1, 'm', 1)];

    expect(splitPronunciationIntoSounds('', sounds)).toEqual([]);
    expect(splitPronunciationIntoSounds('θæ', sounds)).toEqual([]);
  });
});
