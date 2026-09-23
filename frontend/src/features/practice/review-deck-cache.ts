import {
  loadReviewDeckData,
  type ReviewDeckData,
} from '@/database/utils/practice-content.utils';

type ReviewDeckCacheEntry = Readonly<{
  promise: Promise<ReviewDeckData>;
  data?: ReviewDeckData;
}>;

const reviewDeckCache = new Map<string, ReviewDeckCacheEntry>();

function createReviewDeckEntry(userId: string): ReviewDeckCacheEntry {
  const entry = {} as { promise: Promise<ReviewDeckData>; data?: ReviewDeckData };
  entry.promise = loadReviewDeckData(userId).then(
    (data) => {
      if (reviewDeckCache.get(userId) === entry) {
        entry.data = data;
      }
      return data;
    },
    (error: unknown) => {
      if (reviewDeckCache.get(userId) === entry) {
        reviewDeckCache.delete(userId);
      }
      throw error;
    },
  );
  reviewDeckCache.set(userId, entry);
  return entry;
}

function getReviewDeckEntry(userId: string): ReviewDeckCacheEntry {
  return reviewDeckCache.get(userId) ?? createReviewDeckEntry(userId);
}

export function getCachedReviewDeck(userId: string): ReviewDeckData | undefined {
  return reviewDeckCache.get(userId)?.data;
}

export function loadCachedReviewDeck(userId: string): Promise<ReviewDeckData> {
  return getReviewDeckEntry(userId).promise;
}

export function prefetchReviewDeck(userId: string): Promise<ReviewDeckData> {
  return loadCachedReviewDeck(userId);
}

export function invalidateReviewDeck(userId: string): void {
  reviewDeckCache.delete(userId);
}

export function clearReviewDeckCacheExcept(userId: string | null): void {
  for (const cachedUserId of reviewDeckCache.keys()) {
    if (cachedUserId !== userId) reviewDeckCache.delete(cachedUserId);
  }
}
