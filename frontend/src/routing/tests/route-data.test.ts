import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ensureReady: vi.fn(),
  dataState: { userId: 'u1', status: 'ready' },
  selectGrammarOverview: vi.fn<(...args: unknown[]) => unknown>(() => []),
  selectPronunciationDetail: vi.fn<(...args: unknown[]) => unknown>(() => null),
  selectReviewDeck: vi.fn<(...args: unknown[]) => unknown>(() => ({ entries: [], reviewKind: 'vocabulary' })),
  selectSoundDetail: vi.fn<(...args: unknown[]) => unknown>(() => null),
  selectSoundOverview: vi.fn<(...args: unknown[]) => unknown>(() => []),
  selectTopicOverview: vi.fn<(...args: unknown[]) => unknown>(() => []),
  selectTopicDetail: vi.fn<(...args: unknown[]) => unknown>(() => ({ topic: null, items: [] })),
  selectVocabulary: vi.fn<(...args: unknown[]) => unknown>(() => []),
}));

vi.mock('@/database/state/data-store', () => ({
  ensureDataManagerReady: (userId: string) => mocks.ensureReady(userId),
  dataManagerStore: { getState: () => mocks.dataState },
}));

vi.mock('@/database/state/data-selectors', () => ({
  selectGrammarOverview: (state: unknown, userId: string) => mocks.selectGrammarOverview(state, userId),
  selectPronunciationDetail: (state: unknown, userId: string, id: number) => mocks.selectPronunciationDetail(state, userId, id),
  selectReviewDeck: (state: unknown, userId: string, kind: string) => mocks.selectReviewDeck(state, userId, kind),
  selectSoundDetail: (state: unknown, userId: string, id: number) => mocks.selectSoundDetail(state, userId, id),
  selectSoundOverview: (state: unknown, userId: string) => mocks.selectSoundOverview(state, userId),
  selectTopicOverview: (state: unknown, userId: string) => mocks.selectTopicOverview(state, userId),
  selectTopicDetail: (state: unknown, userId: string, id: number) => mocks.selectTopicDetail(state, userId, id),
  selectVocabulary: (state: unknown, userId: string) => mocks.selectVocabulary(state, userId),
}));

import {
  loadGrammarOverviewData,
  loadOverviewAvailabilityData,
  loadReviewPracticeData,
  loadSoundsOverviewData,
  loadTopicDetailData,
  loadTopicsOverviewData,
  loadVocabularyOverviewData,
} from '../route-data';

describe('route data selectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dataState = { userId: 'u1', status: 'ready' };
    mocks.ensureReady.mockResolvedValue(undefined);
  });

  it('ensures the manager is ready before selecting overview availability', async () => {
    mocks.selectGrammarOverview.mockReturnValueOnce([{ id: 1 }]);
    mocks.selectTopicOverview.mockReturnValueOnce([{ id: 2 }]);
    mocks.selectVocabulary.mockReturnValueOnce([{ item_id: 3 }]);
    mocks.selectSoundOverview.mockReturnValueOnce([{ id: 4, isActive: true }]);

    await expect(loadOverviewAvailabilityData('u1')).resolves.toEqual({
      grammar: true,
      topics: true,
      vocabulary: true,
      sounds: true,
    });
    expect(mocks.ensureReady).toHaveBeenCalledWith('u1');
  });

  it('uses central selectors to build complete route data', async () => {
    const grammar = [{ id: 1 }];
    const topics = [{ id: 2 }];
    const topic = { topic: { id: 2 }, items: [{ item_id: 3 }] };
    const vocabulary = [{ item_id: 3 }];
    const sounds = [{ id: 4, isActive: true }];
    mocks.selectGrammarOverview.mockReturnValue(grammar);
    mocks.selectTopicOverview.mockReturnValue(topics);
    mocks.selectTopicDetail.mockReturnValue(topic);
    mocks.selectVocabulary.mockReturnValue(vocabulary);
    mocks.selectSoundOverview.mockReturnValue(sounds);

    await expect(loadGrammarOverviewData('u1')).resolves.toBe(grammar);
    await expect(loadTopicsOverviewData('u1')).resolves.toBe(topics);
    await expect(loadTopicDetailData('u1', 2)).resolves.toBe(topic);
    await expect(loadVocabularyOverviewData('u1')).resolves.toBe(vocabulary);
    await expect(loadSoundsOverviewData('u1')).resolves.toBe(sounds);
  });

  it('passes the review kind to the central review selector', async () => {
    const reviewData = { entries: [], reviewKind: 'vocabulary' };
    mocks.selectReviewDeck.mockReturnValue(reviewData);

    await expect(loadReviewPracticeData('u1', 'vocabulary')).resolves.toBe(reviewData);
    expect(mocks.selectReviewDeck).toHaveBeenCalledWith(mocks.dataState, 'u1', 'vocabulary');
  });

  it('rejects a stale or failed account snapshot', async () => {
    mocks.dataState = { userId: 'u2', status: 'ready' };

    await expect(loadTopicsOverviewData('u1')).rejects.toThrow('Application data is not ready');
  });
});
