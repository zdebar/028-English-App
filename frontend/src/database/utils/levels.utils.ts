import type {
  LessonType,
  LevelOverviewType,
  LessonOverviewType,
  LevelType,
  ProgressCountsType,
} from '@/types/generic.types';
import type { UserItemLocal, UserItemProgressHistoryType } from '@/types/user-item.types';
import { getTodayShortDate, getLocalDateFromUTC } from './database.utils';
import config from '@/config/config';
import { getItemEffectiveProgress, getItemMaximumProgress } from '@/utils/progress.utils';

const NULL_DATE = config.database.nullReplacementDate;

/**
 * Builds level and lesson progress summaries from user items.
 *
 * @param items User items already filtered for the target user.
 * @param lessons Lesson records used as aggregation buckets.
 * @param levels Level records used to group lesson summaries.
 * @returns Levels that contain at least one lesson with items, sorted by level sort_order. Lesson
 * summaries include counts, current effective progress, maximum progress, and today's delta.
 */
export function aggregateLevels(
  items: UserItemLocal[],
  lessons: LessonType[],
  levels: LevelType[],
  today: string = getTodayShortDate(),
  history: UserItemProgressHistoryType[] = [],
): LevelOverviewType[] {
  const progressKeys: (keyof ProgressCountsType)[] = [
    'startedCount',
    'startedTodayCount',
    'totalCount',
    'currentProgress',
    'dailyProgressChange',
    'maximumProgress',
  ];

  const createEmptyCounts = (): ProgressCountsType => ({
    startedCount: 0,
    startedTodayCount: 0,
    totalCount: 0,
    currentProgress: 0,
    dailyProgressChange: 0,
    maximumProgress: 0,
  });

  const dailyChangeByItem = new Map<number, number>();
  history.forEach((entry) => {
    if (entry.date !== today) return;
    if (entry.deleted_at !== null && entry.deleted_at !== NULL_DATE) return;
    dailyChangeByItem.set(
      entry.item_id,
      (dailyChangeByItem.get(entry.item_id) ?? 0) + entry.progress_change,
    );
  });

  const lessonCounts: ProgressCountsType[] = lessons.map(() => createEmptyCounts());

  // Map lesson_id to index for fast lookup
  const lessonIdToIndex = new Map<number, number>();
  lessons.forEach((lesson, idx) => lessonIdToIndex.set(lesson.id, idx));

  // Aggregate counts for lessons
  items
    .filter((item) => item.deleted_at === NULL_DATE)
    .forEach((item) => {
      const idx = lessonIdToIndex.get(item.lesson_id);
      if (idx === undefined) return;
      const counts = lessonCounts[idx];
      if (item.started_at !== NULL_DATE) counts.startedCount++;
      if (item.started_at !== NULL_DATE && getLocalDateFromUTC(item.started_at).startsWith(today))
        counts.startedTodayCount++;
      counts.totalCount++;
      counts.currentProgress = (counts.currentProgress ?? 0) + getItemEffectiveProgress(item);
      counts.dailyProgressChange =
        (counts.dailyProgressChange ?? 0) + (dailyChangeByItem.get(item.item_id) ?? 0);
      counts.maximumProgress = (counts.maximumProgress ?? 0) + getItemMaximumProgress();
    });

  // Build LessonOverview[]
  const lessonOverviews: LessonOverviewType[] = lessons
    .map((lesson, idx) => ({
      ...lesson,
      ...lessonCounts[idx],
    }))
    .filter((lesson) => lesson.totalCount > 0)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Build LevelOverview[] with lessons grouped
  const levelOverviews = new Map<number, LevelOverviewType>();
  levels.forEach((level) => {
    levelOverviews.set(level.id, {
      ...level,
      ...createEmptyCounts(),
      lessons: [],
    });
  });

  lessonOverviews.forEach((lesson) => {
    const level = levelOverviews.get(lesson.level_id);
    if (level) {
      level.lessons.push(lesson);
      for (const key of progressKeys) {
        level[key] += lesson[key] ?? 0;
      }
    }
  });

  return Array.from(levelOverviews.values())
    .filter((level) => level.lessons.length > 0)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}
