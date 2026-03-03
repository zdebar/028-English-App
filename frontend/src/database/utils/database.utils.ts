import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import { errorHandler } from '@/features/logging/error-handler';
import type { UserItemSQL } from '@/types/data.types';
import type {
  LessonsOverview,
  LevelsOverview,
  UserItemLocal,
  UserItemPractice,
} from '@/types/local.types';
import UserItem from '../models/user-items';
import { infoHandler } from '@/features/logging/info-handler';
import { SupabaseError } from '@/types/error.types';
import { assertNonNegativeInteger } from '@/utils/assertions.utils';

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
    level_sort_order: sqlItem.level_sort_order ?? null,
    lesson_sort_order: sqlItem.lesson_sort_order ?? null,
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
 * Triggers a custom DOM event with the specified name and attaches the user ID as event detail.
 *
 * @param eventName - The name of the custom event to trigger.
 * @param userId - The ID of the user to include in the event detail. If falsy, the event is not triggered.
 * @throws Error if userId is not provided.
 */
export function triggerNamedEvent(eventName: string, userId: string) {
  if (!userId) throw new Error('User ID is required to trigger event.');
  if (!eventName) throw new Error('Event name is required to trigger event.');

  const event = new CustomEvent(eventName, { detail: { userId } });
  window.dispatchEvent(event);
}

/**
 * Triggers the 'userItemsUpdated' event for a specific user.
 *
 * @param userId - The unique user identifier.
 */
export function triggerUserItemsUpdatedEvent(userId: string) {
  if (!userId) throw new Error('User ID is required to trigger userItemsUpdated event.');

  triggerNamedEvent('userItemsUpdated', userId);
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
 * Aggregates lessons and levels from filtered user items.
 *
 * @param filtered - Array of filtered UserItemLocal
 * @param today - Today's date string for startedTodayCount/masteredTodayCount
 * @returns Sorted array of LevelsOverview objects
 */
export function aggregateLessonsAndLevels(
  filtered: UserItemLocal[],
  today: string,
): LevelsOverview[] {
  // 1. Aggregate lessons
  const lessonsMap = new Map<number, LessonsOverview>();
  filtered.forEach((item) => {
    const prev = lessonsMap.get(item.lesson_id!);
    lessonsMap.set(item.lesson_id!, {
      lesson_id: item.lesson_id!,
      lesson_sort_order: item.lesson_sort_order!,
      lesson_name: item.lesson_name!,
      level_id: item.level_id!,
      level_sort_order: item.level_sort_order!,
      level_name: item.level_name!,
      startedCount: (prev?.startedCount ?? 0) + (item.started_at !== NULL_DATE ? 1 : 0),
      startedTodayCount:
        (prev?.startedTodayCount ?? 0) +
        (getLocalDateFromUTC(item.started_at).startsWith(today) ? 1 : 0),
      masteredCount: (prev?.masteredCount ?? 0) + (item.mastered_at !== NULL_DATE ? 1 : 0),
      masteredTodayCount:
        (prev?.masteredTodayCount ?? 0) +
        (getLocalDateFromUTC(item.mastered_at).startsWith(today) ? 1 : 0),
      totalCount: (prev?.totalCount ?? 0) + 1,
    });
  });

  // 2. Aggregate levels
  const levelsMap = new Map<number, LevelsOverview>();
  for (const lesson of lessonsMap.values()) {
    const prev = levelsMap.get(lesson.level_id!);
    const updatedLessons = [...(prev?.lessons ?? []), lesson].sort((a, b) => {
      if (a.level_sort_order !== b.level_sort_order) {
        return a.level_sort_order - b.level_sort_order;
      }
      if (a.lesson_sort_order !== b.lesson_sort_order) {
        return a.lesson_sort_order - b.lesson_sort_order;
      }
      return a.lesson_id - b.lesson_id;
    });
    levelsMap.set(lesson.level_id!, {
      level_id: lesson.level_id!,
      level_sort_order: lesson.level_sort_order!,
      level_name: lesson.level_name!,
      startedCount: (prev?.startedCount ?? 0) + lesson.startedCount,
      startedTodayCount: (prev?.startedTodayCount ?? 0) + lesson.startedTodayCount,
      masteredCount: (prev?.masteredCount ?? 0) + lesson.masteredCount,
      masteredTodayCount: (prev?.masteredTodayCount ?? 0) + lesson.masteredTodayCount,
      totalCount: (prev?.totalCount ?? 0) + lesson.totalCount,
      lessons: updatedLessons,
    });
  }

  // 3. Return sorted array by level_sort_order
  return Array.from(levelsMap.values()).sort(
    (a, b) => (a.level_sort_order ?? 0) - (b.level_sort_order ?? 0),
  );
}
