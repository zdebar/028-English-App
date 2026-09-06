import type {
  LessonType,
  LevelOverviewType,
  LessonOverviewType,
  LevelType,
  ProgressCountsType,
} from '@/types/generic.types';
import type { UserItemLocal } from '@/types/user-item.types';
import { getTodayShortDate, getLocalDateFromUTC } from './database.utils';
import config from '@/config/config';

const NULL_DATE = config.database.nullReplacementDate;

/**
 * Builds level and lesson progress summaries from user items.
 *
 * @param items User items already filtered for the target user.
 * @param lessons Lesson records used as aggregation buckets.
 * @param levels Level records used to group lesson summaries.
 * @returns Levels that contain at least one lesson with items, sorted by level sort_order. Lesson
 * summaries include total, initiated, started, and started-today counts. Initial-training skips
 * are initiated for curriculum progress, but are not included in started counts.
 */
export function aggregateLevels(
  items: UserItemLocal[],
  lessons: LessonType[],
  levels: LevelType[],
  today: string = getTodayShortDate(),
): LevelOverviewType[] {
  const countKeys: (keyof ProgressCountsType)[] = [
    'initiatedCount',
    'startedCount',
    'startedTodayCount',
    'totalCount',
  ];

  const createEmptyCounts = (): ProgressCountsType => ({
    initiatedCount: 0,
    startedCount: 0,
    startedTodayCount: 0,
    totalCount: 0,
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
      const isStarted = item.started_at !== NULL_DATE;
      const isInitialTrainingSkipped = isUnstartedAndMasteredInBothDirections(item);

      if (isStarted || isInitialTrainingSkipped) counts.initiatedCount++;
      if (isStarted) counts.startedCount++;
      if (isStarted && getLocalDateFromUTC(item.started_at) === today)
        counts.startedTodayCount++;
      counts.totalCount++;
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
      for (const key of countKeys) {
        level[key] += lesson[key];
      }
    }
  });

  return Array.from(levelOverviews.values())
    .filter((level) => level.lessons.length > 0)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function isUnstartedAndMasteredInBothDirections(item: UserItemLocal): boolean {
  return (
    item.started_at === NULL_DATE &&
    item.mastered_at_cz_to_en !== NULL_DATE &&
    item.mastered_at_en_to_cz !== NULL_DATE
  );
}
