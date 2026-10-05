import { loadSharedQuery } from '@/hooks/shared-query-store';
import { hasReachedReviewLimit } from '@/features/practice/practice-availability';
import { loadReviewAvailabilityFromArrays } from '@/features/practice/review-prefetch';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import Block from '@/database/models/blocks';
import PracticeSession from '@/database/models/practice-sessions';
import UserItem from '@/database/models/user-items';
import Topic from '@/database/models/topics';
import {
  loadReviewDeckData,
  resolvePracticeEntries,
  resolvePracticeGrammarContext,
  type ReviewDeckData,
} from '@/database/utils/practice-content.utils';
import type { GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import type { BlockType, GrammarGroupType } from '@/types/generic.types';
import type { PracticeSessionType } from '@/types/practice-session.types';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';
import type { ReviewKind } from '@/types/practice.types';
import {
  loadOverviewAvailability,
  loadOverviewQuery,
} from '@/hooks/overview-query-store';

export type RouteDataDescriptor<T> = Readonly<{
  load: () => Promise<T>;
}>;

export type InitialTrainingData = Readonly<{
  block: BlockType | null;
  items: UserItemLocal[];
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>;
  grammar: GrammarChunkWithExamples | null;
  grammarGroup: GrammarGroupType | null;
}>;

function emptyInitialTrainingData(): InitialTrainingData {
  return { block: null, items: [], entries: [], grammar: null, grammarGroup: null };
}

function getSavedSessionItemIds(activeSession: PracticeSessionType | null): number[] {
  if (!activeSession) return [];
  return [
    ...activeSession.current_queue_item_ids,
    ...activeSession.retry_queue_item_ids,
    ...activeSession.completed_item_ids,
  ];
}

async function getInitialTrainingSelection(
  userId: string,
  activeSession: PracticeSessionType | null,
) {
  if (activeSession) {
    const savedItemIds = getSavedSessionItemIds(activeSession);
    return {
      blockId: activeSession.block_id,
      items: await UserItem.getByItemIds(userId, savedItemIds),
    };
  }
  return UserItem.getNextInitialTrainingSelection(userId);
}

async function loadInitialTrainingData(userId: string): Promise<InitialTrainingData> {
  const activeSession = await PracticeSession.reconcileActive(userId);
  if (!(await canLoadInitialTraining(userId, activeSession))) {
    return emptyInitialTrainingData();
  }

  const selection = await getInitialTrainingSelection(userId, activeSession);
  if (!selection) return emptyInitialTrainingData();

  const block = selection.blockId == null ? null : await Block.getById(selection.blockId);
  const items = selection.items;
  const hasInvalidSelection = items.length === 0 || (selection.blockId != null && !block);
  if (hasInvalidSelection) return emptyInitialTrainingData();

  const [entries, grammarContext] = await Promise.all([
    resolvePracticeEntries(userId, items),
    resolvePracticeGrammarContext(userId, block?.grammar_chunk_id ?? null),
  ]);
  return { block, items, entries, ...grammarContext };
}

async function canLoadInitialTraining(
  userId: string,
  activeSession: PracticeSessionType | null,
): Promise<boolean> {
  if (activeSession?.mode === 'review') return false;
  if (activeSession?.mode === 'new') return true;
  return !(await shouldBlockInitialTraining(userId));
}

async function shouldBlockInitialTraining(userId: string): Promise<boolean> {
  const cachedAvailability = usePracticeAvailabilityStore.getState();
  const hasUsableCache =
    cachedAvailability.availabilityUserId === userId &&
    !cachedAvailability.practiceLoading &&
    cachedAvailability.practiceError === null;

  if (hasUsableCache) return hasReachedReviewLimit(cachedAvailability);

  try {
    const reviewAvailability = await loadReviewAvailabilityFromArrays(userId);
    return hasReachedReviewLimit(reviewAvailability);
  } catch {
    return false;
  }
}

export function overviewAvailabilityDescriptor(userId: string) {
  return {
    load: () => loadOverviewAvailability(userId),
  } satisfies RouteDataDescriptor<unknown>;
}

export function practiceOverviewDescriptor(userId: string) {
  return { load: () => loadOverviewQuery(userId, 'practice-overview') };
}

export function reviewPracticeDescriptor(userId: string, reviewKind: ReviewKind) {
  return {
    load: () => loadReviewDeckData(userId, reviewKind),
  } satisfies RouteDataDescriptor<ReviewDeckData>;
}

export function grammarDescriptor(userId: string) {
  return { load: () => loadOverviewQuery(userId, 'grammar') };
}

export function topicsDescriptor(userId: string) {
  return { load: () => loadOverviewQuery(userId, 'topics') };
}

export function topicDetailDescriptor(userId: string, topicId: number) {
  return {
    load: async () => {
      const [topic, items] = await Promise.all([
        loadSharedQuery(userId, `topic:${topicId}`, () => Topic.getById(topicId)),
        loadSharedQuery(userId, `topic-items:${topicId}`, () => UserItem.getInitiatedByTopicId(userId, topicId)),
      ]);
      return { topic, items };
    },
  };
}

export function vocabularyDescriptor(userId: string) {
  return { load: () => loadOverviewQuery(userId, 'vocabulary') };
}

export function pronunciationGroupDetailDescriptor(userId: string, groupId: number) {
  return {
    load: () => loadSharedQuery(userId, `pronunciation:${groupId}`, () => PronunciationGroup.getDetail(userId, groupId)),
  };
}

export function initialTrainingDescriptor(userId: string) {
  return {
    load: () => loadInitialTrainingData(userId),
  };
}

export type { OverviewAvailabilityData } from '@/hooks/overview-query-store';
export type TopicDetailData = Awaited<ReturnType<ReturnType<typeof topicDetailDescriptor>['load']>>;
