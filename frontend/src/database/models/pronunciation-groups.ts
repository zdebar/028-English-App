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
    const items = visibleGroup.examples;
    const relations = await db.group_relations
      .where('parent_group_id')
      .equals(groupId)
      .filter((relation) => relation.relation_type === 'contrast' && !relation.deleted_at)
      .toArray();
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
    const [groups, sounds, relations] = await Promise.all([
      Groups.getStartedByUser(userId, 'pronunciation'),
      Groups.getStartedByUser(userId, 'sound'),
      db.group_relations.toArray(),
    ]);
    const unlockedSoundIds = new Set(sounds.map((sound) => sound.id));
    const relationsByGroup = new Map<number, number[]>();
    for (const relation of relations) {
      if (relation.deleted_at || relation.relation_type !== 'contrast') continue;
      const soundIds = relationsByGroup.get(relation.parent_group_id) ?? [];
      soundIds.push(relation.child_group_id);
      relationsByGroup.set(relation.parent_group_id, soundIds);
    }
    return groups.filter((group) =>
      (relationsByGroup.get(group.id) ?? []).every((soundId) => unlockedSoundIds.has(soundId)),
    );
  }
}
