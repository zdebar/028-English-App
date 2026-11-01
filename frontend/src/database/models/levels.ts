import { db } from '@/database/models/db';
import type {
  LessonType,
  LessonOverviewType,
  LevelOverviewType,
  LevelType,
  ProgressCountsType,
} from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import type { UserItemLocal } from '@/types/user-item.types';
import Dexie from 'dexie';
import config from '@/config/config';
import { isInitiated } from '@/utils/progress.utils';
import UserItem from './user-items';
import Lessons from './lessons';
import SyncEntityModel from './sync-entity-model';

const NULL_DATE = config.database.nullReplacementDate;

/**
 * Shared level lookup model.
 *
 * Public API:
 * - `getOverview` combines local levels, lessons, user items, and started lesson records.
 * - `syncFromRemote` is inherited from `SyncEntityModel`.
 */
export default class Levels extends SyncEntityModel implements LevelType {
  id!: number;
  name!: string;
  note!: string | null;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.levels as Dexie.Table<LevelType, number>;
  static override readonly syncTableName = TableName.Levels;
  static override readonly syncEntityName = 'levels';
  static override readonly syncSelect = 'id, name, note, sort_order, deleted_at';

  /**
   * Builds a level overview with lesson progress for a user.
   *
   * @param userId User id whose practice items should be aggregated.
   * @param localDate Local date used for started-today counts.
   * @returns Level summaries with nested lessons and their started state.
   */
  static getOverview(userId: string, localDate: string): Promise<LevelOverviewType[]> {
    return db.transaction('r', db.user_items, db.user_lessons, db.lessons, db.levels, async () => {
      const [items, userLessons, lessons, levels] = await Promise.all([
        UserItem.getByUserId(userId),
        db.user_lessons.where('user_id').equals(userId).toArray(),
        Lessons.getAll(),
        db.levels.toArray(),
      ]);
      const startedLessonIds = new Set(userLessons.map((userLesson) => userLesson.lesson_id));
      return aggregateLevels(items, lessons, levels, localDate, startedLessonIds);
    });
  }
}

/**
 * Builds level and lesson progress summaries from user items.
 *
 * @param items User items already filtered for the target user.
 * @param lessons Lesson records used as aggregation buckets.
 * @param levels Level records used to group lesson summaries.
 * @returns All non-deleted levels, sorted by level sort_order, including levels without lessons.
 * Each level contains its non-deleted lessons, including lessons without items. Lesson summaries
 * include total, initiated, started, and started-today counts. Initial-training skips are initiated
 * for curriculum progress, but are not included in started counts.
 */
export function aggregateLevels(
  items: UserItemLocal[],
  lessons: LessonType[],
  levels: LevelType[],
  today: string = getTodayLocalDateKey(),
  startedLessonIds: ReadonlySet<number> = new Set(),
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
  const lessonCounts = lessons.map(() => createEmptyCounts());
  const lessonIdToIndex = new Map<number, number>();
  lessons.forEach((lesson, index) => lessonIdToIndex.set(lesson.id, index));

  items
    .filter((item) => item.deleted_at === NULL_DATE)
    .forEach((item) => {
      const index = lessonIdToIndex.get(item.lesson_id);
      if (index === undefined) return;
      const counts = lessonCounts[index];
      const isStarted = item.started_at !== NULL_DATE;

      if (isInitiated(item)) counts.initiatedCount++;
      if (isStarted) counts.startedCount++;
      if (isStarted && getLocalDateKeyFromUTC(item.started_at) === today) {
        counts.startedTodayCount++;
      }
      counts.totalCount++;
    });

  const lessonOverviews: LessonOverviewType[] = lessons
    .map((lesson, index) => ({
      ...lesson,
      ...lessonCounts[index],
      isStarted: startedLessonIds.has(lesson.id),
    }))
    .filter((lesson) => !lesson.deleted_at)
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0));

  const levelOverviews = new Map<number, LevelOverviewType>();
  levels.filter((level) => !level.deleted_at).forEach((level) => {
    levelOverviews.set(level.id, {
      ...level,
      ...createEmptyCounts(),
      lessons: [],
    });
  });

  lessonOverviews.forEach((lesson) => {
    const level = levelOverviews.get(lesson.level_id);
    if (!level) return;
    level.lessons.push(lesson);
    for (const key of countKeys) level[key] += lesson[key];
  });

  return Array.from(levelOverviews.values())
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0));
}

/** Returns today's local calendar date as a YYYY-MM-DD key. */
export function getTodayLocalDateKey(): string {
  return new Date().toLocaleDateString('en-CA');
}

/** Converts a timestamp to the local calendar date key used by level counters. */
export function getLocalDateKeyFromUTC(date: string): string {
  return new Date(date).toLocaleDateString('en-CA');
}
