import { ensureDataManagerReady, dataManagerStore } from '@/database/state/data-store';
import {
  selectGrammarOverview,
  selectPronunciationDetail,
  selectReviewDeck,
  selectSoundDetail,
  selectSoundOverview,
  selectTopicOverview,
  selectTopicDetail,
  selectVocabulary,
} from '@/database/state/data-selectors';
import type {
  GrammarTopicWithGroups,
  ReviewDeckData,
  SoundGroupDetail,
  SoundOverviewGroup,
} from '@/database/state/data-types';
import type { PronunciationGroupDetailType } from '@/types/pronunciation.types';
import type { ReviewKind } from '@/types/practice.types';
import type { GroupType } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';

export type TopicDetailData = Readonly<{
  topic: GroupType | null;
  items: UserItemLocal[];
}>;

export type SoundGroupDetailData = SoundGroupDetail;
export type OverviewAvailabilityData = Readonly<{
  grammar: boolean;
  topics: boolean;
  vocabulary: boolean;
  sounds: boolean;
}>;

export async function loadOverviewAvailabilityData(userId: string): Promise<OverviewAvailabilityData> {
  const state = await getUserData(userId);
  return {
    grammar: selectGrammarOverview(state, userId).length > 0,
    topics: selectTopicOverview(state, userId).length > 0,
    vocabulary: selectVocabulary(state, userId).length > 0,
    sounds: selectSoundOverview(state, userId).some((sound) => sound.isActive),
  };
}

export async function loadReviewPracticeData(userId: string, reviewKind: ReviewKind): Promise<ReviewDeckData> {
  const state = await getUserData(userId);
  return selectReviewDeck(state, userId, reviewKind);
}

export async function loadGrammarOverviewData(userId: string): Promise<GrammarTopicWithGroups[]> {
  const state = await getUserData(userId);
  return selectGrammarOverview(state, userId);
}

export async function loadTopicsOverviewData(userId: string): Promise<GroupType[]> {
  const state = await getUserData(userId);
  return selectTopicOverview(state, userId);
}

export async function loadTopicDetailData(userId: string, topicId: number): Promise<TopicDetailData> {
  const state = await getUserData(userId);
  return selectTopicDetail(state, userId, topicId);
}

export async function loadVocabularyOverviewData(userId: string): Promise<UserItemLocal[]> {
  const state = await getUserData(userId);
  return selectVocabulary(state, userId);
}

export async function loadSoundsOverviewData(userId: string): Promise<SoundOverviewGroup[]> {
  const state = await getUserData(userId);
  return selectSoundOverview(state, userId);
}

export async function loadSoundGroupDetailData(
  userId: string,
  groupId: number,
): Promise<SoundGroupDetailData | null> {
  const state = await getUserData(userId);
  return selectSoundDetail(state, userId, groupId);
}

export async function loadPronunciationGroupDetailData(
  userId: string,
  groupId: number,
): Promise<PronunciationGroupDetailType | null> {
  const state = await getUserData(userId);
  return selectPronunciationDetail(state, userId, groupId);
}

async function getUserData(userId: string) {
  await ensureDataManagerReady(userId);
  const state = dataManagerStore.getState();
  if (state.userId !== userId || state.status !== 'ready') {
    throw state.error ?? new Error('Application data is not ready for the active user.');
  }
  return state;
}
