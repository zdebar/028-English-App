import { getPronunciationGroupDetail } from '@/database/queries/pronunciation-group-queries';
import {
  getSoundGroupDetail,
  type SoundGroupDetailType,
} from '@/database/queries/sound-group-queries';
import { getTopicById } from '@/database/queries/topic-queries';
import UserItem from '@/database/models/user-items';
import {
  loadReviewDeckData,
  type ReviewDeckData,
} from '@/features/practice/review-deck-data';
import {
  loadOverviewAvailability,
  loadOverviewQuery,
  type OverviewAvailabilityData,
  type OverviewQueryData,
} from '@/hooks/overview-query-store';
import { loadSharedQuery } from '@/hooks/shared-query-store';
import type { PronunciationGroupDetailType } from '@/types/pronunciation.types';
import type { ReviewKind } from '@/types/practice.types';
import type { GroupType } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';

export type TopicDetailData = Readonly<{
  topic: GroupType | null;
  items: UserItemLocal[];
}>;

export type SoundGroupDetailData = SoundGroupDetailType;

export function loadOverviewAvailabilityData(
  userId: string,
): Promise<OverviewAvailabilityData> {
  return loadOverviewAvailability(userId);
}

export function loadReviewPracticeData(
  userId: string,
  reviewKind: ReviewKind,
): Promise<ReviewDeckData> {
  return loadReviewDeckData(userId, reviewKind);
}

export function loadGrammarOverviewData(
  userId: string,
): Promise<OverviewQueryData['grammar']> {
  return loadOverviewQuery(userId, 'grammar');
}

export function loadTopicsOverviewData(
  userId: string,
): Promise<OverviewQueryData['topics']> {
  return loadOverviewQuery(userId, 'topics');
}

export async function loadTopicDetailData(
  userId: string,
  topicId: number,
): Promise<TopicDetailData> {
  const [topic, items] = await Promise.all([
    loadSharedQuery(userId, `topic:${topicId}`, () => getTopicById(userId, topicId)),
    loadSharedQuery(userId, `topic-items:${topicId}`, () => UserItem.getInitiatedByTopicId(userId, topicId)),
  ]);
  return { topic, items };
}

export function loadVocabularyOverviewData(
  userId: string,
): Promise<OverviewQueryData['vocabulary']> {
  return loadOverviewQuery(userId, 'vocabulary');
}

export function loadSoundsOverviewData(
  userId: string,
): Promise<OverviewQueryData['sounds']> {
  return loadOverviewQuery(userId, 'sounds');
}

export function loadSoundGroupDetailData(
  userId: string,
  groupId: number,
): Promise<SoundGroupDetailData | null> {
  return loadSharedQuery(userId, `sound:${groupId}`, () => getSoundGroupDetail(userId, groupId));
}

export function loadPronunciationGroupDetailData(
  userId: string,
  groupId: number,
): Promise<PronunciationGroupDetailType | null> {
  return loadSharedQuery(
    userId,
    `pronunciation:${groupId}`,
    () => getPronunciationGroupDetail(userId, groupId),
  );
}
