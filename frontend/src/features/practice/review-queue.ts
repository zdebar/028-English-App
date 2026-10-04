import { isReviewItemCandidate, isReviewItemDue } from '@/database/utils/review-items.utils';
import type { ReviewKind } from '@/types/practice.types';
import type { PracticeDeckEntry, UserItemLocal } from '@/types/user-item.types';
import { compareReviewItems } from './review-prefetch';

export type ReviewQueue = {
  items: PracticeDeckEntry[];
  reviewKind: ReviewKind;
  dueCount: number;
  sessionTotalCount: number;
  completedCount: number;
};

export type ReviewQueueAnswerResult = Readonly<{
  answeredEntry: PracticeDeckEntry;
  hasNextItem: boolean;
}>;

export function createReviewQueue(
  entries: readonly PracticeDeckEntry[],
  reviewKind: ReviewKind,
): ReviewQueue {
  const queue: ReviewQueue = {
    items: uniqueEntries(entries).sort(compareEntries),
    reviewKind,
    dueCount: 0,
    sessionTotalCount: 0,
    completedCount: 0,
  };
  extendValidStretch(queue);
  return queue;
}

export function getCurrentReviewEntry(queue: ReviewQueue | null): PracticeDeckEntry | null {
  if (!queue || queue.dueCount === 0) return null;
  return queue.items[0] ?? null;
}

export function answerCurrentReviewItem(
  queue: ReviewQueue,
  updatedItem: UserItemLocal,
): ReviewQueueAnswerResult | null {
  const currentEntry = getCurrentReviewEntry(queue);
  if (!currentEntry) return null;

  queue.items.shift();
  queue.dueCount = Math.max(0, queue.dueCount - 1);
  queue.completedCount += 1;

  if (isReviewItemCandidate(updatedItem, queue.reviewKind)) {
    const updatedEntry: PracticeDeckEntry = {
      item: updatedItem,
      note: currentEntry.note,
      grammar: currentEntry.grammar,
    };
    const insertionIndex = findInsertionIndex(queue.items, updatedEntry);
    queue.items.splice(insertionIndex, 0, updatedEntry);

    if (isReviewItemDue(updatedItem, new Date().toISOString())) {
      queue.dueCount += 1;
      queue.sessionTotalCount += 1;
    }
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
  return [...queue.items];
}

function findInsertionIndex(
  entries: readonly PracticeDeckEntry[],
  entry: PracticeDeckEntry,
): number {
  let low = 0;
  let high = entries.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const middleEntry = entries[middle];
    if (!middleEntry || compareEntries(middleEntry, entry) <= 0) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

function extendValidStretch(queue: ReviewQueue): void {
  const nowIso = new Date().toISOString();
  while (queue.dueCount < queue.items.length) {
    const entry = queue.items[queue.dueCount];
    if (!entry || !isReviewItemDue(entry.item, nowIso)) break;
    queue.dueCount += 1;
    queue.sessionTotalCount += 1;
  }
}

function compareEntries(left: PracticeDeckEntry, right: PracticeDeckEntry): number {
  return compareReviewItems(left.item, right.item);
}

function uniqueEntries(entries: readonly PracticeDeckEntry[]): PracticeDeckEntry[] {
  const entriesById = new Map<number, PracticeDeckEntry>();
  for (const entry of entries) {
    entriesById.set(entry.item.item_id, entry);
  }
  return [...entriesById.values()];
}
