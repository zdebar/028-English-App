import config from '@/config/config';
import { db } from '@/database/models/db';
import type {
  PronunciationGroupDetailType,
  PronunciationGroupItemType,
  PronunciationGroupOverviewType,
  PronunciationGroupType,
} from '@/types/pronunciation.types';
import { TableName } from '@/types/table.types';
import type { CurriculumSortPath, UserItemLocal } from '@/types/user-item.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';

const NULL_DATE = config.database.nullReplacementDate;

function isEligible(item: UserItemLocal): boolean {
  return item.is_vocabulary === 1 && Boolean(item.audio);
}

function isAvailable(item: UserItemLocal): boolean {
  return isEligible(item) && item.started_at !== NULL_DATE;
}

function compareCurriculumPaths(left: CurriculumSortPath, right: CurriculumSortPath): number {
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

function sortByCurriculum(items: UserItemLocal[]): UserItemLocal[] {
  return items.sort(
    (left, right) =>
      compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path) ||
      left.item_id - right.item_id,
  );
}

function resolveGroupItems(
  memberships: PronunciationGroupItemType[],
  itemById: ReadonlyMap<number, UserItemLocal>,
): { eligible: UserItemLocal[]; unlocked: UserItemLocal[] } {
  const eligible = sortByCurriculum(
    memberships
      .map((membership) => itemById.get(membership.item_id))
      .filter((item): item is UserItemLocal => Boolean(item && isEligible(item))),
  );
  const membershipsByContrastSet = new Map<number, PronunciationGroupItemType[]>();

  for (const membership of memberships) {
    if (membership.contrast_set == null) continue;
    const setMemberships = membershipsByContrastSet.get(membership.contrast_set) ?? [];
    setMemberships.push(membership);
    membershipsByContrastSet.set(membership.contrast_set, setMemberships);
  }

  const unlocked: UserItemLocal[] = [];
  for (const setMemberships of membershipsByContrastSet.values()) {
    const setItems = setMemberships.map((membership) => itemById.get(membership.item_id));
    if (
      setItems.length > 0 &&
      setItems.every((item): item is UserItemLocal => Boolean(item && isAvailable(item)))
    ) {
      unlocked.push(...setItems);
    }
  }

  return { eligible, unlocked: sortByCurriculum(unlocked) };
}

export default class PronunciationGroup extends SyncEntityModel implements PronunciationGroupType {
  id!: number;
  name!: string;
  note!: string | null;
  sort_order!: number;
  updated_at!: string;
  deleted_at!: string | null;

  static override readonly syncTable = db.pronunciation_groups as Dexie.Table<
    PronunciationGroupType,
    number
  >;
  static override readonly syncTableName = TableName.PronunciationGroups;
  static override readonly syncEntityName = 'pronunciation groups';
  static override readonly syncSelect = 'id, name, note, sort_order, updated_at, deleted_at';

  static async getOverview(userId: string): Promise<PronunciationGroupOverviewType[]> {
    const [groups, memberships, userItems] = await Promise.all([
      db.pronunciation_groups.orderBy('id').toArray(),
      db.pronunciation_group_items.toArray(),
      db.user_items.where('user_id').equals(userId).toArray(),
    ]);
    const itemById = new Map<number, UserItemLocal>(userItems.map((item) => [item.item_id, item]));
    const membershipsByGroup = new Map<number, typeof memberships>();

    for (const membership of memberships) {
      const current = membershipsByGroup.get(membership.pronunciation_group_id) ?? [];
      current.push(membership);
      membershipsByGroup.set(membership.pronunciation_group_id, current);
    }

    return groups
      .sort((left, right) => left.id - right.id)
      .flatMap((group) => {
        const { eligible, unlocked } = resolveGroupItems(
          membershipsByGroup.get(group.id) ?? [],
          itemById,
        );

        if (unlocked.length === 0) return [];
        return [
          {
            ...group,
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
    const group = await db.pronunciation_groups.get(groupId);
    if (!group) return null;

    const memberships = await db.pronunciation_group_items
      .where('[pronunciation_group_id+sort_order]')
      .between([groupId, Dexie.minKey], [groupId, Dexie.maxKey])
      .toArray();
    const userItems = await db.user_items
      .where('[user_id+item_id]')
      .anyOf(memberships.map((membership) => [userId, membership.item_id]))
      .toArray();
    const itemById = new Map<number, UserItemLocal>(userItems.map((item) => [item.item_id, item]));
    const items = resolveGroupItems(memberships, itemById).unlocked;

    return {
      group,
      items,
      selected_count: items.filter((item) => item.has_pronunciation_practice === 1).length,
      available_count: items.length,
    };
  }

  static async addAvailableItems(userId: string, groupId: number): Promise<number> {
    const detail = await this.getDetail(userId, groupId);
    if (!detail) return 0;
    const missing = detail.items.filter((item) => item.has_pronunciation_practice !== 1);
    if (missing.length === 0) return 0;

    const updatedAt = new Date().toISOString();
    await db.transaction('rw', db.user_items, async () => {
      await Promise.all(
        missing.map((item) =>
          db.user_items.update([userId, item.item_id], {
            has_pronunciation_practice: 1,
            updated_at: updatedAt,
          }),
        ),
      );
    });
    return missing.length;
  }
}
