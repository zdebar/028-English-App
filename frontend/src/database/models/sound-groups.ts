import Groups from './groups';
import type { GroupType } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';

export type SoundGroupDetailType = Readonly<{
  group: GroupType;
  items: UserItemLocal[];
}>;

/** Sound groups and their examples from started lessons. */
export default class SoundGroup {
  static async getOverview(userId: string): Promise<GroupType[]> {
    return Groups.getByTypeWithStartedLessons(userId, 'sound');
  }

  static async getDetail(userId: string, groupId: number): Promise<SoundGroupDetailType | null> {
    const [visibleGroups, startedGroups] = await Promise.all([
      Groups.getByTypeWithStartedLessons(userId, 'sound'),
      Groups.getStartedByUser(userId, 'sound'),
    ]);
    const group = visibleGroups.find((candidate) => candidate.id === groupId);
    if (!group) return null;
    const items = startedGroups.find((candidate) => candidate.id === groupId)?.examples ?? [];
    return { group, items };
  }
}
