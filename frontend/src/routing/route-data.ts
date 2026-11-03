import { ensureDataPackage } from '@/database/state/data-store';

export async function loadOverviewAvailabilityData(userId: string): Promise<null> {
  await ensureDataPackage(userId, { kind: 'overview-menu' });
  return null;
}

export async function loadGrammarOverviewData(userId: string): Promise<null> {
  await ensureDataPackage(userId, { kind: 'grammar-overview' });
  return null;
}

export async function loadTopicsOverviewData(userId: string): Promise<null> {
  await ensureDataPackage(userId, { kind: 'topics-overview' });
  return null;
}

export const loadTopicDetailData = (userId: string, topicId: number) =>
  ensureDataPackage(userId, { kind: 'topic-detail', topicId });

export async function loadVocabularyOverviewData(userId: string): Promise<null> {
  await ensureDataPackage(userId, { kind: 'vocabulary' });
  return null;
}

export async function loadSoundsOverviewData(userId: string): Promise<null> {
  await ensureDataPackage(userId, { kind: 'sounds-overview' });
  return null;
}

export const loadSoundGroupDetailData = (userId: string, groupId: number) =>
  ensureDataPackage(userId, { kind: 'sound-detail', groupId });

export async function loadPronunciationOverviewData(userId: string): Promise<null> {
  await ensureDataPackage(userId, { kind: 'pronunciation-overview' });
  return null;
}

export const loadPronunciationGroupDetailData = (userId: string, groupId: number) =>
  ensureDataPackage(userId, { kind: 'pronunciation-detail', groupId });

export async function loadReviewPracticeData(userId: string, reviewKind: 'grammar' | 'vocabulary'): Promise<null> {
  await ensureDataPackage(userId, { kind: 'review-practice', reviewKind });
  return null;
}

export const loadInitialTrainingData = (userId: string) =>
  ensureDataPackage(userId, { kind: 'initial-training' });
