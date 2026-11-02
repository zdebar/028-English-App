import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hasInitiatedGrammar: vi.fn(),
  hasInitiatedVocabulary: vi.fn(),
  getInitiatedVocabulary: vi.fn(),
  getInitiatedGrammar: vi.fn(),
  hasInitiatedByUserId: vi.fn(),
  getInitiatedByUserId: vi.fn(),
  getInitiatedSounds: vi.fn(),
  getAllSoundsForOverview: vi.fn(),
}));

vi.mock('@/database/queries/shared-query-store', () => ({
  sharedQueryKey: (userId: string, name: string) => JSON.stringify([userId, name]),
}));

vi.mock('@/database/queries/grammar-queries', () => ({
  getInitiatedGrammarTopics: (...args: unknown[]) => mocks.getInitiatedGrammar(...args),
}));

vi.mock('@/database/queries/topic-queries', () => ({
  hasInitiatedTopicsByUserId: (...args: unknown[]) => mocks.hasInitiatedByUserId(...args),
  getInitiatedTopicsByUserId: (...args: unknown[]) => mocks.getInitiatedByUserId(...args),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    hasInitiatedGrammar: (...args: unknown[]) => mocks.hasInitiatedGrammar(...args),
    hasInitiatedVocabulary: (...args: unknown[]) => mocks.hasInitiatedVocabulary(...args),
    getInitiatedVocabulary: (...args: unknown[]) => mocks.getInitiatedVocabulary(...args),
  },
}));
vi.mock('@/database/queries/sound-group-queries', () => ({
  hasAvailableSoundGroups: (...args: unknown[]) => mocks.getInitiatedSounds(...args),
  getAllSoundGroupsForOverview: (...args: unknown[]) => mocks.getAllSoundsForOverview(...args),
}));

import {
  loadOverviewAvailability,
  overviewQueryKey,
  warmOverviewQueries,
} from '../overview-query-store';

describe('overview query store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasInitiatedGrammar.mockResolvedValue(true);
    mocks.hasInitiatedByUserId.mockResolvedValue(true);
    mocks.hasInitiatedVocabulary.mockResolvedValue(true);
    mocks.getInitiatedGrammar.mockResolvedValue([{ id: 1 }]);
    mocks.getInitiatedByUserId.mockResolvedValue([{ id: 2 }]);
    mocks.getInitiatedVocabulary.mockResolvedValue([{ item_id: 3 }]);
    mocks.getInitiatedSounds.mockResolvedValue(true);
    mocks.getAllSoundsForOverview.mockResolvedValue([{ id: 5, isActive: true }]);
  });

  it('warms all availability and destination overview queries', async () => {
    await warmOverviewQueries('u1');

    expect(mocks.getInitiatedGrammar).toHaveBeenCalledWith('u1');
    expect(mocks.getInitiatedByUserId).toHaveBeenCalledWith('u1');
    expect(mocks.getInitiatedVocabulary).toHaveBeenCalledWith('u1');
    expect(mocks.hasInitiatedGrammar).toHaveBeenCalledOnce();
    expect(mocks.hasInitiatedByUserId).toHaveBeenCalledOnce();
    expect(mocks.hasInitiatedVocabulary).toHaveBeenCalledOnce();
    expect(mocks.getInitiatedSounds).toHaveBeenCalledOnce();
    expect(mocks.getAllSoundsForOverview).toHaveBeenCalledWith('u1');
  });

  it('loads availability from the same shared query names', async () => {
    await expect(loadOverviewAvailability('u1')).resolves.toEqual({
      grammar: true,
      topics: true,
      vocabulary: true,
      sounds: true,
    });
    expect(mocks.hasInitiatedGrammar).toHaveBeenCalledOnce();
    expect(mocks.hasInitiatedByUserId).toHaveBeenCalledOnce();
    expect(mocks.hasInitiatedVocabulary).toHaveBeenCalledOnce();
    expect(mocks.getInitiatedSounds).toHaveBeenCalledOnce();
  });

  it('uses the same user-scoped keys as the existing shared-query store', () => {
    expect(overviewQueryKey('u1', 'grammar')).toBe('["u1","grammar"]');
  });
});
