import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hasGrammar: vi.fn(), hasTopics: vi.fn(), hasVocabulary: vi.fn(),
  topics: vi.fn(), vocabulary: vi.fn(),
  loadReviewDeckData: vi.fn(),
}));
vi.mock('@/hooks/shared-query-store', () => ({
  loadSharedQuery: (_userId: string, _name: string, query: () => Promise<unknown>) => query(),
}));
vi.mock('@/database/models/user-items', () => ({ default: {
  hasInitiatedGrammar: mocks.hasGrammar,
  hasInitiatedVocabulary: mocks.hasVocabulary,
  getInitiatedVocabulary: mocks.vocabulary,
} }));
vi.mock('@/database/models/topics', () => ({ default: {
  hasInitiatedByUserId: mocks.hasTopics,
  getInitiatedByUserId: mocks.topics,
} }));
vi.mock('@/database/models/grammar-groups', () => ({ default: {} }));
vi.mock('@/database/models/pronunciation-groups', () => ({ default: {} }));
vi.mock('@/database/models/blocks', () => ({ default: {} }));
vi.mock('@/database/models/practice-sessions', () => ({ default: {} }));
vi.mock('@/database/utils/practice-content.utils', () => ({
  loadReviewDeckData: (...args: unknown[]) => mocks.loadReviewDeckData(...args),
}));

import {
  overviewAvailabilityDescriptor,
  reviewPracticeDescriptor,
  topicsDescriptor,
  vocabularyDescriptor,
} from '../route-data';

describe('route data queries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses existence queries for the overview menu without loading lists', async () => {
    mocks.hasGrammar.mockResolvedValue(true);
    mocks.hasTopics.mockResolvedValue(false);
    mocks.hasVocabulary.mockResolvedValue(true);
    await expect(overviewAvailabilityDescriptor('u1').load()).resolves.toEqual({
      grammar: true, topics: false, vocabulary: true,
    });
    expect(mocks.topics).not.toHaveBeenCalled();
    expect(mocks.vocabulary).not.toHaveBeenCalled();
  });

  it('still returns complete lists for the destination pages', async () => {
    const topics = [{ id: 1, name: 'Topic' }];
    const vocabulary = [{ item_id: 1, english: 'word' }];
    mocks.topics.mockResolvedValue(topics);
    mocks.vocabulary.mockResolvedValue(vocabulary);
    await expect(topicsDescriptor('u1').load()).resolves.toBe(topics);
    await expect(vocabularyDescriptor('u1').load()).resolves.toBe(vocabulary);
    expect(mocks.hasTopics).not.toHaveBeenCalled();
    expect(mocks.hasVocabulary).not.toHaveBeenCalled();
  });

  it('passes the explicit review kind to the review route loader', async () => {
    const reviewData = { entries: [], reviewKind: 'vocabulary' };
    mocks.loadReviewDeckData.mockResolvedValue(reviewData);

    await expect(reviewPracticeDescriptor('u1', 'vocabulary').load()).resolves.toBe(reviewData);

    expect(mocks.loadReviewDeckData).toHaveBeenCalledWith('u1', 'vocabulary');
  });
});
