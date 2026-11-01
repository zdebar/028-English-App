import type { GroupType } from '@/types/table.types';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import Groups from '@/database/models/groups';

/** Returns an initiated topic for a user, or null when the topic is unavailable. */
export async function getTopicById(userId: string, topicId: number): Promise<GroupType | null> {
  assertNonEmptyString(userId, 'userId');
  const group = (await Groups.getStartedByUser(userId, 'topic'))
    .find((candidate) => candidate.id === topicId);
  if (!group) return null;
  const { examples: _examples, ...topic } = group;
  return topic;
}

/** Checks whether the user has any initiated topic. */
export async function hasInitiatedTopicsByUserId(userId: string): Promise<boolean> {
  return (await Groups.getStartedByUser(userId, 'topic')).length > 0;
}

/** Returns the user's initiated topics without their example items. */
export async function getInitiatedTopicsByUserId(userId: string): Promise<GroupType[]> {
  assertNonEmptyString(userId, 'userId');
  const groups = await Groups.getStartedByUser(userId, 'topic');
  return groups.map(({ examples: _examples, ...topic }) => topic);
}
