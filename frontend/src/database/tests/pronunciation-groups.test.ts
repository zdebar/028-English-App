import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  groups: [] as any[],
  memberships: [] as any[],
  items: [] as any[],
  updates: vi.fn(),
  transaction: vi.fn(),
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
    pronunciation_groups: {
      orderBy: (field: string) => ({
        toArray: async () =>
          field === 'id'
            ? [...mocks.groups].sort((left, right) => left.id - right.id)
            : mocks.groups,
      }),
      get: async (id: number) => mocks.groups.find((group) => group.id === id),
    },
    pronunciation_group_items: {
      toArray: async () => mocks.memberships,
      where: () => ({
        between: () => ({
          toArray: async () => mocks.memberships,
        }),
      }),
    },
    user_items: {
      where: (index: string) => {
        if (index === 'user_id') {
          return { equals: () => ({ toArray: async () => mocks.items }) };
        }
        return { anyOf: () => ({ toArray: async () => mocks.items }) };
      },
      update: (...args: unknown[]) => mocks.updates(...args),
    },
    metadata: {},
    transaction: (...args: unknown[]) => mocks.transaction(...args),
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
    has_pronunciation_practice: 0,
    curriculum_sort_path: [1, 1, 1, 1],
    ...overrides,
  };
}

describe('PronunciationGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.groups = [
      {
        id: 1,
        name: '/æ/ × /e/',
        note: null,
        sort_order: 1,
        updated_at: '2026-07-01',
        deleted_at: null,
      },
    ];
    mocks.memberships = [
      { pronunciation_group_id: 1, item_id: 1, contrast_set: 1, sort_order: 1 },
      { pronunciation_group_id: 1, item_id: 2, contrast_set: 1, sort_order: 2 },
      { pronunciation_group_id: 1, item_id: 3, contrast_set: 2, sort_order: 3 },
    ];
    mocks.items = [
      item({ item_id: 1, english: 'man', has_pronunciation_practice: 1 }),
      item({ item_id: 2, english: 'men', curriculum_sort_path: [1, 1, 1, 2] }),
      item({
        item_id: 3,
        english: 'mat',
        curriculum_sort_path: [1, 1, 1, 3],
        started_at: '1970-01-01T00:00:00.000Z',
      }),
    ];
    mocks.updates.mockResolvedValue(1);
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
  });

  it('shows a group with a complete contrast set and derives unlocked counts', async () => {
    await expect(PronunciationGroup.getOverview('u1')).resolves.toEqual([
      expect.objectContaining({
        id: 1,
        examples: ['man', 'men'],
        unlocked_count: 2,
        total_count: 3,
      }),
    ]);
  });

  it('returns groups ordered by id', async () => {
    mocks.groups = [
      { ...mocks.groups[0], id: 2, name: 'Second' },
      { ...mocks.groups[0], id: 1, name: 'First' },
    ];
    mocks.memberships = [
      { pronunciation_group_id: 1, item_id: 1, contrast_set: 1, sort_order: 1 },
      { pronunciation_group_id: 1, item_id: 2, contrast_set: 1, sort_order: 2 },
      { pronunciation_group_id: 2, item_id: 1, contrast_set: 1, sort_order: 1 },
      { pronunciation_group_id: 2, item_id: 2, contrast_set: 1, sort_order: 2 },
    ];

    const groups = await PronunciationGroup.getOverview('u1');

    expect(groups.map((group) => group.id)).toEqual([1, 2]);
  });

  it('hides groups whose contrast sets are incomplete', async () => {
    mocks.items[1].started_at = '1970-01-01T00:00:00.000Z';

    await expect(PronunciationGroup.getOverview('u1')).resolves.toEqual([]);
  });

  it('ignores started memberships without an assigned contrast set', async () => {
    mocks.memberships = mocks.memberships.map((membership) => ({
      ...membership,
      contrast_set: null,
    }));

    await expect(PronunciationGroup.getOverview('u1')).resolves.toEqual([]);
  });

  it('returns detail in curriculum order regardless of membership order', async () => {
    mocks.memberships = [
      { pronunciation_group_id: 1, item_id: 2, contrast_set: 1, sort_order: 1 },
      { pronunciation_group_id: 1, item_id: 1, contrast_set: 1, sort_order: 2 },
      { pronunciation_group_id: 1, item_id: 3, contrast_set: 2, sort_order: 3 },
    ];

    const detail = await PronunciationGroup.getDetail('u1', 1);

    expect(detail?.items.map((entry) => entry.item_id)).toEqual([1, 2]);
    expect(detail?.selected_count).toBe(1);
  });

  it('includes non-vocabulary items when they have audio', async () => {
    mocks.items[1].is_vocabulary = 0;

    const detail = await PronunciationGroup.getDetail('u1', 1);

    expect(detail?.items.map((entry) => entry.item_id)).toEqual([1, 2]);
  });

  it('bulk-adds only missing visible items with a shared timestamp', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-30T10:00:00.000Z'));

    await expect(PronunciationGroup.addAvailableItems('u1', 1)).resolves.toBe(1);

    expect(mocks.updates).toHaveBeenCalledTimes(1);
    expect(mocks.updates).toHaveBeenCalledWith(['u1', 2], {
      has_pronunciation_practice: 1,
      updated_at: '2026-07-30T10:00:00.000Z',
    });
    vi.useRealTimers();
  });
});
