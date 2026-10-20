import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  groups: [] as any[],
  memberships: [] as any[],
  items: [] as any[],
  lessons: [] as any[],
}));

vi.mock('@/config/config', () => ({
  default: { database: { nullReplacementDate: '9999-12-31T23:59:59+00:00' } },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    topics: {},
    groups: {
      toArray: async () => mocks.groups,
      get: async (id: number) => mocks.groups.find((group) => group.id === id),
    },
    group_items: { toArray: async () => mocks.memberships },
    user_items: {
      where: () => ({ equals: () => ({ toArray: async () => mocks.items }) }),
    },
    user_lessons: {
      where: () => ({ equals: () => ({ toArray: async () => mocks.lessons }) }),
    },
  },
}));

import Topic from '@/database/models/topics';

describe('Topic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.groups = [
      { id: 1, type: 'topic', name: 'Days', note: null, sort_order: 20, updated_at: '2026-08-01', deleted_at: null },
      { id: 2, type: 'topic', name: 'Months', note: null, sort_order: 5, updated_at: '2026-08-01', deleted_at: null },
      { id: 3, type: 'topic', name: 'Numbers', note: null, sort_order: 10, updated_at: '2026-08-01', deleted_at: null },
    ];
    mocks.memberships = [
      { group_id: 1, item_id: 10, sort_order: 1, deleted_at: null },
      { group_id: 2, item_id: 20, sort_order: 1, deleted_at: null },
      { group_id: 3, item_id: 30, sort_order: 1, deleted_at: null },
    ];
    mocks.items = [
      { user_id: 'u1', item_id: 10, lesson_id: 100, started_at: '2026-08-01', deleted_at: '9999-12-31T23:59:59+00:00', mastered_at_cz_to_en: '9999-12-31T23:59:59+00:00' },
      { user_id: 'u1', item_id: 20, lesson_id: 200, started_at: '2026-08-01', deleted_at: '9999-12-31T23:59:59+00:00', mastered_at_cz_to_en: '9999-12-31T23:59:59+00:00' },
      { user_id: 'u1', item_id: 30, lesson_id: 300, started_at: '9999-12-31T23:59:59+00:00', deleted_at: '9999-12-31T23:59:59+00:00', mastered_at_cz_to_en: '9999-12-31T23:59:59+00:00' },
    ];
    mocks.lessons = [
      { user_id: 'u1', lesson_id: 100, started_at: '2026-08-01' },
      { user_id: 'u1', lesson_id: 200, started_at: '2026-08-01' },
    ];
  });

  it('lists topic groups only when both lesson and example item are started', async () => {
    await expect(Topic.hasInitiatedByUserId('u1')).resolves.toBe(true);
    const topics = await Topic.getInitiatedByUserId('u1');
    expect(topics.map((topic) => topic.id)).toEqual([2, 1]);
  });

  it('returns topic metadata only for topic typed groups', async () => {
    await expect(Topic.getById(2)).resolves.toMatchObject({ id: 2, name: 'Months' });
    await expect(Topic.getById(99)).resolves.toBeNull();
    mocks.groups[0].type = 'grammar';
    await expect(Topic.getById(1)).resolves.toBeNull();
  });

  it('hides topic groups when lesson starts are missing', async () => {
    mocks.lessons = [];
    await expect(Topic.hasInitiatedByUserId('u1')).resolves.toBe(false);
    await expect(Topic.getInitiatedByUserId('u1')).resolves.toEqual([]);
  });
});
