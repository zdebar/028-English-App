import config from '@/config/config';
import Groups from './groups';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type {
  PracticeDeckItem,
  PracticeOutcome,
  UserItemLocal,
  CurriculumSortPath,
  InitialTrainingSelection,
} from '@/types/user-item.types';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import { TableName } from '@/types/table.types';
import Dexie, { Entity } from 'dexie';
import { getSyncTimestamps, splitDeleted } from '../utils/sync-generic.utils';

import { getNextAt, resetUserItem } from '@/database/utils/user-items.utils';
import { isReviewItemCandidate, isReviewItemDue, isReviewItemReadyAt, isReviewItemFuture } from '@/database/utils/review-items.utils';
import { SupabaseError } from '@/types/error.types';
import type { ReadyPracticeState } from '@/types/generic.types';
import Metadata from './metadata';
import { reportInfo } from '@/features/logging/monitoring-handler';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { isInitiated } from '@/utils/progress.utils';

const NULL_DATE = config.database.nullReplacementDate;
const SIM_LESSON_COUNT = config.progress.simulationLessonCount;
const SIM_ITEM_PROGRESS = config.progress.simulationItemProgress;

type UserItemAPI = Omit<
  UserItemLocal,
  | 'is_vocabulary'
  | 'started_at'
  | 'deleted_at'
  | 'next_at_cz_to_en'
  | 'mastered_at_cz_to_en'
  | 'next_at_en_to_cz'
  | 'mastered_at_en_to_cz'
  | 'is_cz_to_en_enabled'
  | 'is_en_to_cz_enabled'
> & {
  is_vocabulary: boolean;
  started_at: string | null;
  deleted_at: string | null;
  next_at_cz_to_en: string | null;
  mastered_at_cz_to_en: string | null;
  next_at_en_to_cz: string | null;
  mastered_at_en_to_cz: string | null;
  is_cz_to_en_enabled: boolean;
  is_en_to_cz_enabled: boolean;
};

type UserItemExport = Pick<
  UserItemAPI,
  | 'user_id'
  | 'item_id'
  | 'progress_cz_to_en'
  | 'started_at'
  | 'updated_at'
  | 'next_at_cz_to_en'
  | 'mastered_at_cz_to_en'
  | 'progress_en_to_cz'
  | 'next_at_en_to_cz'
  | 'mastered_at_en_to_cz'
>;

function convertLocalToExport(localItem: UserItemLocal): UserItemExport {
  const {
    user_id,
    item_id,
    progress_cz_to_en,
    updated_at,
    started_at,
    next_at_cz_to_en,
    mastered_at_cz_to_en,
    progress_en_to_cz,
    next_at_en_to_cz,
    mastered_at_en_to_cz,
  } = localItem;
  return {
    user_id,
    item_id,
    progress_cz_to_en,
    updated_at,
    started_at: started_at === NULL_DATE ? null : started_at,
    next_at_cz_to_en: next_at_cz_to_en === NULL_DATE ? null : next_at_cz_to_en,
    mastered_at_cz_to_en: mastered_at_cz_to_en === NULL_DATE ? null : mastered_at_cz_to_en,
    progress_en_to_cz,
    next_at_en_to_cz: next_at_en_to_cz === NULL_DATE ? null : next_at_en_to_cz,
    mastered_at_en_to_cz: mastered_at_en_to_cz === NULL_DATE ? null : mastered_at_en_to_cz,
  };
}

function convertAPIToLocal(apiItem: UserItemAPI): UserItemLocal {
  return {
    ...apiItem,
    is_vocabulary: apiItem.is_vocabulary ? 1 : 0,
    started_at: replaceNullDate(apiItem.started_at),
    next_at_cz_to_en: replaceNullDate(apiItem.next_at_cz_to_en),
    mastered_at_cz_to_en: replaceNullDate(apiItem.mastered_at_cz_to_en),
    next_at_en_to_cz: replaceNullDate(apiItem.next_at_en_to_cz),
    mastered_at_en_to_cz: replaceNullDate(apiItem.mastered_at_en_to_cz),
    progress_en_to_cz: apiItem.progress_en_to_cz ?? 0,
    is_cz_to_en_enabled: apiItem.is_cz_to_en_enabled ?? true,
    is_en_to_cz_enabled: apiItem.is_en_to_cz_enabled ?? true,
    deleted_at: replaceNullDate(apiItem.deleted_at),
  };
}

function getUserItemKey(item: Pick<UserItemLocal, 'user_id' | 'item_id'>): string {
  return `${item.user_id}:${item.item_id}`;
}

function isWithinSyncWindow(
  item: Pick<UserItemLocal, 'updated_at'>,
  lastSyncedAt: string,
  newSyncedAt: string,
): boolean {
  return item.updated_at > lastSyncedAt && item.updated_at <= newSyncedAt;
}

function hasChangedSinceSnapshot(
  item: UserItemLocal,
  snapshotByKey: ReadonlyMap<string, UserItemLocal>,
): boolean {
  const snapshot = snapshotByKey.get(getUserItemKey(item));
  return snapshot?.updated_at !== item.updated_at;
}

function replaceNullDate(value: string | null): string {
  return value ?? NULL_DATE;
}

async function getUnstartedItems(userId: string): Promise<UserItemLocal[]> {
  const items = await db.user_items.where('user_id').equals(userId).toArray();
  return items
    .filter(
      (item) =>
        item.deleted_at === NULL_DATE &&
        item.is_cz_to_en_enabled !== false &&
        item.started_at === NULL_DATE &&
        !isInitialTrainingSkipped(item),
    )
    .sort((left, right) =>
      compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path),
    );
}

function getLessonTrainingSelection(
  firstItem: UserItemLocal,
  unstartedItems: UserItemLocal[],
): InitialTrainingSelection {
  return {
    lessonId: firstItem.lesson_id,
    items: unstartedItems.filter((item) => item.lesson_id === firstItem.lesson_id),
  };
}

function resolveInitialTrainingSelection(
  unstartedItems: UserItemLocal[],
): InitialTrainingSelection | null {
  const firstItem = unstartedItems[0];
  if (!firstItem) return null;
  return getLessonTrainingSelection(firstItem, unstartedItems);
}

/**
 * Local Dexie model and sync API for user-specific vocabulary and grammar item progress.
 *
 * Public API:
 * - Review flow: `getReviewDeck`, `savePracticeDeck`, and `getReadyReviewState`.
 * - Progress lookups: initiated grammar chunks, topic items, and vocabulary.
 * - Initial-training selection and progress.
 * - Maintenance: reset helpers, simulation data, local account deletion, and remote sync.
 *
 * Dates use the configured null replacement date locally and convert to null for remote sync.
 */
export default class UserItem extends Entity<AppDB> implements UserItemLocal {
  item_id!: number;
  user_id!: string;
  czech!: string;
  czech_description!: string | null;
  english!: string;
  pronunciation!: string;
  audio!: string | null;
  is_vocabulary!: 0 | 1; // boolean represented as 0 or 1
  sort_order!: number;
  curriculum_sort_path!: CurriculumSortPath;
  note_id!: number;
  progress_cz_to_en!: number;
  started_at!: string;
  updated_at!: string;
  deleted_at!: string;
  next_at_cz_to_en!: string;
  mastered_at_cz_to_en!: string;
  progress_en_to_cz!: number;
  next_at_en_to_cz!: string;
  mastered_at_en_to_cz!: string;
  is_cz_to_en_enabled!: boolean;
  is_en_to_cz_enabled!: boolean;
  lesson_id!: number;

  /**
   * Returns all due CZ-to-EN review items.
   * @param now Fixed current time shared with availability counts.
   */
  static async getReviewDeck(
    userId: string,
    reviewKind: ReviewKind,
    now: string = new Date().toISOString(),
    direction: ReviewDirection = 'cz_to_en',
  ): Promise<PracticeDeckItem[]> {
    return this.getDuePracticeItems(userId, Number.MAX_SAFE_INTEGER, now, reviewKind, direction);
  }

  /** Reads every non-mastered review item for one review direction without a time cutoff. */
  static getAllReviewItems(userId: string, reviewKind: ReviewKind, direction: ReviewDirection = 'cz_to_en'): Promise<PracticeDeckItem[]> {
    return db.user_items
      .where(getPracticeIndex(direction))
      .between(
        [userId, Dexie.minKey, Dexie.minKey, Dexie.minKey],
        [userId, Dexie.maxKey, Dexie.maxKey, Dexie.maxKey],
        true,
        true,
      )
      .filter((item) => isReviewItemCandidate(item, reviewKind, direction))
      .toArray();
  }

  /**
   * Persists practice progress for the provided items in one transaction.
   *
   * Missing, deleted, or already-mastered items are silently skipped.
   * Empty arrays are ignored.
   */
  static async savePracticeDeck(items: PracticeDeckItem[], direction: ReviewDirection = 'cz_to_en'): Promise<void> {
    if (!items || items.length === 0) return;

    await db.transaction('rw', db.user_items, async () => {
      const updates: Array<{
        key: [string, number];
        changes: Partial<UserItemLocal>;
      }> = [];
      const currentItems = await Promise.all(
        items.map((item) => db.user_items.get([item.user_id, item.item_id])),
      );

      for (const [index, item] of items.entries()) {
        const currentItem = currentItems[index];
        if (currentItem?.deleted_at !== NULL_DATE) continue;
        const currentMasteredAt = direction === 'cz_to_en' ? currentItem.mastered_at_cz_to_en : currentItem.mastered_at_en_to_cz;
        if (currentMasteredAt !== NULL_DATE) continue;

        updates.push({
          key: [item.user_id, item.item_id],
          changes: direction === 'cz_to_en'
            ? {
                progress_cz_to_en: item.progress_cz_to_en,
                started_at: item.started_at,
                updated_at: item.updated_at,
                next_at_cz_to_en: item.next_at_cz_to_en,
                mastered_at_cz_to_en: item.mastered_at_cz_to_en,
              }
            : {
                progress_en_to_cz: item.progress_en_to_cz,
                started_at: item.started_at,
                updated_at: item.updated_at,
                next_at_en_to_cz: item.next_at_en_to_cz,
                mastered_at_en_to_cz: item.mastered_at_en_to_cz,
              },
        });
      }

      if (updates.length > 0) {
        await db.user_items.bulkUpdate(updates);
      }
    });
  }

  /**
   * Reads every local user item row.
   *
   * @returns All rows from IndexedDB, including non-practice and deleted rows.
   */
  static getAll(): Promise<UserItemLocal[]> {
    return db.user_items.toCollection().toArray();
  }

  /**
   * Reads practice item rows for a user.
   *
   * @param userId User id whose items should be read.
   * @returns User rows filtered to practice items.
   */
  static getByUserId(userId: string): Promise<UserItemLocal[]> {
    return db.user_items.where('user_id').equals(userId).toArray();
  }

  static async getByItemIds(userId: string, itemIds: readonly number[]): Promise<UserItemLocal[]> {
    if (itemIds.length === 0) return [];
    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf([...new Set(itemIds)].map((itemId) => [userId, itemId]))
      .toArray();
    return items.sort((left, right) =>
      compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path),
    );
  }

  /** Builds the next initial-training queue from unstarted curriculum items. */
  static async getNextInitialTrainingSelection(
    userId: string,
  ): Promise<InitialTrainingSelection | null> {
    assertNonEmptyString(userId, 'userId');
    const unstartedItems = await getUnstartedItems(userId);
    return resolveInitialTrainingSelection(unstartedItems);
  }

  /** Reads initiated items assigned to one topic, ordered by curriculum position. */
  static async getInitiatedByTopicId(userId: string, topicId: number): Promise<UserItemLocal[]> {
    const topic = (await Groups.getStartedByUser(userId, 'topic')).find(
      (group) => group.id === topicId,
    );
    return topic?.examples ?? [];
  }

  /**
   * Returns whether the user has at least one initiated grammar practice item.
   *
   * @param userId User id whose grammar availability should be checked.
   */
  static async hasInitiatedGrammar(userId: string): Promise<boolean> {
    return (await Groups.getStartedByUser(userId, 'grammar')).length > 0;
  }

  /**
   * Reads unique grammar ids from initiated practice items.
   *
   * @param userId User id whose started items should be inspected.
   * @returns Unique non-null-replacement grammar ids.
   */
  static async getInitiatedGrammarGroupIds(userId: string): Promise<number[]> {
    const groups = await Groups.getStartedByUser(userId, 'grammar');
    return groups.map((group) => group.id);
  }

  /**
   * Reads initiated vocabulary practice items for a user.
   *
   * @param userId User id whose vocabulary items should be read.
   * @returns Vocabulary practice items that have been initiated.
   */
  static async getInitiatedVocabulary(userId: string): Promise<UserItemLocal[]> {
    const result = await db.user_items
      .where('[user_id+is_vocabulary+started_at]')
      .between([userId, 1, Dexie.minKey], [userId, 1, NULL_DATE], true, true)
      .filter((item) => item.deleted_at === NULL_DATE && isInitiated(item))
      .toArray();
    return result;
  }

  /** Checks availability without materializing the vocabulary list. */
  static async hasInitiatedVocabulary(userId: string): Promise<boolean> {
    const item = await db.user_items
      .where('[user_id+is_vocabulary+started_at]')
      .between([userId, 1, Dexie.minKey], [userId, 1, NULL_DATE], true, true)
      .filter((candidate) => candidate.deleted_at === NULL_DATE && isInitiated(candidate))
      .first();
    return item !== undefined;
  }

  /**
   * Calculates when the minimum review direction can be started.
   *
   * @param userId Non-empty user id whose vocabulary items should be inspected.
   * @returns The earliest date when a complete review deck will be available.
   * @throws Error when userId is empty.
   */
  static async getReadyReviewState(userId: string): Promise<ReadyPracticeState> {
    assertNonEmptyString(userId, 'userId');

    const nowIso = new Date(Date.now()).toISOString();
    const items = await db.user_items.where('user_id').equals(userId).toArray();
    const grammarItems = getItemsForBothDirections(items, 'grammar');
    const vocabularyItems = getItemsForBothDirections(items, 'vocabulary');
    const grammarReviewDueCount = getDueCount(grammarItems, nowIso);
    const vocabularyReviewDueCount = getDueCount(vocabularyItems, nowIso);
    const grammarReviewReadyAt = getReadyAt(
      grammarItems,
      config.practice.grammarReviewLimitSize,
      nowIso,
    );
    const vocabularyReviewReadyAt = getReadyAt(
      vocabularyItems,
      config.practice.vocabularyReviewLimitSize,
      nowIso,
    );
    const nextReviewAt = getEarlierDate(
      getNextReviewAtForItems(grammarItems, nowIso),
      getNextReviewAtForItems(vocabularyItems, nowIso),
    );

    return {
      grammarReviewReadyAt,
      vocabularyReviewReadyAt,
      grammarReviewDueCount,
      vocabularyReviewDueCount,
      nextReviewAt,
    };
  }

  /**
   * Resets one user item while preserving its started state.
   *
   * @param userId User id owning the item.
   * @param itemId Item id to reset.
   * @returns The reset item id.
   * @throws Error when no matching user item exists.
   */
  static async resetItemById(
    userId: string,
    itemId: number,
    dateTime: string = new Date().toISOString(),
    direction: ReviewDirection = 'cz_to_en',
  ): Promise<number> {
    const item = await db.user_items.where('[user_id+item_id]').equals([userId, itemId]).first();
    if (!item) {
      throw new Error(`No user items found for item ID ${itemId}.`);
    }
    await resetItems([item], dateTime, direction);
    return itemId;
  }

  static async resetItemsByGrammarGroupId(
    userId: string,
    grammarGroupId: number,
    direction: ReviewDirection = 'cz_to_en',
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    const groupIds = await getGroupAndDescendantIds(grammarGroupId);
    const memberships = await db.group_items.where('group_id').anyOf(groupIds).toArray();
    const itemIds = [...new Set(memberships.map((membership) => membership.item_id))];
    if (itemIds.length === 0) return 0;
    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf(itemIds.map((itemId) => [userId, itemId]))
      .toArray();
    return resetItems(
      items.filter((item) => item.deleted_at === NULL_DATE && isInitiated(item) && isReviewDirectionEnabled(item, direction)),
      dateTime,
      direction,
    );
  }

  /** Resets all user items assigned to one topic. */
  static async resetItemsByTopicId(
    userId: string,
    topicId: number,
    dateTime: string = new Date().toISOString(),
  ): Promise<number> {
    const memberships = await db.group_items.where('group_id').equals(topicId).toArray();
    const itemIds = memberships.map((membership) => membership.item_id);
    if (itemIds.length === 0) return 0;
    const items = await db.user_items
      .where('[user_id+item_id]')
      .anyOf(itemIds.map((itemId) => [userId, itemId]))
      .toArray();
    return resetItems(items, dateTime);
  }

  /**
   * Deletes all local item rows for an account being removed.
   *
   * @param userId User id whose local item rows should be deleted.
   * @returns true after IndexedDB deletion completes.
   */
  static async deleteByUserId(userId: string): Promise<boolean> {
    await db.user_items.where('user_id').equals(userId).delete();
    return true;
  }

  /** Returns vocabulary rows from the first configured lessons in curriculum order. */
  static async getSimulationCandidates(userId: string): Promise<UserItemLocal[]> {
    assertNonEmptyString(userId, 'userId');

    const [items, lessons, levels] = await Promise.all([
      db.user_items
        .where('[user_id+item_id]')
        .between([userId, Dexie.minKey], [userId, Dexie.maxKey])
        .toArray(),
      db.lessons.toArray(),
      db.levels.toArray(),
    ]);
    const availableItems = items.filter(
      (item) => item.deleted_at === NULL_DATE && item.is_vocabulary === 1,
    );
    const lessonsWithVocabulary = new Set(availableItems.map((item) => item.lesson_id));
    const levelOrder = new Map(
      levels.filter((level) => !level.deleted_at).map((level) => [level.id, level.sort_order]),
    );
    const selectedLessons = lessons
      .filter((lesson) => !lesson.deleted_at && levelOrder.has(lesson.level_id))
      .filter((lesson) => lessonsWithVocabulary.has(lesson.id))
      .sort((left, right) =>
        (levelOrder.get(left.level_id) ?? Number.MAX_SAFE_INTEGER) -
          (levelOrder.get(right.level_id) ?? Number.MAX_SAFE_INTEGER) ||
        left.sort_order - right.sort_order ||
        left.id - right.id,
      )
      .slice(0, SIM_LESSON_COUNT);
    const lessonOrder = new Map(selectedLessons.map((lesson, index) => [lesson.id, index]));

    return availableItems
      .filter((item) => lessonOrder.has(item.lesson_id))
      .sort((left, right) =>
        (lessonOrder.get(left.lesson_id) ?? Number.MAX_SAFE_INTEGER) -
          (lessonOrder.get(right.lesson_id) ?? Number.MAX_SAFE_INTEGER) ||
        left.sort_order - right.sort_order ||
        left.item_id - right.item_id,
      );
  }

  /** Replaces progress on simulation candidates with one deterministic fixture. */
  static async simulateData(items: UserItemLocal[], dateTime: string): Promise<number> {
    const simulatedItems = items.map((item) => {
      return {
        ...item,
        progress_cz_to_en: SIM_ITEM_PROGRESS,
        started_at: dateTime,
        updated_at: dateTime,
        next_at_cz_to_en: dateTime,
        mastered_at_cz_to_en: NULL_DATE,
      };
    });

    await db.user_items.bulkPut(simulatedItems);
    return simulatedItems.length;
  }

  /**
   * Pushes local item changes and applies remote item changes.
   *
   * @param userId User id whose item rows should sync.
   * @param doFullSync When true, local rows are refreshed from the epoch while preserving
   * changes made locally during the sync.
   * When false, only remote tombstones are deleted locally when the row was not changed locally.
   * @returns Number of item rows returned by the remote sync RPC.
   * @throws SupabaseError when the sync RPC fails.
   * @throws Error when sync metadata userId validation fails.
   */
  static async syncFromRemote(userId: string, doFullSync: boolean): Promise<number> {
    // Step 1: Get the last synced timestamp and establish this sync window.
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.UserItems,
      userId,
    );

    // Step 2: Capture the local snapshot before pushing and pulling remote changes.
    const localSnapshot = await this.getByUserId(userId);
    const localItemsToPush = localSnapshot.filter((item) =>
      isWithinSyncWindow(item, lastSyncedAt, newSyncedAt),
    );
    const localItems = localItemsToPush.map(convertLocalToExport);
    reportInfo(`Completed ${localItems.length} UserItems push to remote`);

    const updatedItems = await this.syncWithRemote(userId, localItems, lastSyncedAt, newSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(updatedItems);

    // Step 4: Merge only into rows that did not change after the snapshot.
    let preservedConcurrentChanges = false;
    await db.transaction('rw', db.user_items, db.metadata, async () => {
      const currentItems = await this.getByUserId(userId);
      const snapshotByKey = new Map(localSnapshot.map((item) => [getUserItemKey(item), item]));
      const concurrentKeys = new Set(
        currentItems
          .filter((item) => hasChangedSinceSnapshot(item, snapshotByKey))
          .map(getUserItemKey),
      );
      preservedConcurrentChanges = concurrentKeys.size > 0;

      if (doFullSync) {
        const keysToDelete = currentItems
          .filter((item) => !concurrentKeys.has(getUserItemKey(item)))
          .map((item) => [item.user_id, item.item_id] as [string, number]);
        if (keysToDelete.length > 0) await db.user_items.bulkDelete(keysToDelete);
      } else if (toDelete.length > 0) {
        const keysToDelete = toDelete
          .filter((item) => !concurrentKeys.has(getUserItemKey(item)))
          .map((item) => [item.user_id, item.item_id] as [string, number]);
        if (keysToDelete.length > 0) await db.user_items.bulkDelete(keysToDelete);
      }
      const rowsToUpsert = toUpsert.filter((item) => !concurrentKeys.has(getUserItemKey(item)));
      if (rowsToUpsert.length > 0) {
        await db.user_items.bulkPut(rowsToUpsert);
      }
      if (!preservedConcurrentChanges) {
        await Metadata.markAsSynced(TableName.UserItems, newSyncedAt, userId);
      }
    });

    if (preservedConcurrentChanges) {
      reportInfo('Preserved local UserItems changes made during synchronization.');
    }

    return updatedItems.length;
  }

  /**
   * Calls the Supabase item sync RPC.
   *
   * @param userId User id passed to the RPC.
   * @param items Local item rows to upsert remotely before fetching remote changes.
   * @param lastSyncedAt Exclusive remote change lower bound.
   * @returns Remote item rows converted to local shape, or [] when none are returned.
   * @throws SupabaseError when the RPC fails.
   */
  private static async syncWithRemote(
    userId: string,
    items: UserItemExport[],
    lastSyncedAt: string,
    newSyncedAt: string,
  ): Promise<UserItemLocal[]> {
    const { data: updatedUserItems, error: rpcFetchError } = await supabaseInstance.rpc(
      'upsert_fetch_user_items',
      {
        p_user_id: userId,
        p_last_synced_at: lastSyncedAt,
        p_sync_until: newSyncedAt,
        p_user_items: items,
      },
    );

    if (rpcFetchError) {
      throw new SupabaseError('Error fetching user_items with Supabase.', rpcFetchError, {
        itemCount: items.length,
        lastSyncedAt,
        newSyncedAt,
      });
    }

    if (!updatedUserItems || updatedUserItems.length === 0) return [];
    return updatedUserItems.map(convertAPIToLocal);
  }

  /** Reads due, unmastered CZ-to-EN practice items. */
  private static getDuePracticeItems(
    userId: string,
    limit: number,
    now: string,
    reviewKind: ReviewKind,
    direction: ReviewDirection,
  ): Promise<PracticeDeckItem[]> {
    return this.getDuePracticeCollection(userId, now, reviewKind, direction).limit(limit).toArray();
  }

  private static getDuePracticeCollection(userId: string, now: string, reviewKind: ReviewKind, direction: ReviewDirection) {
    const matchesItem = (item: UserItemLocal) => {
      return isReviewItemCandidate(item, reviewKind, direction) && isReviewItemDue(item, now, direction);
    };

    return db.user_items
      .where(getPracticeIndex(direction))
      .between(
        [userId, Dexie.minKey, Dexie.minKey, Dexie.minKey],
        [userId, Dexie.maxKey, Dexie.maxKey, Dexie.maxKey],
        true,
        true,
      )
      .filter(matchesItem);
  }

  /** Applies one CZ-to-EN practice outcome. */
  static applyPracticeProgress(
    item: UserItemLocal,
    outcome: PracticeOutcome,
    dateTime: string,
    options: {
      initialTraining?: boolean;
      direction?: ReviewDirection;
    } = {},
  ): UserItemLocal {
    if (options.initialTraining === true) {
      return applyInitialTrainingProgress(item, outcome, dateTime);
    }
    return applyReviewProgress(item, outcome, dateTime, options.direction ?? 'cz_to_en');
  }

  /** Persists the mirrored progress produced by one answer in initial training. */
  static async saveInitialTrainingProgress(item: UserItemLocal): Promise<void> {
    await db.transaction('rw', db.user_items, async () => {
      const updatedCount = await db.user_items.update([item.user_id, item.item_id], {
        progress_cz_to_en: item.progress_cz_to_en,
        next_at_cz_to_en: item.next_at_cz_to_en,
        mastered_at_cz_to_en: item.mastered_at_cz_to_en,
        progress_en_to_cz: item.progress_en_to_cz,
        next_at_en_to_cz: item.next_at_en_to_cz,
        mastered_at_en_to_cz: item.mastered_at_en_to_cz,
        started_at: item.started_at,
        updated_at: item.updated_at,
      });
      if (updatedCount !== 1) throw new Error('The trained item no longer exists locally.');
    });
  }
}

function isReviewDirectionEnabled(item: UserItemLocal, direction: ReviewDirection): boolean {
  if (direction === 'cz_to_en') return item.is_cz_to_en_enabled;
  return item.is_en_to_cz_enabled;
}

function getEarlierDate(left: string | null, right: string | null): string | null {
  if (left === null) return right;
  if (right === null) return left;
  return left < right ? left : right;
}

function getPracticeIndex(direction: ReviewDirection): string {
  if (direction === 'en_to_cz') {
    return '[user_id+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]';
  }
  return '[user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]';
}

function getItemsForBothDirections(items: UserItemLocal[], reviewKind: ReviewKind): UserItemLocal[] {
  const matchingItems = items.filter((item) => isReviewKind(item, reviewKind));
  return matchingItems.flatMap((item) => [
    { ...item, review_direction: 'cz_to_en' as const },
    { ...item, review_direction: 'en_to_cz' as const },
  ]).filter((item) => isReviewItemCandidate(item, reviewKind, item.review_direction));
}

function getDueCount(items: UserItemLocal[], nowIso: string): number {
  return items.filter((item) => isReviewItemReadyAt(item, nowIso, item.review_direction)).length;
}

function getReadyAt(items: UserItemLocal[], deckSize: number, nowIso: string): string | null {
  const dueItems = items.filter((item) => isReviewItemReadyAt(item, nowIso, item.review_direction));
  if (dueItems.length >= deckSize) return nowIso;
  const futureItems = items
    .filter((item) => isReviewItemFuture(item, nowIso, item.review_direction))
    .sort((left, right) => (getDirectionalNextAt(left) ?? '').localeCompare(getDirectionalNextAt(right) ?? ''));
  return getDirectionalNextAt(futureItems[deckSize - dueItems.length - 1] ?? null);
}

function getNextReviewAtForItems(items: UserItemLocal[], nowIso: string): string | null {
  const nextItem = items
    .filter((item) => isReviewItemFuture(item, nowIso, item.review_direction))
    .sort((left, right) => (getDirectionalNextAt(left) ?? '').localeCompare(getDirectionalNextAt(right) ?? ''))[0];
  return getDirectionalNextAt(nextItem ?? null);
}

function getDirectionalNextAt(item: UserItemLocal | null): string | null {
  if (!item) return null;
  if (item.review_direction === 'en_to_cz') return item.next_at_en_to_cz;
  return item.next_at_cz_to_en;
}

function isInitialTrainingSkipped(
  item: Pick<UserItemLocal, 'started_at' | 'mastered_at_cz_to_en'>,
): boolean {
  return item.started_at === NULL_DATE && (item.mastered_at_cz_to_en ?? NULL_DATE) !== NULL_DATE;
}

function applyInitialTrainingProgress(
  item: UserItemLocal,
  outcome: PracticeOutcome,
  dateTime: string,
): UserItemLocal {
  const changes: Partial<UserItemLocal> = {
    ...item,
    started_at: getStartedAt(item, dateTime),
    updated_at: dateTime,
  };

  if (outcome === 'correct') {
    initializeProgress(changes);
  } else if (outcome === 'skip') {
    setMastered(changes, dateTime);
  } else {
    initializeProgress(changes);
  }

  changes.progress_en_to_cz = changes.progress_cz_to_en;
  changes.next_at_en_to_cz = changes.next_at_cz_to_en;
  changes.mastered_at_en_to_cz = changes.mastered_at_cz_to_en;

  return { ...item, ...changes };
}

function applyReviewProgress(
  item: UserItemLocal,
  outcome: PracticeOutcome,
  dateTime: string,
  direction: ReviewDirection = 'cz_to_en',
): UserItemLocal {
  const currentProgress = direction === 'cz_to_en' ? item.progress_cz_to_en : item.progress_en_to_cz;
  const changes: Partial<UserItemLocal> = {
    ...item,
    started_at: getStartedAt(item, dateTime),
    updated_at: dateTime,
  };

  if (outcome === 'skip') {
    setMastered(changes, dateTime, currentProgress, direction);
  } else {
    const progressDelta = getReviewProgressDelta(outcome);
    setProgress(changes, item, Math.max(0, currentProgress + progressDelta), dateTime, direction);
  }

  return { ...item, ...changes };
}

function getReviewProgressDelta(outcome: PracticeOutcome): number {
  if (outcome === 'repeat' || outcome === 'incorrect') return config.srs.ratingProgressDelta.repeat;
  if (outcome === 'hard') return config.srs.ratingProgressDelta.hard;
  if (outcome === 'easy') return config.srs.ratingProgressDelta.easy;
  return config.srs.ratingProgressDelta.good;
}

function getStartedAt(item: UserItemLocal, dateTime: string): string {
  if (item.started_at === NULL_DATE) return dateTime;
  return item.started_at;
}

function setProgress(
  target: Partial<UserItemLocal>,
  original: UserItemLocal,
  progress: number,
  dateTime: string,
  direction: ReviewDirection = 'cz_to_en',
): void {
  const currentMasteredAt = direction === 'cz_to_en' ? original.mastered_at_cz_to_en : original.mastered_at_en_to_cz;
  const masteredAt = resolveMasteredAt(progress, currentMasteredAt, dateTime);

  if (direction === 'cz_to_en') {
    target.progress_cz_to_en = progress;
    target.next_at_cz_to_en = getNextAtForMastery(getNextAt(progress), masteredAt);
    target.mastered_at_cz_to_en = masteredAt;
    return;
  }
  target.progress_en_to_cz = progress;
  target.next_at_en_to_cz = getNextAtForMastery(getNextAt(progress), masteredAt);
  target.mastered_at_en_to_cz = masteredAt;
}

function initializeProgress(target: Partial<UserItemLocal>): void {
  target.progress_cz_to_en = 0;
  target.next_at_cz_to_en = getNextAt(0);
  target.mastered_at_cz_to_en = NULL_DATE;
}

function setMastered(target: Partial<UserItemLocal>, dateTime: string, progress: number = 0, direction: ReviewDirection = 'cz_to_en'): void {
  if (direction === 'cz_to_en') {
    target.progress_cz_to_en = progress;
    target.next_at_cz_to_en = NULL_DATE;
    target.mastered_at_cz_to_en = dateTime;
    return;
  }
  target.progress_en_to_cz = progress;
  target.next_at_en_to_cz = NULL_DATE;
  target.mastered_at_en_to_cz = dateTime;
}

function getNextAtForMastery(nextAt: string, masteredAt: string): string {
  if (masteredAt !== NULL_DATE) return NULL_DATE;
  return nextAt;
}

function resolveMasteredAt(progress: number, currentMasteredAt: string, dateTime: string): string {
  if (progress < config.srs.intervals.length) return currentMasteredAt;
  if (currentMasteredAt !== NULL_DATE) return currentMasteredAt;
  return dateTime;
}

async function getGroupAndDescendantIds(groupId: number): Promise<number[]> {
  const relations = await db.group_relations
    .filter((relation) => relation.relation_type !== 'contrast' && !relation.deleted_at)
    .toArray();
  const childIdsByParent = new Map<number, number[]>();
  for (const relation of relations) {
    const children = childIdsByParent.get(relation.parent_group_id) ?? [];
    children.push(relation.child_group_id);
    childIdsByParent.set(relation.parent_group_id, children);
  }

  const visited = new Set<number>();
  const pending = [groupId];
  while (pending.length > 0) {
    const currentId = pending.pop();
    if (currentId == null || visited.has(currentId)) continue;
    visited.add(currentId);
    pending.push(...(childIdsByParent.get(currentId) ?? []));
  }
  return [...visited];
}

function isReviewKind(item: Pick<UserItemLocal, 'is_vocabulary'>, reviewKind: ReviewKind): boolean {
  if (reviewKind === 'vocabulary') return item.is_vocabulary === 1;
  return item.is_vocabulary === 0;
}

function compareCurriculumPaths(left: CurriculumSortPath, right: CurriculumSortPath): number {
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

async function resetItems(items: UserItemLocal[], dateTime: string, direction: ReviewDirection = 'cz_to_en'): Promise<number> {
  if (items.length === 0) return 0;

  return await db.transaction('rw', db.user_items, async () => {
    const updatedItems = items.map((item) => {
      const updatedItem = { ...item };
      resetUserItem(updatedItem, dateTime, direction);
      return updatedItem;
    });
    await db.user_items.bulkPut(updatedItems);
    return updatedItems.length;
  });
}
