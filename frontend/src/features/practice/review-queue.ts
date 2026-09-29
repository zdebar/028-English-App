import { isReviewItemDue } from '@/database/utils/review-items.utils';
import config from '@/config/config';
import type { PracticeDeckEntry, UserItemLocal } from '@/types/user-item.types';

const NULL_DATE = config.database.nullReplacementDate;

export type ReviewQueue = {
  entries: PracticeDeckEntry[];
  orderedIndexes: number[];
  activeIndex: number;
  validEndIndex: number;
  activeItemCount: number;
  completedCount: number;
};

export type ReviewQueueAnswerResult = Readonly<{
  answeredEntry: PracticeDeckEntry;
  hasNextItem: boolean;
}>;

export function createReviewQueue(entries: readonly PracticeDeckEntry[]): ReviewQueue {
  const queue: ReviewQueue = {
    entries: [...entries],
    orderedIndexes: entries.map((_entry, index) => index),
    activeIndex: 0,
    validEndIndex: 0,
    activeItemCount: 0,
    completedCount: 0,
  };
  queue.orderedIndexes.sort((left, right) =>
    compareEntries(queue.entries[left]!, queue.entries[right]!),
  );
  extendValidStretch(queue);
  return queue;
}

export function getCurrentReviewEntry(queue: ReviewQueue | null): PracticeDeckEntry | null {
  if (!queue || queue.activeIndex >= queue.validEndIndex) return null;
  const entryIndex = queue.orderedIndexes[queue.activeIndex];
  return entryIndex === undefined ? null : queue.entries[entryIndex] ?? null;
}

export function answerCurrentReviewItem(
  queue: ReviewQueue,
  updatedItem: UserItemLocal,
): ReviewQueueAnswerResult | null {
  const currentEntry = getCurrentReviewEntry(queue);
  if (!currentEntry) return null;

  queue.completedCount += 1;
  queue.activeIndex += 1;

  if (updatedItem.mastered_at_cz_to_en === NULL_DATE) {
    appendUpdatedEntry(queue, currentEntry, updatedItem);
  }

  extendValidStretch(queue);
  return {
    answeredEntry: currentEntry,
    hasNextItem: getCurrentReviewEntry(queue) !== null,
  };
}

export function extendReviewQueue(queue: ReviewQueue): void {
  extendValidStretch(queue);
}

export function getRemainingReviewEntries(queue: ReviewQueue): PracticeDeckEntry[] {
  return queue.orderedIndexes
    .slice(queue.activeIndex)
    .map((entryIndex) => queue.entries[entryIndex])
    .filter((entry): entry is PracticeDeckEntry => entry !== undefined);
}

function appendUpdatedEntry(
  queue: ReviewQueue,
  previousEntry: PracticeDeckEntry,
  updatedItem: UserItemLocal,
): void {
  const newEntryIndex = queue.entries.push({
    item: updatedItem,
    note: previousEntry.note,
    grammar: previousEntry.grammar,
  }) - 1;
  const insertionIndex = findInsertionIndex(queue, newEntryIndex);
  queue.orderedIndexes.splice(insertionIndex, 0, newEntryIndex);

  if (insertionIndex <= queue.validEndIndex && isReviewItemDue(updatedItem, new Date().toISOString())) {
    queue.validEndIndex += 1;
    queue.activeItemCount += 1;
  }
}

function findInsertionIndex(queue: ReviewQueue, entryIndex: number): number {
  const startIndex = queue.activeIndex;
  for (let index = queue.orderedIndexes.length - 1; index >= startIndex; index -= 1) {
    const existingIndex = queue.orderedIndexes[index];
    if (existingIndex === undefined) continue;
    if (compareEntries(queue.entries[existingIndex]!, queue.entries[entryIndex]!) <= 0) {
      return index + 1;
    }
  }
  return startIndex;
}

function extendValidStretch(queue: ReviewQueue): void {
  const nowIso = new Date().toISOString();
  while (queue.validEndIndex < queue.orderedIndexes.length) {
    const entryIndex = queue.orderedIndexes[queue.validEndIndex];
    const entry = entryIndex === undefined ? undefined : queue.entries[entryIndex];
    if (!entry || !isReviewItemDue(entry.item, nowIso)) break;
    queue.validEndIndex += 1;
    queue.activeItemCount += 1;
  }
}

function compareEntries(left: PracticeDeckEntry, right: PracticeDeckEntry): number {
  const leftCategory = getEntryCategory(left);
  const rightCategory = getEntryCategory(right);
  if (leftCategory !== rightCategory) return leftCategory - rightCategory;

  if (leftCategory === 1) {
    return compareCurriculumPaths(left.item.curriculum_sort_path, right.item.curriculum_sort_path);
  }

  const nextAtComparison = left.item.next_at_cz_to_en.localeCompare(right.item.next_at_cz_to_en);
  if (nextAtComparison !== 0) return nextAtComparison;

  const pathComparison = compareCurriculumPaths(
    left.item.curriculum_sort_path,
    right.item.curriculum_sort_path,
  );
  if (pathComparison !== 0) return pathComparison;
  return left.item.item_id - right.item.item_id;
}

function getEntryCategory(entry: PracticeDeckEntry): number {
  if (entry.item.next_at_cz_to_en === NULL_DATE) return 1;
  return entry.item.next_at_cz_to_en < new Date().toISOString() ? 0 : 2;
}

function compareCurriculumPaths(
  left: readonly number[],
  right: readonly number[],
): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}
