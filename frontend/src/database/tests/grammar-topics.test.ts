import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  groups: [] as any[],
  relations: [] as any[],
  startedGroups: [] as any[],
}));

vi.mock('@/database/models/db', () => ({
  db: {
    grammar_topics: {},
    groups: { filter: () => ({ toArray: async () => mocks.groups }) },
    group_relations: { filter: () => ({ toArray: async () => mocks.relations }) },
  },
}));

vi.mock('@/database/models/groups', () => ({
  default: { getStartedByUser: async () => mocks.startedGroups },
}));

import GrammarTopic from '@/database/models/grammar-topics';

describe('GrammarTopic.getInitiated', () => {
  beforeEach(() => {
    mocks.groups = [
      { id: 100, type: 'grammar', name: 'Tense', sort_order: 1, deleted_at: null },
      { id: 101, type: 'grammar', name: 'Present', sort_order: 2, deleted_at: null },
      { id: 102, type: 'grammar', name: 'Third person', note: 'Add s', sort_order: 3, deleted_at: null },
      { id: 103, type: 'grammar', name: 'Question', sort_order: 4, deleted_at: null },
    ];
    mocks.relations = [
      { id: 1, parent_group_id: 100, child_group_id: 101, relation_type: 'hierarchy', sort_order: 1, deleted_at: null },
      { id: 2, parent_group_id: 101, child_group_id: 102, relation_type: 'detail', sort_order: 1, deleted_at: null },
      { id: 3, parent_group_id: 101, child_group_id: 103, relation_type: 'detail', sort_order: 2, deleted_at: null },
    ];
    mocks.startedGroups = [
      { ...mocks.groups[2], examples: [{ item_id: 1, english: 'works' }] },
      { ...mocks.groups[3], examples: [{ item_id: 2, english: 'Does it work?' }] },
    ];
  });

  it('builds the initiated three-level grammar hierarchy from group relations', async () => {
    await expect(GrammarTopic.getInitiated('u1')).resolves.toEqual([
      {
        ...mocks.groups[0],
        groups: [
          {
            ...mocks.groups[1],
            grammar_topic_id: 100,
            kind: 'group',
            chunks: [
              { ...mocks.groups[2], grammar_group_id: 101, items: [{ item_id: 1, english: 'works' }] },
              { ...mocks.groups[3], grammar_group_id: 101, items: [{ item_id: 2, english: 'Does it work?' }] },
            ],
          },
        ],
      },
    ]);
  });

  it('hides hierarchy nodes without started example items', async () => {
    mocks.startedGroups = [];
    await expect(GrammarTopic.getInitiated('u1')).resolves.toEqual([]);
  });
});
