import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import { errorHandler } from '@/features/logging/error-handler';
import type { UserItemSQL } from '@/types/sql.types';
import type {
  UserItemLocal,
  UserItemPractice,
  LessonLocal,
  LevelOverview,
  LessonOverview,
  LevelLocal,
  ProgressCounts,
} from '@/types/local.types';

import { TableName } from '@/types/local.types';
import UserItem from '../models/user-items';
import { infoHandler } from '@/features/logging/info-handler';
import { SupabaseError } from '@/types/error.types';
import { assertNonNegativeInteger } from '@/utils/assertions.utils';
import Metadata from '../models/metadata';
import type { Dexie } from 'dexie';
import { db } from '../models/db';
import { splitDeleted } from './data-sync.utils';

const NULL_DATE = config.database.nullReplacementDate;
const NULL_NUMBER = config.database.nullReplacementNumber;

/**
 * Converts a `UserItemLocal` object to a `UserItemSQL` object, replacing specific date fields
 * with `null` if they match the configured `nullReplacementDate`.
 *
 * @param localItem - The local user item to convert.
 * @returns The converted user item suitable for SQL storage.
 */
export function convertLocalToSQL(localItem: UserItemLocal): UserItemSQL {
  const { user_id, item_id, progress, started_at, updated_at, next_at, mastered_at } = localItem;

  return {
    user_id,
    item_id,
    progress,
    started_at: started_at === NULL_DATE ? null : started_at,
    updated_at,
    next_at: next_at === NULL_DATE ? null : next_at,
    mastered_at: mastered_at === NULL_DATE ? null : mastered_at,
  };
}

/**
 * Converts a SQL/RPC user item payload to local user item shape,
 * replacing nullable sortable/date fields with configured null-replacement values.
 *
 * @param sqlItem - The SQL/RPC user item payload to normalize.
 * @returns Normalized local user item.
 */
export function convertSQLToLocal(sqlItem: UserItemLocal): UserItemLocal {
  return {
    ...sqlItem,
    item_sort_order: sqlItem.item_sort_order ?? 0,
    grammar_id: sqlItem.grammar_id ?? NULL_NUMBER,
    started_at: sqlItem.started_at ?? NULL_DATE,
    next_at: sqlItem.next_at ?? NULL_DATE,
    mastered_at: sqlItem.mastered_at ?? NULL_DATE,
  } as UserItemLocal;
}

/**
 * Returns today's date in YYYY-MM-DD format.
 *
 * @returns The current date in YYYY-MM-DD format.
 */
export function getTodayShortDate(): string {
  const today = new Date();
  return today.toLocaleDateString('en-CA');
}

/**
 * Converts a UTC date string to a local date string formatted as 'YYYY-MM-DD'.
 *
 * @param date - The UTC date string to convert.
 * @returns The local date string in 'en-CA' format ('YYYY-MM-DD').
 */
export function getLocalDateFromUTC(date: string): string {
  if (!date) throw new Error('Date string is required');

  const localDate = new Date(date);
  return localDate.toLocaleDateString('en-CA');
}

/**
 * Fetches a file from Supabase storage bucket.
 *
 * @param bucketName name of the storage bucket
 * @param dataFile name of the file to fetch
 * @returns Blob data or null on missing/error
 */
export async function fetchStorage(bucketName: string, dataFile: string): Promise<Blob> {
  if (!bucketName) throw new Error('Bucket name is required');
  if (!dataFile) throw new Error('Data file name is required');

  const cacheBuster = `?t=${Date.now()}`;
  const filePath = dataFile.replace(/^\//, '') + cacheBuster;

  const { data, error } = await supabaseInstance.storage.from(bucketName).download(filePath);

  if (error || !data) {
    throw new SupabaseError(
      `Error fetching file ${dataFile} from bucket ${bucketName}: ${error?.message || 'No data returned'}`,
    );
  }

  return data;
}

/**
 * Resets the properties of a given `UserItemLocal` object to their initial state.
 *
 * - Sets `started_at`, `next_at`, and `mastered_at` to the configured null replacement date.
 * - Updates `updated_at` to the current ISO timestamp.
 * - Resets `progress` to 0.
 *
 * @param item - The user item object to reset.
 */
export function resetUserItem(item: UserItemLocal): void {
  item.started_at = NULL_DATE;
  item.next_at = NULL_DATE;
  item.mastered_at = NULL_DATE;
  item.updated_at = new Date().toISOString();
  item.progress = 0;
}

/**
 * Returns the next review date based on the user's progress with randomness.
 * @param progress Item's progress.
 * @returns Date string in ISO format for the next review.
 * @throws Error if progress is not a positive integer.
 */
export function getNextAt(progress: number): string {
  assertNonNegativeInteger(progress, 'Progress must be a non-negative integer');

  const interval = config.srs.intervals[progress];
  if (interval == null) return NULL_DATE;

  const randomFactor = 1 + config.srs.randomness * (Math.random() * 2 - 1);
  const randomizedInterval = Math.round(interval * randomFactor);
  const nextDate = new Date(Date.now() + randomizedInterval * 1000);
  return nextDate.toISOString();
}

/**
 * Sorts practice items by odd progress first.
 * @param items Array of UserItemLocal to be sorted.
 * @returns Sorted array of UserItemLocal.
 * @throws Error if items array is invalid.
 */
export function sortOddEvenByProgress(items: UserItemLocal[]): UserItemLocal[] {
  return items.sort((a, b) => {
    // Sort by odd progress first
    const oddA = a.progress % 2;
    const oddB = b.progress % 2;
    if (oddA !== oddB) return oddB - oddA;

    // Sort by item_sort_order (ascending)
    return a.item_sort_order - b.item_sort_order;
  });
}

/**
 * Restores unsaved practice deck progress from local storage and saves it to the database.
 *
 * @param userId - The ID of the user whose progress should be restored
 * @returns A promise that resolves when the restore operation is complete
 * @throws Does not throw; errors are handled internally and logged via errorHandler
 */
export async function restoreUnsavedFromLocalStorage(userId: string): Promise<void> {
  if (!userId) throw new Error('User ID is required to restore unsaved progress from localStorage');

  const key = `practiceDeckProgress_${userId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const userProgress = JSON.parse(saved);
      if (Array.isArray(userProgress) && userProgress.length > 0) {
        UserItem.savePracticeDeck(userId, userProgress);
      }
      localStorage.removeItem(key);
      infoHandler(
        `Restored unsaved practice deck progress for user ${userId} with ${userProgress.length} items.`,
      );
    } catch (e) {
      errorHandler('Error parsing practice deck progress from localStorage', e);
      localStorage.removeItem(key);
    }
  }
}

/**
 * Adds a grammar indicator flag to practice items based on started grammar IDs.
 *
 * @param practiceItems - Array of UserLocal items
 * @param startedGrammarIdSet - Set of grammar IDs that have already been started
 * @returns Array of UserItemPractice with show_new_grammar_indicator flag set
 */
export function addGrammarIndicatorFlag(
  practiceItems: UserItemLocal[],
  startedGrammarIdSet: Set<number>,
): UserItemPractice[] {
  const shownGrammarIds = new Set<number>();
  return practiceItems.map((item) => {
    let show = false;
    if (
      item.grammar_id !== 0 &&
      !startedGrammarIdSet.has(item.grammar_id) &&
      !shownGrammarIds.has(item.grammar_id)
    ) {
      show = true;
      shownGrammarIds.add(item.grammar_id);
    }
    return {
      ...item,
      show_new_grammar_indicator: show,
    };
  });
}

/**
 * Aggregates levels from user items.
 *
 * @param items - Array of filtered UserItemLocal
 * @param lessons - Array of LessonLocal
 * @param levels - Array of LevelLocal
 */
export function aggregateLevels(
  items: UserItemLocal[],
  lessons: LessonLocal[],
  levels: LevelLocal[],
): LevelOverview[] {
  const today = getTodayShortDate();
  const progressKeys: (keyof ProgressCounts)[] = [
    'startedCount',
    'startedTodayCount',
    'masteredCount',
    'masteredTodayCount',
    'totalCount',
  ];

  const createEmptyCounts = (): ProgressCounts => ({
    startedCount: 0,
    startedTodayCount: 0,
    masteredCount: 0,
    masteredTodayCount: 0,
    totalCount: 0,
  });

  const lessonCounts: ProgressCounts[] = lessons.map(() => createEmptyCounts());

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
  const lessonOverviews: LessonOverview[] = lessons
    .map((lesson, idx) => ({
      ...lesson,
      ...lessonCounts[idx],
    }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Build LevelOverview[] with lessons grouped
  const levelOverviews = new Map<number, LevelOverview>();
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

  return Array.from(levelOverviews.values()).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

/**
 * Generic function to sync any table from a remote source.
 * @param dbTable - Dexie table instance. Requires casting to Dexie.Table<TableType, number> see example.
 * @param tableName - Table name for metadata
 * @param fetchRemoteFn - Function to fetch remote data, must return array of entities
 * @param doFullSync - Whether to perform a full sync
 *
 * @example
 * await syncFromRemoteGeneric(db.levels as Dexie.Table<LevelLocal, number>, TableName.Levels, Levels.fetchFromRemote, false);
 */
export async function syncFromRemoteGeneric<T extends { deleted_at: string | null; id: number }>(
  dbTable: Dexie.Table<T, number>,
  tableName: TableName,
  fetchRemoteFn: (lastSyncedAt: string) => Promise<T[]>,
  doFullSync: boolean = false,
): Promise<void> {
  // Step 1: Determine last synced timestamp and new sync timestamp
  const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(doFullSync);

  // Step 2: Fetch remote data
  const remoteItems = await fetchRemoteFn(lastSyncedAt);

  // Step 3: Split remote items into upsert and delete lists
  const { toUpsert, toDelete } = splitDeleted(remoteItems);

  // Step 4: Sync with local database in a transaction
  await db.transaction('rw', dbTable, db.metadata, async () => {
    if (doFullSync) {
      await dbTable.clear();
    } else if (toDelete.length > 0) {
      await dbTable.bulkDelete(toDelete.map((item: any) => item.id));
    }
    if (toUpsert.length > 0) {
      await dbTable.bulkPut(toUpsert);
    }
    await Metadata.markAsSynced(tableName, newSyncedAt);
  });

  infoHandler(`Completed ${remoteItems.length} ${tableName} pull from remote.`);
}

/**
 * Returns the last synced timestamp and the new sync timestamp for a user.
 * @param doFullSync - Whether to perform a full sync.
 * @param userId - The user ID.
 */
export async function getSyncTimestamps(
  doFullSync: boolean,
  userId?: string,
): Promise<{ lastSyncedAt: string; newSyncedAt: string }> {
  const lastSyncedAt = doFullSync
    ? config.database.epochStartDate
    : await Metadata.getSyncedAt(TableName.UserScores, userId);
  const newSyncedAt = new Date().toISOString();
  return { lastSyncedAt, newSyncedAt };
}
