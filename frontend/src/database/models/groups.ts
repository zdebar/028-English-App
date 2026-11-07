import Dexie from 'dexie';
import { db } from '@/database/models/db';
import type { GroupType as GroupRow, GroupTypeName } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';
import SyncEntityModel from './sync-entity-model';

/** IndexedDB model and queries for curriculum groups. */
export default class Groups extends SyncEntityModel implements GroupRow {
  id!: number;
  type!: GroupTypeName;
  sound_class!: GroupRow['sound_class'];
  sound_category!: GroupRow['sound_category'];
  name!: string;
  note!: string | null;
  sort_order!: number;
  updated_at!: string;
  deleted_at!: string | null;

  static override readonly syncTable = db.groups as Dexie.Table<GroupRow, number>;
  static override readonly syncTableName = 'groups';
  static override readonly syncEntityName = 'groups';
  static override readonly syncSelect =
    'id, type, name, note, sort_order, sound_class, sound_category, updated_at, deleted_at';

  /** Returns an active group by id, or null when it is missing or deleted. */
  static async getById(groupId: number): Promise<GroupRow | null> {
    const group = await db.groups.get(groupId);
    return group && !group.deleted_at ? group : null;
  }

  /**
   * Returns a group and its ancestors in parent-to-child order.
   * @param groupId Id of the group to start from.
   */
  static async getAncestry(groupId: number): Promise<GroupRow[]> {
    const [groups, relations] = await Promise.all([
      db.groups.toArray(),
      db.group_relations.toArray(),
    ]);
    const groupById = new Map(
      groups.filter((group) => !group.deleted_at).map((group) => [group.id, group]),
    );
    const parentsByChild = new Map<number, typeof relations>();

    for (const relation of relations) {
      if (relation.deleted_at) continue;
      const parents = parentsByChild.get(relation.child_group_id) ?? [];
      parents.push(relation);
      parentsByChild.set(relation.child_group_id, parents);
    }

    const result: GroupRow[] = [];
    const visited = new Set<number>();
    const visiting = new Set<number>();

    const visit = (currentId: number): void => {
      if (visited.has(currentId) || visiting.has(currentId)) return;
      visiting.add(currentId);
      const parents = [...(parentsByChild.get(currentId) ?? [])].sort(
        (left, right) =>
          left.sort_order - right.sort_order || left.parent_group_id - right.parent_group_id,
      );
      for (const relation of parents) visit(relation.parent_group_id);
      visiting.delete(currentId);
      visited.add(currentId);
      const group = groupById.get(currentId);
      if (group) result.push(group);
    };

    visit(groupId);
    return result;
  }

  /** Returns all active sound groups ordered by sort order. */
  static getSounds(): Promise<GroupRow[]> {
    return db.groups
      .where('type')
      .equals('sound')
      .filter((group) => !group.deleted_at)
      .sortBy('sort_order');
  }

  /**
   * Returns the user's items belonging to a group, in membership order.
   * @param groupId Id of the group to read.
   * @param userId Id of the user whose items should be returned.
   */
  static async getExamples(groupId: number, userId: string): Promise<UserItemLocal[]> {
    const memberships = await db.group_items
      .where('group_id')
      .equals(groupId)
      .filter((membership) => !membership.deleted_at)
      .toArray();
    memberships.sort((left, right) => left.sort_order - right.sort_order);
    const itemIds = memberships.map((membership) => membership.item_id);
    if (itemIds.length === 0) return [];

    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf(itemIds.map((itemId) => [userId, itemId]))
      .toArray();
    const itemById = new Map(items.map((item) => [item.item_id, item]));
    return itemIds.flatMap((itemId) => {
      const item = itemById.get(itemId);
      return item ? [item] : [];
    });
  }
}
