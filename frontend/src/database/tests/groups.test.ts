import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  groups: [] as any[],
  memberships: [] as any[],
  userItems: [] as any[],
  userLessons: [] as any[],
}));

vi.mock('@/config/config', () => ({
  default: { database: { nullReplacementDate: '9999-12-31' } },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    groups: { toArray: async () => mocks.groups },
    group_items: { toArray: async () => mocks.memberships },
    user_items: { where: () => ({ equals: () => ({ toArray: async () => mocks.userItems }) }) },
    user_lessons: { where: () => ({ equals: () => ({ toArray: async () => mocks.userLessons }) }) },
  },
}));

import Groups from '@/database/models/groups';

describe('Groups.getStartedByUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.groups = [
      { id: 1, type: 'topic', name: 'Visible', sort_order: 1, updated_at: '', deleted_at: null },
      { id: 2, type: 'topic', name: 'Locked', sort_order: 2, updated_at: '', deleted_at: null },
      { id: 3, type: 'topic', name: 'Unstarted lesson', sort_order: 3, updated_at: '', deleted_at: null },
    ];
    mocks.memberships = [
      { id: 1, group_id: 1, item_id: 10, sort_order: 1, deleted_at: null },
      { id: 2, group_id: 2, item_id: 20, sort_order: 1, deleted_at: null },
      { id: 3, group_id: 3, item_id: 30, sort_order: 1, deleted_at: null },
    ];
    mocks.userItems = [
      { item_id: 10, lesson_id: 100, started_at: '2026-01-01', deleted_at: '9999-12-31' },
      { item_id: 20, lesson_id: 200, started_at: '9999-12-31', deleted_at: '9999-12-31' },
      { item_id: 30, lesson_id: 300, started_at: '2026-01-01', deleted_at: '9999-12-31' },
    ];
    mocks.userLessons = [{ lesson_id: 100, started_at: '2026-01-01' }];
  });

  it('requires both an initiated example and a started lesson', async () => {
    const groups = await Groups.getStartedByUser('u1');
    expect(groups.map((group) => group.id)).toEqual([1]);
    expect(groups[0]?.examples.map((item) => item.item_id)).toEqual([10]);
  });

  it('filters by group type while keeping example membership order', async () => {
    mocks.groups[1] = { ...mocks.groups[1], type: 'grammar' };
    mocks.memberships.push(
      { id: 4, group_id: 1, item_id: 11, sort_order: 2, deleted_at: null },
      { id: 5, group_id: 1, item_id: 12, sort_order: 0, deleted_at: null },
    );
    mocks.userItems.push(
      { item_id: 11, lesson_id: 100, started_at: '2026-01-02', deleted_at: '9999-12-31' },
      { item_id: 12, lesson_id: 100, started_at: '2026-01-02', deleted_at: '9999-12-31' },
    );

    const groups = await Groups.getStartedByUser('u1', 'topic');
    expect(groups).toHaveLength(1);
    expect(groups[0]?.examples.map((item) => item.item_id)).toEqual([12, 10, 11]);
  });
});
