import { loadSharedQuery } from '@/hooks/shared-query-store';
import { hasReachedReviewLimit } from '@/features/practice/practice-availability';
import { loadReviewAvailabilityFromArrays } from '@/features/practice/review-prefetch';
import {
  getPrefetchedNextInitialLesson,
  type PreparedInitialLesson,
} from '@/features/practice/practice-prefetch';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import UserLesson from '@/database/models/user-lessons';
import UserItem from '@/database/models/user-items';
import Topic from '@/database/models/topics';
import SoundGroup from '@/database/models/sound-groups';
import {
  loadReviewDeckData,
  type ReviewDeckData,
} from '@/database/utils/practice-content.utils';
import type { ReviewKind } from '@/types/practice.types';
import {
  loadOverviewAvailability,
  loadOverviewQuery,
} from '@/hooks/overview-query-store';

export type RouteDataDescriptor<T> = Readonly<{
  load: () => Promise<T>;
}>;

export type InitialTrainingData = PreparedInitialLesson;

function emptyInitialTrainingData(): InitialTrainingData {
  return { lesson: null, items: [], entries: [], grammar: null, grammarGroup: null };
}

async function loadInitialTrainingData(userId: string): Promise<InitialTrainingData> {
  const prepared = await getPrefetchedNextInitialLesson(userId);
  if (!prepared?.lesson) return emptyInitialTrainingData();

  const continuingLesson = await UserLesson.hasStartedToday(userId, prepared.lesson.id);
  if (!continuingLesson && await shouldBlockInitialTraining(userId)) {
    return emptyInitialTrainingData();
  }
  if (!(await UserLesson.canStartToday(userId, prepared.lesson.id))) {
    return emptyInitialTrainingData();
  }
  return prepared;
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
        loadSharedQuery(userId, `topic:${topicId}`, () => Topic.getById(userId, topicId)),
        loadSharedQuery(userId, `topic-items:${topicId}`, () => UserItem.getInitiatedByTopicId(userId, topicId)),
      ]);
      return { topic, items };
    },
  };
}

export function vocabularyDescriptor(userId: string) {
  return { load: () => loadOverviewQuery(userId, 'vocabulary') };
}

export function soundsDescriptor(userId: string) {
  return { load: () => loadOverviewQuery(userId, 'sounds') };
}

export function soundGroupDetailDescriptor(userId: string, groupId: number) {
  return {
    load: () => loadSharedQuery(userId, `sound:${groupId}`, () => SoundGroup.getDetail(userId, groupId)),
  };
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
export type SoundGroupDetailData = Awaited<ReturnType<ReturnType<typeof soundGroupDetailDescriptor>['load']>>;
