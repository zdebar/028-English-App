import {
  getInitiatedGrammarTopics,
  type GrammarTopicWithGroups,
} from '@/database/queries/grammar-queries';
import {
  getInitiatedTopicsByUserId,
  hasInitiatedTopicsByUserId,
} from '@/database/queries/topic-queries';
import UserItem from '@/database/models/user-items';
import {
  getAllSoundGroupsForOverview,
  hasAvailableSoundGroups,
  type SoundOverviewGroup,
} from '@/database/queries/sound-group-queries';
import type { UserItemLocal } from '@/types/user-item.types';
import { sharedQueryKey } from '@/database/queries/shared-query-store';

export type OverviewQueryName =
  | 'has-grammar'
  | 'has-topics'
  | 'has-vocabulary'
  | 'has-sounds'
  | 'grammar'
  | 'topics'
  | 'vocabulary'
  | 'sounds';

export type OverviewQueryData = {
  'has-grammar': boolean;
  'has-topics': boolean;
  'has-vocabulary': boolean;
  'has-sounds': boolean;
  grammar: GrammarTopicWithGroups[];
  topics: Awaited<ReturnType<typeof getInitiatedTopicsByUserId>>;
  vocabulary: UserItemLocal[];
  sounds: SoundOverviewGroup[];
};

export type OverviewAvailabilityData = Readonly<{
  grammar: boolean;
  topics: boolean;
  vocabulary: boolean;
  sounds: boolean;
}>;

const OVERVIEW_QUERY_NAMES: readonly OverviewQueryName[] = [
  'has-grammar',
  'has-topics',
  'has-vocabulary',
  'has-sounds',
  'grammar',
  'topics',
  'vocabulary',
  'sounds',
];

export function getOverviewQuery<T extends OverviewQueryName>(
  userId: string,
  name: T,
): () => Promise<OverviewQueryData[T]> {
  return async () => {
    switch (name) {
      case 'has-grammar':
        return UserItem.hasInitiatedGrammar(userId) as Promise<OverviewQueryData[T]>;
      case 'has-topics':
        return hasInitiatedTopicsByUserId(userId) as Promise<OverviewQueryData[T]>;
      case 'has-vocabulary':
        return UserItem.hasInitiatedVocabulary(userId) as Promise<OverviewQueryData[T]>;
      case 'has-sounds':
        return hasAvailableSoundGroups(userId) as Promise<OverviewQueryData[T]>;
      case 'grammar':
        return getInitiatedGrammarTopics(userId) as Promise<OverviewQueryData[T]>;
      case 'topics':
        return getInitiatedTopicsByUserId(userId) as Promise<OverviewQueryData[T]>;
      case 'vocabulary':
        return UserItem.getInitiatedVocabulary(userId) as Promise<OverviewQueryData[T]>;
      case 'sounds':
        return getAllSoundGroupsForOverview(userId) as Promise<OverviewQueryData[T]>;
    }
  };
}

export function overviewQueryKey(userId: string, name: OverviewQueryName): string {
  return sharedQueryKey(userId, name)!;
}

export function loadOverviewQuery<T extends OverviewQueryName>(
  userId: string,
  name: T,
): Promise<OverviewQueryData[T]> {
  return getOverviewQuery(userId, name)();
}

export async function loadOverviewAvailability(
  userId: string,
): Promise<OverviewAvailabilityData> {
  const [grammar, topics, vocabulary, sounds] = await Promise.all([
    loadOverviewQuery(userId, 'has-grammar'),
    loadOverviewQuery(userId, 'has-topics'),
    loadOverviewQuery(userId, 'has-vocabulary'),
    loadOverviewQuery(userId, 'has-sounds'),
  ]);
  return { grammar, topics, vocabulary, sounds };
}

export async function warmOverviewQueries(userId: string): Promise<void> {
  await Promise.all(OVERVIEW_QUERY_NAMES.map((name) => loadOverviewQuery(userId, name)));
}
