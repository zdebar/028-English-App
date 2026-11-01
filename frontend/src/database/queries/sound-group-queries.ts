import Groups from '@/database/models/groups';
import type { GroupType } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';

export type SoundGroupDetailType = Readonly<{
  group: GroupType;
  items: UserItemLocal[];
}>;

export type SoundOverviewGroup = GroupType & Readonly<{ isActive: boolean }>;

/** Checks whether the user has any sound group with an item in a started lesson. */
export async function hasAvailableSoundGroups(userId: string): Promise<boolean> {
  return (await Groups.getByTypeWithStartedLessons(userId, 'sound')).length > 0;
}

/** Returns all active sound groups with their availability for the user. */
export async function getAllSoundGroupsForOverview(userId: string): Promise<SoundOverviewGroup[]> {
  const [allSounds, activeSounds] = await Promise.all([
    Groups.getSounds(),
    Groups.getByTypeWithStartedLessons(userId, 'sound'),
  ]);
  const activeSoundIds = new Set(activeSounds.map((sound) => sound.id));
  return allSounds.map((sound) => ({ ...sound, isActive: activeSoundIds.has(sound.id) }));
}

/** Returns a visible sound group with its initiated examples, or null when unavailable. */
export async function getSoundGroupDetail(
  userId: string,
  groupId: number,
): Promise<SoundGroupDetailType | null> {
  const [visibleGroups, startedGroups] = await Promise.all([
    Groups.getByTypeWithStartedLessons(userId, 'sound'),
    Groups.getStartedByUser(userId, 'sound'),
  ]);
  const group = visibleGroups.find((candidate) => candidate.id === groupId);
  if (!group) return null;
  const items = startedGroups.find((candidate) => candidate.id === groupId)?.examples ?? [];
  return { group, items };
}
