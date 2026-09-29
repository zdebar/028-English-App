import GrammarGroup, { type GrammarGroupWithChunks } from '@/database/models/grammar-groups';
import Topic from '@/database/models/topics';
import UserItem from '@/database/models/user-items';
import type { UserItemLocal } from '@/types/user-item.types';
import { getSharedQuery, loadSharedQuery, sharedQueryKey } from './shared-query-store';

export type OverviewQueryName =
  | 'has-grammar'
  | 'has-topics'
  | 'has-vocabulary'
  | 'grammar'
  | 'topics'
  | 'vocabulary'
  | 'practice-overview';

export type OverviewQueryData = {
  'has-grammar': boolean;
  'has-topics': boolean;
  'has-vocabulary': boolean;
  grammar: GrammarGroupWithChunks[];
  topics: Awaited<ReturnType<typeof Topic.getInitiatedByUserId>>;
  vocabulary: UserItemLocal[];
  'practice-overview': UserItemLocal[];
};

export type OverviewAvailabilityData = Readonly<{
  grammar: boolean;
  topics: boolean;
  vocabulary: boolean;
}>;

const OVERVIEW_QUERY_NAMES: readonly OverviewQueryName[] = [
  'has-grammar',
  'has-topics',
  'has-vocabulary',
  'grammar',
  'topics',
  'vocabulary',
  'practice-overview',
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
        return Topic.hasInitiatedByUserId(userId) as Promise<OverviewQueryData[T]>;
      case 'has-vocabulary':
        return UserItem.hasInitiatedVocabulary(userId) as Promise<OverviewQueryData[T]>;
      case 'grammar':
        return GrammarGroup.getInitiated(userId) as Promise<OverviewQueryData[T]>;
      case 'topics':
        return Topic.getInitiatedByUserId(userId) as Promise<OverviewQueryData[T]>;
      case 'vocabulary':
        return UserItem.getInitiatedVocabulary(userId) as Promise<OverviewQueryData[T]>;
      case 'practice-overview':
        return UserItem.getByUserId(userId) as Promise<OverviewQueryData[T]>;
    }
  };
}

export function getOverviewSharedQuery<T extends OverviewQueryName>(
  userId: string,
  name: T,
) {
  return getSharedQuery(overviewQueryKey(userId, name), getOverviewQuery(userId, name));
}

export function overviewQueryKey(userId: string, name: OverviewQueryName): string {
  return sharedQueryKey(userId, name)!;
}

export async function loadOverviewQuery<T extends OverviewQueryName>(
  userId: string,
  name: T,
): Promise<OverviewQueryData[T]> {
  return loadSharedQuery(userId, name, getOverviewQuery(userId, name));
}

export async function loadOverviewAvailability(
  userId: string,
): Promise<OverviewAvailabilityData> {
  const [grammar, topics, vocabulary] = await Promise.all([
    loadOverviewQuery(userId, 'has-grammar'),
    loadOverviewQuery(userId, 'has-topics'),
    loadOverviewQuery(userId, 'has-vocabulary'),
  ]);
  return { grammar, topics, vocabulary };
}

export async function warmOverviewQueries(userId: string): Promise<void> {
  await Promise.all(OVERVIEW_QUERY_NAMES.map((name) => loadOverviewQuery(userId, name)));
}
