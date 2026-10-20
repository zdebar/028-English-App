import { db } from '@/database/models/db';
import type { GrammarTopicType } from '@/types/generic.types';
import type { GroupRelationType } from '@/types/table.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import type { GrammarGroupWithChunks } from './grammar-groups';
import type { GrammarChunkWithExamples } from './grammar-chunks';
import SyncEntityModel from './sync-entity-model';
import Groups from './groups';

export type GrammarTopicWithGroups = GrammarTopicType & {
  groups: GrammarGroupWithChunks[];
};

export default class GrammarTopic extends SyncEntityModel implements GrammarTopicType {
  id!: number;
  name!: string;
  note!: string | null;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.grammar_topics as Dexie.Table<GrammarTopicType, number>;
  static override readonly syncTableName = TableName.GrammarTopics;
  static override readonly syncEntityName = 'grammar topics';
  static override readonly syncSelect = 'id, name, note, sort_order, deleted_at';

  static async getInitiated(userId: string): Promise<GrammarTopicWithGroups[]> {
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
    const middleIds = new Set(details.map((relation) => relation.parent_group_id));
    const leafIds = new Set(details.map((relation) => relation.child_group_id));
    const middleByRoot = new Map<number, GrammarGroupWithChunks[]>();

    for (const rootRelation of hierarchy) {
      const root = groupById.get(rootRelation.parent_group_id);
      const middle = groupById.get(rootRelation.child_group_id);
      if (!root || !middle || !middleIds.has(middle.id)) continue;

      const chunks = details
        .filter((relation) => relation.parent_group_id === middle.id && leafIds.has(relation.child_group_id))
        .flatMap((relation) => {
          const chunk = groupById.get(relation.child_group_id);
          const started = startedById.get(relation.child_group_id);
          if (!chunk || !started) return [];
          const value: GrammarChunkWithExamples = {
            ...chunk,
            grammar_group_id: middle.id,
            items: started.examples,
          };
          return [value];
        });
      if (chunks.length === 0) continue;

      const value: GrammarGroupWithChunks = {
        ...middle,
        grammar_topic_id: root.id,
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
}

function compareRelations(left: GroupRelationType, right: GroupRelationType): number {
  return left.sort_order - right.sort_order || left.id - right.id;
}
