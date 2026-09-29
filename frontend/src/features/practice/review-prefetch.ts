import UserItem from '@/database/models/user-items';
import {
  isReviewItemFuture,
  isReviewItemReadyAt,
} from '@/database/utils/review-items.utils';
import config from '@/config/config';
import type { ReviewKind } from '@/types/practice.types';
import type { PracticeDeckItem } from '@/types/user-item.types';

const REVIEW_KINDS: readonly ReviewKind[] = ['grammar', 'vocabulary'];

type ReviewArrays = Readonly<Record<ReviewKind, readonly PracticeDeckItem[]>>;

type ReviewPrefetchState = {
  arrays: ReviewArrays | null;
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
    REVIEW_KINDS.map(async (reviewKind) => [
      reviewKind,
      await UserItem.getAllReviewItems(userId, reviewKind),
    ] as const),
  )
    .then((results) => {
      if (states.get(userId) !== state || state.version !== version) return;
      const grammar = results.find(([reviewKind]) => reviewKind === 'grammar')?.[1] ?? [];
      const vocabulary = results.find(([reviewKind]) => reviewKind === 'vocabulary')?.[1] ?? [];
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

export function publishReviewItems(
  userId: string,
  reviewKind: ReviewKind,
  items: readonly PracticeDeckItem[],
): void {
  const state = getState(userId);
  if (!state.arrays) return;
  state.version += 1;
  state.arrays = { ...state.arrays, [reviewKind]: [...items] };
  state.dirty = false;
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
): Promise<readonly PracticeDeckItem[]> {
  await warmReviewArrays(userId);
  return getState(userId).arrays?.[reviewKind] ?? [];
}

export function getReviewReadyAtFromItems(
  items: readonly PracticeDeckItem[],
  deckSize: number,
  nowIso: string,
): string | null {
  const readyCount = items.filter((item) => isReviewItemReadyAt(item, nowIso)).length;
  if (readyCount >= deckSize) return nowIso;

  const missingCount = deckSize - readyCount;
  const futureItems = items.filter((item) => isReviewItemFuture(item, nowIso));
  return futureItems[missingCount - 1]?.next_at_cz_to_en ?? null;
}

export function getReviewAvailabilityFromArrays(
  arrays: ReviewArrays,
  nowIso: string,
): Readonly<{
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
}> {
  return {
    grammarReviewReadyAt: getReviewReadyAtFromItems(
      arrays.grammar,
      config.practice.grammarReviewMinimumSize,
      nowIso,
    ),
    vocabularyReviewReadyAt: getReviewReadyAtFromItems(
      arrays.vocabulary,
      config.practice.vocabularyReviewMinimumSize,
      nowIso,
    ),
  };
}

export async function loadReviewAvailabilityFromArrays(userId: string) {
  await warmReviewArrays(userId);
  const arrays = getState(userId).arrays;
  if (!arrays) throw new Error('Review arrays are unavailable');
  return getReviewAvailabilityFromArrays(arrays, new Date().toISOString());
}
