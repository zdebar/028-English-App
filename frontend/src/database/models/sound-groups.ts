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
    const groups = await Groups.getAllByTypeWithStartedExamples(userId, 'sound');
    return groups.map(({ examples: _examples, ...group }) => group);
  }

  static async getDetail(userId: string, groupId: number): Promise<SoundGroupDetailType | null> {
    const group = (await Groups.getAllByTypeWithStartedExamples(userId, 'sound'))
      .find((candidate) => candidate.id === groupId);
    if (!group) return null;
    const { examples, ...sound } = group;
    return { group: sound, items: examples };
  }
}
