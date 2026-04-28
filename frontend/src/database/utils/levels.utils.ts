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
 * Aggregates levels from user items.
 *
 * @param items - Array of filtered UserItemLocal
 * @param lessons - Array of LessonLocal
 * @param levels - Array of LevelLocal
 */
export function aggregateLevels(
  items: UserItemLocal[],
  lessons: LessonType[],
  levels: LevelType[],
): LevelOverviewType[] {
  const today = getTodayShortDate();
  const progressKeys: (keyof ProgressCountsType)[] = [
    'startedCount',
    'startedTodayCount',
    'masteredCount',
    'masteredTodayCount',
    'totalCount',
  ];

  const createEmptyCounts = (): ProgressCountsType => ({
    startedCount: 0,
    startedTodayCount: 0,
    masteredCount: 0,
    masteredTodayCount: 0,
    totalCount: 0,
  });

  const lessonCounts: ProgressCountsType[] = lessons.map(() => createEmptyCounts());

  // Map lesson_id to index for fast lookup
  const lessonIdToIndex = new Map<number, number>();
  lessons.forEach((lesson, idx) => lessonIdToIndex.set(lesson.id, idx));

  // Aggregate counts for lessons
  items.forEach((item) => {
    const idx = lessonIdToIndex.get(item.lesson_id);
    if (idx === undefined) return;
    const counts = lessonCounts[idx];
    if (item.started_at !== NULL_DATE) counts.startedCount++;
    if (item.started_at !== NULL_DATE && getLocalDateFromUTC(item.started_at).startsWith(today))
      counts.startedTodayCount++;
    if (item.mastered_at !== NULL_DATE) counts.masteredCount++;
    if (item.mastered_at !== NULL_DATE && getLocalDateFromUTC(item.mastered_at).startsWith(today))
      counts.masteredTodayCount++;
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
      for (const key of progressKeys) {
        level[key] += lesson[key];
      }
    }
  });

  return Array.from(levelOverviews.values())
    .filter((level) => level.lessons.length > 0)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}
