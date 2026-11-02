import { describe, expect, it } from 'vitest';
import { selectPreparedInitialLesson, selectReviewArrays, selectReviewDeck, selectTopicOverview } from '../data-selectors';
import { EMPTY_APP_DATA } from '../data-types';
import type { AppDataSnapshot } from '../data-types';
import type { LessonType } from '@/types/generic.types';
import type { GroupItemType, GroupType } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';

const NULL_DATE = '9999-12-31T23:59:59+00:00';

describe('central data selectors', () => {
  it('derives started topic overviews from one snapshot', () => {
    const snapshot = createSnapshot({
      groups: [createGroup({ id: 4, type: 'topic' })],
      group_items: [createMembership({ group_id: 4, item_id: 1 })],
      user_items: [createItem({ item_id: 1, started_at: '2026-01-01T00:00:00.000Z' })],
      user_lessons: [{ user_id: 'u1', lesson_id: 1, started_at: '2026-01-01T00:00:00.000Z' }],
    });

    expect(selectTopicOverview(snapshot, 'u1').map(({ id }) => id)).toEqual([4]);
    expect(selectTopicOverview(snapshot, 'u2')).toEqual([]);
  });

  it('derives both review directions and builds a due deck from the arrays', () => {
    const snapshot = createSnapshot({
      user_items: [
        createItem({ item_id: 1, is_vocabulary: 1, next_at_cz_to_en: NULL_DATE, progress_cz_to_en: 0 }),
        createItem({ item_id: 2, is_vocabulary: 0, next_at_cz_to_en: '2026-01-01T00:00:00.000Z' }),
        createItem({ item_id: 3, deleted_at: '2026-01-01T00:00:00.000Z' }),
        createItem({ item_id: 4, user_id: 'u2' }),
      ],
    });

    const arrays = selectReviewArrays(snapshot, 'u1');
    expect(arrays.vocabulary.map(({ item_id, review_direction }) => [item_id, review_direction])).toEqual([
      [1, 'cz_to_en'],
      [1, 'en_to_cz'],
    ]);
    expect(arrays.grammar.map(({ item_id }) => item_id)).toEqual([2, 2]);

    const deck = selectReviewDeck({ ...snapshot, reviewArrays: arrays }, 'u1', 'vocabulary', 'cz_to_en', '2026-01-02T00:00:00.000Z');
    expect(deck.entries.map(({ item }) => item.item_id)).toEqual([1]);
    expect(deck.reviewDirection).toBe('cz_to_en');
  });

  it('prepares the next initial lesson and resolves its note from the snapshot', () => {
    const lesson: LessonType = {
      id: 1,
      name: 'Lesson 1',
      note: null,
      level_id: 1,
      group_id: null,
      sort_order: 1,
      deleted_at: null,
    };
    const snapshot = createSnapshot({
      lessons: [lesson],
      notes: [{ id: 8, name: 'Note', note: 'Content', deleted_at: null, sort_order: 1 }],
      user_items: [createItem({ started_at: NULL_DATE, note_id: 8 })],
    });

    const prepared = selectPreparedInitialLesson(snapshot, 'u1');
    expect(prepared?.lesson).toEqual(lesson);
    expect(prepared?.entries[0]?.note?.name).toBe('Note');
  });
});

function createSnapshot(overrides: Partial<AppDataSnapshot> = {}): AppDataSnapshot {
  return { ...EMPTY_APP_DATA, ...overrides };
}

function createGroup(overrides: Partial<GroupType> = {}): GroupType {
  return {
    id: 1,
    name: 'Group',
    note: null,
    sort_order: 1,
    deleted_at: null,
    updated_at: '2026-01-01T00:00:00.000Z',
    type: 'topic',
    sound_class: null,
    sound_category: null,
    ...overrides,
  };
}

function createMembership(overrides: Partial<GroupItemType> = {}): GroupItemType {
  return {
    id: 1,
    group_id: 1,
    item_id: 1,
    sort_order: 1,
    updated_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
    ...overrides,
  };
}

function createItem(overrides: Partial<UserItemLocal> = {}): UserItemLocal {
  return {
    user_id: 'u1',
    item_id: 1,
    czech: 'ahoj',
    czech_description: null,
    english: 'hello',
    pronunciation: 'hello',
    audio: null,
    sort_order: 1,
    curriculum_sort_path: [1, 1, 1],
    progress_cz_to_en: 0,
    progress_en_to_cz: 0,
    is_cz_to_en_enabled: true,
    is_en_to_cz_enabled: true,
    note_id: null,
    lesson_id: 1,
    updated_at: '2026-01-01T00:00:00.000Z',
    is_vocabulary: 1,
    started_at: '2026-01-01T00:00:00.000Z',
    deleted_at: NULL_DATE,
    next_at_cz_to_en: NULL_DATE,
    mastered_at_cz_to_en: NULL_DATE,
    next_at_en_to_cz: NULL_DATE,
    mastered_at_en_to_cz: NULL_DATE,
    ...overrides,
  };
}
