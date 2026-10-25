import Groups from './groups';
import type { GroupType } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';

export type SoundGroupDetailType = Readonly<{
  group: GroupType;
  items: UserItemLocal[];
}>;

export type SoundOverviewGroup = GroupType & Readonly<{ isActive: boolean }>;

/** Sound groups and their examples from started lessons. */
export default class SoundGroup {
  static getOverview(userId: string): Promise<GroupType[]> {
    return Groups.getByTypeWithStartedLessons(userId, 'sound');
  }

  static async getAllForOverview(userId: string): Promise<SoundOverviewGroup[]> {
    const [allSounds, activeSounds] = await Promise.all([
      Groups.getSounds(),
      Groups.getByTypeWithStartedLessons(userId, 'sound'),
    ]);
    const activeSoundIds = new Set(activeSounds.map((sound) => sound.id));
    return allSounds.map((sound) => ({ ...sound, isActive: activeSoundIds.has(sound.id) }));
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
