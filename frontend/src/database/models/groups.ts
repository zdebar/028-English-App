import Dexie from 'dexie';
import { db } from '@/database/models/db';
import type { GroupType as GroupRow, GroupTypeName } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';
import { isInitiated } from '@/utils/progress.utils';
import config from '@/config/config';
import SyncEntityModel from './sync-entity-model';

export type VisibleGroup = GroupRow & { examples: UserItemLocal[] };

export default class Groups extends SyncEntityModel implements GroupRow {
  id!: number;
  type!: GroupTypeName;
  name!: string;
  note!: string | null;
  sort_order!: number;
  updated_at!: string;
  deleted_at!: string | null;

  static override readonly syncTable = db.groups as Dexie.Table<GroupRow, number>;
  static override readonly syncTableName = 'groups';
  static override readonly syncEntityName = 'groups';
  static override readonly syncSelect = 'id, type, name, note, sort_order, updated_at, deleted_at';

  static async getById(groupId: number): Promise<GroupRow | null> {
    const group = await db.groups.get(groupId);
    return group && !group.deleted_at ? group : null;
  }

  /** Returns a group and its ancestors in parent-to-child order. */
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

  static getSounds(): Promise<GroupRow[]> {
    return db.groups
      .where('type')
      .equals('sound')
      .filter((group) => !group.deleted_at)
      .sortBy('sort_order');
  }

  static async getExamples(groupId: number, userId: string): Promise<UserItemLocal[]> {
    const memberships = await db.group_items
      .where('group_id')
      .equals(groupId)
      .filter((membership) => !membership.deleted_at)
      .toArray();
    const orderedMemberships = [...memberships];
    orderedMemberships.sort((left, right) => left.sort_order - right.sort_order);
    const itemIds = orderedMemberships.map((membership) => membership.item_id);
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

  static async getStartedByUser(userId: string, type?: GroupTypeName): Promise<VisibleGroup[]> {
    const [groups, memberships, userItems, userLessons] = await Promise.all([
      db.groups.toArray(),
      db.group_items.toArray(),
      db.user_items.where('user_id').equals(userId).toArray(),
      db.user_lessons.where('user_id').equals(userId).toArray(),
    ]);
    const startedLessonIds = new Set(userLessons.map((lesson) => lesson.lesson_id));
    const startedItems = new Map<number, UserItemLocal>(
      userItems
        .filter(
          (item) => item.deleted_at === config.database.nullReplacementDate && isInitiated(item),
        )
        .filter((item) => startedLessonIds.has(item.lesson_id))
        .map((item) => [item.item_id, item] as const),
    );
    const membershipsByGroup = new Map<number, typeof memberships>();

    for (const membership of memberships) {
      const entries = membershipsByGroup.get(membership.group_id) ?? [];
      entries.push(membership);
      membershipsByGroup.set(membership.group_id, entries);
    }

    const visibleGroups = groups.filter((group) => !group.deleted_at && (!type || group.type === type));
    visibleGroups.sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);

    return visibleGroups.flatMap((group) => {
      const groupMemberships = [...(membershipsByGroup.get(group.id) ?? [])]
        .filter((membership) => membership.deleted_at == null);
      groupMemberships.sort((left, right) => left.sort_order - right.sort_order);
      const examples = groupMemberships
        .flatMap((membership) => {
          const item = startedItems.get(membership.item_id);
          return item ? [item] : [];
        });
      return examples.length > 0 ? [{ ...group, examples }] : [];
    });
  }

  static async getAllByTypeWithStartedExamples(
    userId: string,
    type: GroupTypeName,
  ): Promise<VisibleGroup[]> {
    const [groups, startedGroups] = await Promise.all([
      db.groups.toArray().then((rows) => {
        const matchingGroups: GroupRow[] = rows.filter(
          (group) => group.type === type && !group.deleted_at,
        );
        matchingGroups.sort(
          (left: GroupRow, right: GroupRow) =>
            left.sort_order - right.sort_order || left.id - right.id,
        );
        return matchingGroups;
      }),
      this.getStartedByUser(userId, type),
    ]);
    const startedGroupsById = new Map<number, VisibleGroup>(
      startedGroups.map((group) => [group.id, group]),
    );
    return groups.map((group) => ({
      ...group,
      examples: startedGroupsById.get(group.id)?.examples ?? [],
    }));
  }
}
