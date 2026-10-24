import { db } from '@/database/models/db';
import type {
  PronunciationGroupDetailType,
  PronunciationGroupOverviewType,
} from '@/types/pronunciation.types';
import type { UserItemLocal } from '@/types/user-item.types';
import { isInitiated } from '@/utils/progress.utils';
import Groups from './groups';

function isEligible(item: UserItemLocal): boolean {
  return Boolean(item.audio?.trim());
}

function isAvailable(item: UserItemLocal): boolean {
  return isEligible(item) && isInitiated(item);
}

export default class PronunciationGroup {
  static async getOverview(userId: string): Promise<PronunciationGroupOverviewType[]> {
    const groups = await this.getVisibleGroups(userId);
    return groups.flatMap((group) => {
      const eligible = group.examples.filter(isEligible);
      const unlocked = eligible.filter(isAvailable);
      const { type: _type, ...groupData } = group;
      return [
        {
          ...groupData,
          examples: unlocked.slice(0, 4).map((item) => item.english),
          unlocked_count: unlocked.length,
          total_count: eligible.length,
        },
      ];
    });
  }

  static async getDetail(
    userId: string,
    groupId: number,
  ): Promise<PronunciationGroupDetailType | null> {
    const visibleGroup = (await this.getVisibleGroups(userId))
      .find((candidate) => candidate.id === groupId);
    if (!visibleGroup) return null;
    const group = visibleGroup;
    const relations = await db.group_relations
      .where('parent_group_id')
      .equals(groupId)
      .filter((relation) => relation.relation_type === 'contrast' && !relation.deleted_at)
      .toArray();
    relations.sort((left, right) => left.sort_order - right.sort_order);
    const startedGroups = await Groups.getStartedByUser(userId);
    const startedGroupsById = new Map(startedGroups.map((startedGroup) => [startedGroup.id, startedGroup]));
    const contrastGroupIds = relations.map((relation) => relation.child_group_id);
    const memberships = await db.group_items
      .where('group_id')
      .anyOf(contrastGroupIds)
      .filter((membership) => !membership.deleted_at)
      .toArray();
    const itemOrderByGroupAndItem = new Map(
      memberships.map((membership) => [
        `${membership.group_id}:${membership.item_id}`,
        membership.sort_order,
      ]),
    );
    const orderedItems = relations.flatMap((relation) => {
      const startedGroup = startedGroupsById.get(relation.child_group_id);
      return (startedGroup?.examples ?? []).map((item) => ({
        item,
        itemSortOrder:
          itemOrderByGroupAndItem.get(`${relation.child_group_id}:${item.item_id}`) ?? Number.MAX_SAFE_INTEGER,
        groupSortOrder: startedGroup?.sort_order ?? Number.MAX_SAFE_INTEGER,
      }));
    });
    orderedItems.sort(
      (left, right) =>
        left.itemSortOrder - right.itemSortOrder ||
        left.groupSortOrder - right.groupSortOrder ||
        left.item.item_id - right.item.item_id,
    );
    const items = [...new Map(orderedItems.map(({ item }) => [item.item_id, item])).values()];
    const soundGroups = await db.groups
      .where('id')
      .anyOf(relations.map((relation) => relation.child_group_id))
      .toArray();

    return {
      group: {
        id: group.id,
        name: group.name,
        note: group.note,
        sort_order: group.sort_order,
        updated_at: group.updated_at,
        deleted_at: group.deleted_at,
      },
      sounds: soundGroups
        .filter((sound) => sound.type === 'sound' && !sound.deleted_at)
        .sort((left, right) => left.sort_order - right.sort_order)
        .map(({ id, name, note }) => ({ id, name, note })),
      items,
    };
  }

  private static async getVisibleGroups(userId: string) {
    return Groups.getAllByTypeWithStartedExamples(userId, 'pronunciation');
  }
}
