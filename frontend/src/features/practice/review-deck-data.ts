import { db } from '@/database/models/db';
import UserItem from '@/database/models/user-items';
import { isReviewItemDue } from '@/database/practice/review-items';
import { reportError } from '@/features/logging/logging-handler';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import type { PracticeDeckEntry, UserItemLocal } from '@/types/user-item.types';
import { toError } from '@/utils/error.utils';
import { getPrefetchedReviewItems } from './review-prefetch';

export type ReviewDeckData = Readonly<{
  entries: PracticeDeckEntry[];
  prefetchedEntries?: PracticeDeckEntry[];
  availabilityCheckedAt: string;
  abandoned: boolean;
  reviewKind: ReviewKind;
  reviewDirection: ReviewDirection;
  availableCount?: number;
}>;

/** Loads the next review batch without creating a review session. */
export async function loadReviewDeckData(
  userId: string,
  reviewKind: ReviewKind,
  reviewDirection?: ReviewDirection,
): Promise<ReviewDeckData> {
  const now = new Date().toISOString();
  const allowDirectionFallback = reviewDirection === undefined;
  let selectedDirection = reviewDirection ?? 'cz_to_en';
  let prefetchedItems: readonly UserItemLocal[];
  let otherDirectionItems: readonly UserItemLocal[];

  try {
    [prefetchedItems, otherDirectionItems] = await Promise.all([
      getPrefetchedReviewItems(userId, reviewKind, selectedDirection),
      getPrefetchedReviewItems(userId, reviewKind, getOtherReviewDirection(selectedDirection)),
    ]);
  } catch (error) {
    reportError(
      'Failed to load the prefetched review deck; using database fallback',
      toError(error),
    );
    const [czToEnItems, enToCzItems] = await db.transaction('r', db.user_items, () => Promise.all([
      UserItem.getReviewDeck(userId, reviewKind, now, 'cz_to_en'),
      UserItem.getReviewDeck(userId, reviewKind, now, 'en_to_cz'),
    ]));
    let items = selectedDirection === 'cz_to_en' ? czToEnItems : enToCzItems;
    if (allowDirectionFallback && selectedDirection === 'cz_to_en' && czToEnItems.length === 0) {
      selectedDirection = 'en_to_cz';
      items = enToCzItems;
    }
    const entries = items.map((item) => toPracticeDeckEntry({ ...item, review_direction: selectedDirection }));
    return {
      entries,
      prefetchedEntries: entries,
      availabilityCheckedAt: now,
      abandoned: entries.length === 0,
      reviewKind,
      reviewDirection: selectedDirection,
      availableCount: czToEnItems.length + enToCzItems.length,
    };
  }

  let entries = prefetchedItems.filter((item) => isReviewItemDue(item, now, selectedDirection));
  if (entries.length === 0 && allowDirectionFallback && selectedDirection === 'cz_to_en') {
    selectedDirection = 'en_to_cz';
    [prefetchedItems, otherDirectionItems] = [otherDirectionItems, prefetchedItems];
    entries = prefetchedItems.filter((item) => isReviewItemDue(item, now, selectedDirection));
  }
  return {
    entries: entries.map(toPracticeDeckEntry),
    prefetchedEntries: prefetchedItems.map(toPracticeDeckEntry),
    availabilityCheckedAt: now,
    abandoned: entries.length === 0,
    reviewKind,
    reviewDirection: selectedDirection,
    availableCount: countDueItems(prefetchedItems, otherDirectionItems, now),
  };
}

function getOtherReviewDirection(direction: ReviewDirection): ReviewDirection {
  return direction === 'cz_to_en' ? 'en_to_cz' : 'cz_to_en';
}

function countDueItems(
  first: readonly UserItemLocal[],
  second: readonly UserItemLocal[],
  now: string,
): number {
  return first.filter((item) => isReviewItemDue(item, now, item.review_direction)).length +
    second.filter((item) => isReviewItemDue(item, now, item.review_direction)).length;
}

function toPracticeDeckEntry(item: UserItemLocal): PracticeDeckEntry {
  return { item, note: null, grammar: null };
}
