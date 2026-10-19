import UserItem from '@/database/models/user-items';
import {
  isReviewItemCandidate,
  isReviewItemFuture,
  isReviewItemReadyAt,
} from '@/database/utils/review-items.utils';
import config from '@/config/config';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import type { PracticeDeckItem } from '@/types/user-item.types';

const REVIEW_KINDS: readonly ReviewKind[] = ['grammar', 'vocabulary'];
const REVIEW_DIRECTIONS: readonly ReviewDirection[] = ['cz_to_en', 'en_to_cz'];
const NULL_DATE = config.database.nullReplacementDate;
const RESET_SORT_DATE = '0000-01-01T00:00:00.000Z';

export type ReviewArrays = Readonly<Record<ReviewKind, readonly PracticeDeckItem[]>>;

export type ReviewAvailability = Readonly<{
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  grammarReviewDueCount: number;
  vocabularyReviewDueCount: number;
  nextReviewAt: string | null;
}>;

type MutableReviewArrays = Record<ReviewKind, PracticeDeckItem[]>;

type ReviewPrefetchState = {
  arrays: MutableReviewArrays | null;
  dirty: boolean;
  version: number;
  pending: Promise<void> | null;
};

const states = new Map<string, ReviewPrefetchState>();

function createState(): ReviewPrefetchState {
  return { arrays: null, dirty: true, version: 0, pending: null };
}

function getState(userId: string): ReviewPrefetchState {
  let state = states.get(userId);
  if (!state) {
    state = createState();
    states.set(userId, state);
  }
  return state;
}

/** Loads both review directions once and shares the in-flight work. */
export function warmReviewArrays(userId: string): Promise<void> {
  const state = getState(userId);
  if (state.pending) return state.pending;
  if (state.arrays && !state.dirty) return Promise.resolve();

  const version = state.version;
  let pending: Promise<void>;
  pending = Promise.all(
    REVIEW_KINDS.flatMap((reviewKind) => REVIEW_DIRECTIONS.map(async (direction) => [
      reviewKind,
      direction,
      (await UserItem.getAllReviewItems(userId, reviewKind, direction)).map((item) => ({ ...item, review_direction: direction })),
    ] as const)),
  )
    .then((results) => {
      if (states.get(userId) !== state || state.version !== version) return;
      const grammar = sortReviewItems(results.filter(([kind]) => kind === 'grammar').flatMap(([, , items]) => items));
      const vocabulary = sortReviewItems(results.filter(([kind]) => kind === 'vocabulary').flatMap(([, , items]) => items));
      state.arrays = { grammar, vocabulary };
      state.dirty = false;
    })
    .finally(() => {
      if (state.pending === pending) state.pending = null;
    })
    .then(() => {
      if (states.get(userId) !== state) return;
      if (state.dirty) return warmReviewArrays(userId);
    });

  state.pending = pending;
  return pending;
}

export function invalidateReviewArrays(userId: string): void {
  const state = states.get(userId);
  if (!state) return;
  state.version += 1;
  state.dirty = true;
}

/** Applies one or more successfully persisted items to the in-memory review arrays. */
export async function syncReviewItemsToCache(
  userId: string,
  items: readonly PracticeDeckItem[],
): Promise<void> {
  if (items.length === 0) return;
  await warmReviewArrays(userId);

  const state = getState(userId);
  if (!state.arrays) return;

  const itemsById = new Map(items.map((item) => [item.item_id, item]));
  const updatedItems = [...itemsById.values()];
  const updatedItemIds = new Set(itemsById.keys());
  const nextArrays = {} as MutableReviewArrays;

  for (const reviewKind of REVIEW_KINDS) {
    const remainingItems = state.arrays[reviewKind].filter(
      (item) => !updatedItemIds.has(item.item_id),
    );
    const matchingItems = updatedItems.flatMap((item) => REVIEW_DIRECTIONS
      .filter((direction) => isReviewItemCandidate(item, reviewKind, direction))
      .map((direction) => ({ ...item, review_direction: direction })));
    nextArrays[reviewKind] = sortReviewItems([...remainingItems, ...matchingItems]);
  }

  state.version += 1;
  state.arrays = nextArrays;
  state.dirty = false;
}

export async function syncReviewItemToCache(
  userId: string,
  item: PracticeDeckItem,
): Promise<void> {
  return syncReviewItemsToCache(userId, [item]);
}

export function rebuildReviewArrays(userId: string): Promise<void> {
  invalidateReviewArrays(userId);
  return warmReviewArrays(userId);
}

export function clearReviewArrays(userId: string | null): void {
  if (userId) states.delete(userId);
  else states.clear();
}

export async function getPrefetchedReviewItems(
  userId: string,
  reviewKind: ReviewKind,
  direction?: ReviewDirection,
): Promise<readonly PracticeDeckItem[]> {
  await warmReviewArrays(userId);
  const items = getState(userId).arrays?.[reviewKind] ?? [];
  const selectedDirection = direction ?? 'cz_to_en';
  return items.filter((item) => item.review_direction === selectedDirection);
}

export function compareReviewItems(left: PracticeDeckItem, right: PracticeDeckItem): number {
  const nextAtComparison = getReviewSortDate(left).localeCompare(getReviewSortDate(right));
  if (nextAtComparison !== 0) return nextAtComparison;

  const pathComparison = compareCurriculumPaths(
    left.curriculum_sort_path,
    right.curriculum_sort_path,
  );
  if (pathComparison !== 0) return pathComparison;
  return left.item_id - right.item_id;
}

export function getReviewReadyAtFromItems(
  items: readonly PracticeDeckItem[],
  deckSize: number,
  nowIso: string,
): string | null {
  const readyCount = getReviewDueCount(items, nowIso);
  if (readyCount >= deckSize) return nowIso;

  const missingCount = deckSize - readyCount;
  const futureItems = items.filter((item) => isReviewItemFuture(item, nowIso, item.review_direction));
  return getReviewNextAt(futureItems[missingCount - 1] ?? null);
}

export function getReviewAvailabilityFromArrays(
  arrays: ReviewArrays,
  nowIso: string,
): ReviewAvailability {
  const grammarReviewDueCount = getReviewDueCount(arrays.grammar, nowIso);
  const vocabularyReviewDueCount = getReviewDueCount(arrays.vocabulary, nowIso);
  const nextReviewAt = getEarlierReviewAt(
    getNextReviewAtFromItems(arrays.grammar, nowIso),
    getNextReviewAtFromItems(arrays.vocabulary, nowIso),
  );

  return {
    grammarReviewReadyAt: getReviewReadyAtFromItems(
      arrays.grammar,
      config.practice.grammarReviewLimitSize,
      nowIso,
    ),
    vocabularyReviewReadyAt: getReviewReadyAtFromItems(
      arrays.vocabulary,
      config.practice.vocabularyReviewLimitSize,
      nowIso,
    ),
    grammarReviewDueCount,
    vocabularyReviewDueCount,
    nextReviewAt,
  };
}

export async function loadReviewAvailabilityFromArrays(
  userId: string,
): Promise<ReviewAvailability> {
  await warmReviewArrays(userId);
  const arrays = getState(userId).arrays;
  if (!arrays) throw new Error('Review arrays are unavailable');
  return getReviewAvailabilityFromArrays(arrays, new Date().toISOString());
}

function getReviewDueCount(items: readonly PracticeDeckItem[], nowIso: string): number {
  return items.filter((item) => isReviewItemReadyAt(item, nowIso, item.review_direction)).length;
}

function getNextReviewAtFromItems(
  items: readonly PracticeDeckItem[],
  nowIso: string,
): string | null {
  return getReviewNextAt(items.find((item) => isReviewItemFuture(item, nowIso, item.review_direction)) ?? null);
}

function getEarlierReviewAt(
  left: string | null,
  right: string | null,
): string | null {
  if (left === null) return right;
  if (right === null) return left;
  return left < right ? left : right;
}

function sortReviewItems(items: readonly PracticeDeckItem[]): PracticeDeckItem[] {
  return [...items].sort(compareReviewItems);
}

function getReviewSortDate(item: PracticeDeckItem): string {
  const nextAt = item.review_direction === 'en_to_cz'
    ? item.next_at_en_to_cz ?? item.next_at_cz_to_en
    : item.next_at_cz_to_en;
  if (nextAt === NULL_DATE) return RESET_SORT_DATE;
  return nextAt;
}

function getReviewNextAt(item: PracticeDeckItem | null): string | null {
  if (!item) return null;
  if (item.review_direction === 'en_to_cz') return item.next_at_en_to_cz ?? item.next_at_cz_to_en;
  return item.next_at_cz_to_en;
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
