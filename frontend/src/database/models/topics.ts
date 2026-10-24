import type { GroupType } from '@/types/table.types';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import Groups from './groups';

/** Shared topic metadata and user-specific initiated-topic queries. */
export default class Topic {
  static async getById(userId: string, topicId: number): Promise<GroupType | null> {
    assertNonEmptyString(userId, 'userId');
    const group = (await Groups.getStartedByUser(userId, 'topic'))
      .find((candidate) => candidate.id === topicId);
    if (!group) return null;
    const { examples: _examples, ...topic } = group;
    return topic;
  }

  /** Matches the overview's metadata join, stopping at the first available topic. */
  static async hasInitiatedByUserId(userId: string): Promise<boolean> {
    return (await Groups.getStartedByUser(userId, 'topic')).length > 0;
  }

  static async getInitiatedByUserId(userId: string): Promise<GroupType[]> {
    assertNonEmptyString(userId, 'userId');

    const groups = await Groups.getStartedByUser(userId, 'topic');
    return groups.map(({ examples: _examples, ...topic }) => topic);
  }
}
