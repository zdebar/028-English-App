import { db } from '@/database/models/db';
import type { GroupType } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';
import Groups from './groups';

export type GrammarChunkWithExamples = GroupType & { items: UserItemLocal[] };

/** Grammar leaf queries backed by the shared groups and group_items stores. */
export default class GrammarChunk {
  static async getById(groupId: number): Promise<GroupType> {
    const group = await Groups.getById(groupId);
    if (group?.type !== 'grammar') throw new Error(`Grammar group ${groupId} not found.`);
    return group;
  }

  static async getDetail(userId: string, groupId: number): Promise<GrammarChunkWithExamples> {
    const group = await this.getById(groupId);
    return this.addExamples(userId, group);
  }

  static async addExamples(userId: string, group: GroupType): Promise<GrammarChunkWithExamples> {
    return { ...group, items: await Groups.getExamples(group.id, userId) };
  }

  static async getByGroupId(grammarGroupId: number): Promise<GroupType[]> {
    const relations = await db.group_relations
      .where('parent_group_id')
      .equals(grammarGroupId)
      .filter((relation) => relation.relation_type === 'detail' && !relation.deleted_at)
      .toArray();
    relations.sort((left, right) => left.sort_order - right.sort_order);
    const ids = relations.map((relation) => relation.child_group_id);
    return db.groups.where('id').anyOf(ids).toArray();
  }

  static async getInitiated(userId: string): Promise<GroupType[]> {
    const [startedGroups, relations] = await Promise.all([
      Groups.getStartedByUser(userId, 'grammar'),
      db.group_relations.filter((relation) => relation.relation_type === 'detail' && !relation.deleted_at).toArray(),
    ]);
    const parentIds = new Set(relations.map((relation) => relation.parent_group_id));
    return startedGroups.filter((group) => !parentIds.has(group.id));
  }
}
