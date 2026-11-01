import { db } from '@/database/models/db';
import Groups from '@/database/models/groups';
import type { GroupRelationType, GroupType } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';

export type GrammarChunkWithExamples = GroupType & { items: UserItemLocal[] };

export type GrammarGroupWithChunks = GroupType & {
  kind: 'group';
  chunks: GrammarChunkWithExamples[];
};

export type GrammarTopicWithGroups = GroupType & {
  groups: GrammarGroupWithChunks[];
};

/** Loads a grammar chunk with its user-specific examples. */
export async function getGrammarChunkDetail(
  userId: string,
  groupId: number,
): Promise<GrammarChunkWithExamples> {
  const group = await Groups.getById(groupId);
  if (group?.type !== 'grammar') throw new Error(`Grammar group ${groupId} not found.`);
  return getGrammarChunkWithExamples(userId, group);
}

/** Returns a grammar group with the user's ordered examples. */
export async function getGrammarChunkWithExamples(
  userId: string,
  group: GroupType,
): Promise<GrammarChunkWithExamples> {
  return { ...group, items: await Groups.getExamples(group.id, userId) };
}

/** Builds the initiated grammar overview from the three-level group hierarchy. */
export async function getInitiatedGrammarTopics(userId: string): Promise<GrammarTopicWithGroups[]> {
  const [groups, relations, startedGroups] = await Promise.all([
    db.groups.filter((group) => group.type === 'grammar' && !group.deleted_at).toArray(),
    db.group_relations.filter((relation) => !relation.deleted_at).toArray(),
    Groups.getStartedByUser(userId, 'grammar'),
  ]);
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const startedById = new Map(startedGroups.map((group) => [group.id, group]));
  const hierarchy = relations
    .filter((relation) => relation.relation_type === 'hierarchy')
    .sort(compareRelations);
  const details = relations
    .filter((relation) => relation.relation_type === 'detail')
    .sort(compareRelations);
  const detailsByParentId = new Map<number, GroupRelationType[]>();
  for (const relation of details) {
    const childRelations = detailsByParentId.get(relation.parent_group_id) ?? [];
    childRelations.push(relation);
    detailsByParentId.set(relation.parent_group_id, childRelations);
  }
  const middleByRoot = new Map<number, GrammarGroupWithChunks[]>();

  for (const rootRelation of hierarchy) {
    const root = groupById.get(rootRelation.parent_group_id);
    const middle = groupById.get(rootRelation.child_group_id);
    if (!root || !middle) continue;
    const chunkRelations = detailsByParentId.get(middle.id);
    if (!chunkRelations) continue;

    const chunks = chunkRelations
      .flatMap((relation) => {
        const chunk = groupById.get(relation.child_group_id);
        const started = startedById.get(relation.child_group_id);
        if (!chunk || !started) return [];
        const value: GrammarChunkWithExamples = {
          ...chunk,
          items: started.examples,
        };
        return [value];
      });
    if (chunks.length === 0) continue;

    const value: GrammarGroupWithChunks = {
      ...middle,
      kind: 'group',
      chunks,
    };
    const rootGroups = middleByRoot.get(root.id) ?? [];
    rootGroups.push(value);
    middleByRoot.set(root.id, rootGroups);
  }

  return [...middleByRoot.entries()]
    .flatMap(([rootId, rootGroups]) => {
      const root = groupById.get(rootId);
      if (!root) return [];
      rootGroups.sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
      return [{ ...root, groups: rootGroups }];
    })
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
}

function compareRelations(left: GroupRelationType, right: GroupRelationType): number {
  return left.sort_order - right.sort_order || left.id - right.id;
}
