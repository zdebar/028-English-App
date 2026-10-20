import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  groups: [] as any[],
  memberships: [] as any[],
  items: [] as any[],
  lessons: [] as any[],
  relations: [] as any[],
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    groups: {
      toArray: async () => mocks.groups,
      get: async (id: number) => mocks.groups.find((group) => group.id === id),
      where: () => ({
        anyOf: (ids: number[]) => ({ toArray: async () => mocks.groups.filter((group) => ids.includes(group.id)) }),
      }),
    },
    group_relations: {
      where: () => ({
        equals: () => ({
          filter: (predicate: (relation: any) => boolean) => ({
            toArray: async () => mocks.relations.filter(predicate),
          }),
        }),
      }),
    },
    group_items: {
      toArray: async () => mocks.memberships,
    },
    user_items: {
      where: () => ({ equals: () => ({ toArray: async () => mocks.items }) }),
    },
    user_lessons: {
      where: () => ({ equals: () => ({ toArray: async () => mocks.lessons }) }),
    },
    metadata: {},
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {},
}));

import PronunciationGroup from '@/database/models/pronunciation-groups';

function item(overrides: Record<string, unknown>) {
  return {
    user_id: 'u1',
    item_id: 1,
    czech: 'muž',
    english: 'man',
    audio: 'man.opus',
    is_vocabulary: 1,
    started_at: '2026-07-01T00:00:00.000Z',
    lesson_id: 1,
    deleted_at: '1970-01-01T00:00:00.000Z',
    curriculum_sort_path: [1, 1, 1],
    ...overrides,
  };
}

describe('PronunciationGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.groups = [
      {
        id: 1,
        type: 'pronunciation',
        name: '/æ/ × /e/',
        note: null,
        sort_order: 1,
        updated_at: '2026-07-01',
        deleted_at: null,
      },
    ];
    mocks.memberships = [
      { group_id: 1, item_id: 1, sort_order: 1 },
      { group_id: 1, item_id: 2, sort_order: 2 },
      { group_id: 1, item_id: 3, sort_order: 3 },
    ];
    mocks.lessons = [{ user_id: 'u1', lesson_id: 1, started_at: '2026-07-01T00:00:00.000Z' }];
    mocks.relations = [];
    mocks.items = [
      item({ item_id: 1, english: 'man' }),
      item({ item_id: 2, english: 'men', curriculum_sort_path: [1, 1, 2] }),
      item({
        item_id: 3,
        english: 'mat',
        curriculum_sort_path: [1, 1, 3],
        started_at: '1970-01-01T00:00:00.000Z',
      }),
    ];
  });

  it('shows ordered started examples and derives unlocked counts', async () => {
    await expect(PronunciationGroup.getOverview('u1')).resolves.toEqual([
      expect.objectContaining({
        id: 1,
        examples: ['man', 'men'],
        unlocked_count: 2,
        total_count: 2,
      }),
    ]);
  });

  it('includes an initial-training skip as an initiated example', async () => {
    mocks.items[1].started_at = '1970-01-01T00:00:00.000Z';
    mocks.items[1].mastered_at_cz_to_en = '2026-07-01T00:00:00.000Z';

    const overview = await PronunciationGroup.getOverview('u1');

    expect(overview[0]).toMatchObject({ unlocked_count: 2 });
  });

  it('returns groups ordered by id', async () => {
    mocks.groups = [
      { ...mocks.groups[0], id: 2, name: 'Second', sort_order: 2 },
      { ...mocks.groups[0], id: 1, name: 'First' },
    ];
    mocks.memberships = [
      { group_id: 1, item_id: 1, sort_order: 1 },
      { group_id: 1, item_id: 2, sort_order: 2 },
      { group_id: 2, item_id: 1, sort_order: 1 },
      { group_id: 2, item_id: 2, sort_order: 2 },
    ];

    const groups = await PronunciationGroup.getOverview('u1');

    expect(groups.map((group) => group.id)).toEqual([1, 2]);
  });

  it('hides groups when there are no started example items', async () => {
    mocks.items.forEach((entry) => {
      entry.started_at = '1970-01-01T00:00:00.000Z';
      delete entry.mastered_at_cz_to_en;
    });
    await expect(PronunciationGroup.getOverview('u1')).resolves.toEqual([]);
  });

  it('hides started items while their lesson is not started', async () => {
    mocks.lessons = [];
    await expect(PronunciationGroup.getOverview('u1')).resolves.toEqual([]);
  });

  it('keeps a started group visible even when its examples have no audio', async () => {
    mocks.items.forEach((entry) => {
      entry.audio = null;
    });

    await expect(PronunciationGroup.getOverview('u1')).resolves.toEqual([
      expect.objectContaining({ id: 1, examples: [], unlocked_count: 0, total_count: 0 }),
    ]);
  });

  it('returns detail in group item order', async () => {
    mocks.memberships = [
      { group_id: 1, item_id: 2, sort_order: 1 },
      { group_id: 1, item_id: 1, sort_order: 2 },
      { group_id: 1, item_id: 3, sort_order: 3 },
    ];

    const detail = await PronunciationGroup.getDetail('u1', 1);

    expect(detail?.items.map((entry) => entry.item_id)).toEqual([2, 1]);
  });

  it('includes non-vocabulary items when they have audio', async () => {
    mocks.items[1].is_vocabulary = 0;

    const detail = await PronunciationGroup.getDetail('u1', 1);

    expect(detail?.items.map((entry) => entry.item_id)).toEqual([1, 2]);
  });

  it('loads linked sound descriptions for a pronunciation group', async () => {
    mocks.groups.push({
      id: 50,
      type: 'sound',
      name: '/æ/',
      note: 'Open front vowel',
      sort_order: 1,
      updated_at: '2026-07-01',
      deleted_at: null,
    });
    mocks.relations = [{
      id: 1,
      parent_group_id: 1,
      child_group_id: 50,
      relation_type: 'contrast',
      sort_order: 1,
      deleted_at: null,
    }];

    const detail = await PronunciationGroup.getDetail('u1', 1);

    expect(detail?.sounds).toEqual([{ id: 50, name: '/æ/', note: 'Open front vowel' }]);
  });

});
