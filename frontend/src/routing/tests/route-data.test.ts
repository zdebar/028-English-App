import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ ensurePackage: vi.fn() }));

vi.mock('@/database/state/data-store', () => ({
  ensureDataPackage: (...args: unknown[]) => mocks.ensurePackage(...args),
}));

import {
  loadGrammarOverviewData,
  loadInitialTrainingData,
  loadOverviewAvailabilityData,
  loadPronunciationOverviewData,
  loadReviewPracticeData,
  loadSoundGroupDetailData,
  loadSoundsOverviewData,
  loadTopicDetailData,
  loadTopicsOverviewData,
  loadVocabularyOverviewData,
} from '../route-data';

describe('route data package preparation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensurePackage.mockResolvedValue({ topic: { id: 2 } });
  });

  it('prepares page packages without returning a second page data source', async () => {
    await expect(loadOverviewAvailabilityData('u1')).resolves.toBeNull();
    await expect(loadGrammarOverviewData('u1')).resolves.toBeNull();
    await expect(loadTopicsOverviewData('u1')).resolves.toBeNull();
    await expect(loadVocabularyOverviewData('u1')).resolves.toBeNull();
    await expect(loadSoundsOverviewData('u1')).resolves.toBeNull();
    await expect(loadPronunciationOverviewData('u1')).resolves.toBeNull();

    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(1, 'u1', { kind: 'overview-menu' });
    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(2, 'u1', { kind: 'grammar-overview' });
    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(3, 'u1', { kind: 'topics-overview' });
    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(4, 'u1', { kind: 'vocabulary' });
    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(5, 'u1', { kind: 'sounds-overview' });
    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(6, 'u1', { kind: 'pronunciation-overview' });
  });

  it('uses request parameters to prepare details and review packages', async () => {
    const topic = { topic: { id: 2 }, items: [] };
    const sound = { group: { id: 4 }, items: [] };
    mocks.ensurePackage
      .mockResolvedValueOnce(topic)
      .mockResolvedValueOnce(sound)
      .mockResolvedValueOnce({ entries: [], reviewKind: 'vocabulary' })
      .mockResolvedValueOnce({ items: [] });

    await expect(loadTopicDetailData('u1', 2)).resolves.toBe(topic);
    await expect(loadSoundGroupDetailData('u1', 4)).resolves.toBe(sound);
    await expect(loadReviewPracticeData('u1', 'vocabulary')).resolves.toBeNull();
    await expect(loadInitialTrainingData('u1')).resolves.toEqual({ items: [] });

    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(1, 'u1', { kind: 'topic-detail', topicId: 2 });
    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(2, 'u1', { kind: 'sound-detail', groupId: 4 });
    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(3, 'u1', { kind: 'review-practice', reviewKind: 'vocabulary' });
    expect(mocks.ensurePackage).toHaveBeenNthCalledWith(4, 'u1', { kind: 'initial-training' });
  });

  it('propagates package preparation errors to the route error boundary', async () => {
    mocks.ensurePackage.mockRejectedValueOnce(new Error('IndexedDB unavailable'));
    await expect(loadTopicsOverviewData('u1')).rejects.toThrow('IndexedDB unavailable');
  });
});
