import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSharedQuery: vi.fn(),
  loadSharedQuery: vi.fn(),
  hasInitiatedGrammar: vi.fn(),
  hasInitiatedVocabulary: vi.fn(),
  getByUserId: vi.fn(),
  getInitiatedVocabulary: vi.fn(),
  getInitiatedGrammar: vi.fn(),
  hasInitiatedByUserId: vi.fn(),
  getInitiatedByUserId: vi.fn(),
  loadNames: [] as string[],
}));

vi.mock('@/hooks/shared-query-store', () => ({
  getSharedQuery: (...args: unknown[]) => mocks.getSharedQuery(...args),
  loadSharedQuery: (...args: unknown[]) => mocks.loadSharedQuery(...args),
  sharedQueryKey: (userId: string, name: string) => JSON.stringify([userId, name]),
}));

vi.mock('@/database/models/grammar-topics', () => ({
  default: { getInitiated: (...args: unknown[]) => mocks.getInitiatedGrammar(...args) },
}));

vi.mock('@/database/models/topics', () => ({
  default: {
    hasInitiatedByUserId: (...args: unknown[]) => mocks.hasInitiatedByUserId(...args),
    getInitiatedByUserId: (...args: unknown[]) => mocks.getInitiatedByUserId(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    hasInitiatedGrammar: (...args: unknown[]) => mocks.hasInitiatedGrammar(...args),
    hasInitiatedVocabulary: (...args: unknown[]) => mocks.hasInitiatedVocabulary(...args),
    getByUserId: (...args: unknown[]) => mocks.getByUserId(...args),
    getInitiatedVocabulary: (...args: unknown[]) => mocks.getInitiatedVocabulary(...args),
  },
}));

import {
  loadOverviewAvailability,
  overviewQueryKey,
  warmOverviewQueries,
} from '../overview-query-store';

describe('overview query store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadNames = [];
    mocks.loadSharedQuery.mockImplementation(
      async (_userId: string, name: string, query: () => Promise<unknown>) => {
        mocks.loadNames.push(name);
        return query();
      },
    );
    mocks.hasInitiatedGrammar.mockResolvedValue(true);
    mocks.hasInitiatedByUserId.mockResolvedValue(true);
    mocks.hasInitiatedVocabulary.mockResolvedValue(true);
    mocks.getInitiatedGrammar.mockResolvedValue([{ id: 1 }]);
    mocks.getInitiatedByUserId.mockResolvedValue([{ id: 2 }]);
    mocks.getInitiatedVocabulary.mockResolvedValue([{ item_id: 3 }]);
    mocks.getByUserId.mockResolvedValue([{ item_id: 4 }]);
  });

  it('warms all availability and destination overview queries', async () => {
    await warmOverviewQueries('u1');

    expect(mocks.loadNames).toEqual([
      'has-grammar',
      'has-topics',
      'has-vocabulary',
      'grammar',
      'topics',
      'vocabulary',
      'practice-overview',
    ]);
    expect(mocks.getInitiatedGrammar).toHaveBeenCalledWith('u1');
    expect(mocks.getInitiatedByUserId).toHaveBeenCalledWith('u1');
    expect(mocks.getInitiatedVocabulary).toHaveBeenCalledWith('u1');
    expect(mocks.getByUserId).toHaveBeenCalledWith('u1');
  });

  it('loads availability from the same shared query names', async () => {
    await expect(loadOverviewAvailability('u1')).resolves.toEqual({
      grammar: true,
      topics: true,
      vocabulary: true,
    });
    expect(mocks.loadNames).toEqual(['has-grammar', 'has-topics', 'has-vocabulary']);
  });

  it('uses the same user-scoped keys as the existing shared-query store', () => {
    expect(overviewQueryKey('u1', 'grammar')).toBe('["u1","grammar"]');
  });
});
