import config from '@/config/config';
import Groups from './groups';
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
import Dexie, { Entity } from 'dexie';

import { resetUserItem } from '@/database/utils/user-items.utils';
import { isReviewItemCandidate, isReviewItemDue } from '@/database/utils/review-items.utils';
import {
  applyPracticeProgress as applyUserItemPracticeProgress,
  compareCurriculumPaths,
  getDueCount,
  getEarlierDate,
  getItemsForBothDirections,
  getNextReviewAtForItems,
  getPracticeIndex,
  getReadyAt,
  isInitialTrainingSkipped,
  isReviewDirectionEnabled,
} from '@/database/utils/user-item-practice.utils';
import type { ReadyPracticeState } from '@/types/generic.types';
import { syncUserItemsFromRemote } from '@/database/utils/sync-user-items';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { isInitiated } from '@/utils/progress.utils';

const NULL_DATE = config.database.nullReplacementDate;
const SIM_LESSON_COUNT = config.progress.simulationLessonCount;
const SIM_ITEM_PROGRESS = config.progress.simulationItemProgress;

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

  /** Pushes local progress and merges remote item updates. */
  static syncFromRemote(userId: string, doFullSync: boolean): Promise<number> {
    return syncUserItemsFromRemote(userId, doFullSync);
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
    return applyUserItemPracticeProgress(item, outcome, dateTime, options);
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
