import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  bulkPut: vi.fn(),
  bulkDelete: vi.fn(),
  equalsDelete: vi.fn(),
  blockEqualsToArray: vi.fn(),
  masteredBlockToArray: vi.fn(),
  itemIdModify: vi.fn(),
  itemIdBetweenModify: vi.fn(),
  userEqualsToArray: vi.fn(),
  indexedBetween: vi.fn(),
  indexedFilter: vi.fn(),
  indexedLimit: vi.fn(),
  indexedToArray: vi.fn(),
  updatedBetweenToArray: vi.fn(),
  transaction: vi.fn(),
  rpc: vi.fn(),
  getNextAt: vi.fn(),
  getSyncTimestamps: vi.fn(),
  markAsSynced: vi.fn(),
  triggerLevelsUpdatedEvent: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
      nullReplacementNumber: 0,
    },
    srs: {
      intervals: [1, 2, 3],
    },
    lesson: {
      deckSize: 10,
    },
    progress: {
      afterNewGrammarProgress: 2,
      simulationProgress: 2,
      simulationCount: 200,
    },
    practice: {
      readyPracticeBadgeCap: 99,
      readyPracticeScheduleGroupWindowMs: 1000,
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_items: {
      bulkPut: (...args: unknown[]) => mocks.bulkPut(...args),
      bulkDelete: (...args: unknown[]) => mocks.bulkDelete(...args),
      where: (field: string) => {
        if (field === 'user_id') {
          return {
            equals: () => ({
              delete: (...args: unknown[]) => mocks.equalsDelete(...args),
              toArray: (...args: unknown[]) => mocks.userEqualsToArray(...args),
            }),
          };
        }
        if (field === '[user_id+item_id]') {
          return {
            equals: () => ({
              modify: (...args: unknown[]) => mocks.itemIdModify(...args),
            }),
            between: () => ({
              modify: (...args: unknown[]) => mocks.itemIdBetweenModify(...args),
            }),
          };
        }
        if (field === '[user_id+updated_at]') {
          return {
            between: () => ({
              toArray: (...args: unknown[]) => mocks.updatedBetweenToArray(...args),
            }),
          };
        }
        if (
          field ===
            '[user_id+is_practice_item+is_vocabulary+next_at+mastered_at+curriculum_sort_path]' ||
          field === '[user_id+is_practice_item+is_vocabulary+next_at+mastered_at+sort_order]'
        ) {
          return {
            between: (...args: unknown[]) => {
              mocks.indexedBetween(...args);
              return {
                filter: (...filterArgs: unknown[]) => {
                  mocks.indexedFilter(...filterArgs);
                  return {
                    limit: (...limitArgs: unknown[]) => {
                      mocks.indexedLimit(...limitArgs);
                      return {
                        toArray: (...toArrayArgs: unknown[]) =>
                          mocks.indexedToArray(...toArrayArgs),
                      };
                    },
                    toArray: (...toArrayArgs: unknown[]) => mocks.indexedToArray(...toArrayArgs),
                  };
                },
              };
            },
          };
        }
        if (field === '[user_id+is_practice_item+is_vocabulary+started_at]') {
          return {
            between: (...args: unknown[]) => {
              mocks.indexedBetween(...args);
              return {
                toArray: (...toArrayArgs: unknown[]) => mocks.indexedToArray(...toArrayArgs),
              };
            },
          };
        }
        if (field === '[user_id+started_at]') {
          return {
            between: (...args: unknown[]) => {
              mocks.indexedBetween(...args);
              return {
                filter: (...filterArgs: unknown[]) => {
                  mocks.indexedFilter(...filterArgs);
                  return {
                    toArray: (...toArrayArgs: unknown[]) => mocks.indexedToArray(...toArrayArgs),
                  };
                },
              };
            },
          };
        }
        if (field === '[user_id+block_id]') {
          return {
            equals: () => ({
              toArray: (...args: unknown[]) => mocks.blockEqualsToArray(...args),
            }),
          };
        }
        throw new Error(`Unexpected user_items.where field: ${field}`);
      },
    },
    user_blocks: {
      where: () => ({
        equals: () => ({
          toArray: (...args: unknown[]) => mocks.masteredBlockToArray(...args),
        }),
      }),
    },
    metadata: {},
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
  },
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    markAsSynced: (...args: unknown[]) => mocks.markAsSynced(...args),
  },
}));

vi.mock('@/database/models/grammar', () => ({
  default: {
    getStartedIds: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/database/utils/user-items.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/user-items.utils');
  return {
    ...actual,
    getNextAt: (...args: unknown[]) => mocks.getNextAt(...args),
  };
});

vi.mock('@/database/utils/sync-generic.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/sync-generic.utils');
  return {
    ...actual,
    getSyncTimestamps: (...args: unknown[]) => mocks.getSyncTimestamps(...args),
  };
});

vi.mock('@/utils/dashboard.utils', () => ({
  triggerLevelsUpdatedEvent: (...args: unknown[]) => mocks.triggerLevelsUpdatedEvent(...args),
}));

import UserItem from '@/database/models/user-items';

describe('UserItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mocks.getNextAt.mockReturnValue('2026-03-05T00:00:00.000Z');
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2026-03-03T00:00:00.000Z',
      newSyncedAt: '2026-03-04T00:00:00.000Z',
    });
    mocks.equalsDelete.mockResolvedValue(0);
    mocks.userEqualsToArray.mockResolvedValue([]);
    mocks.blockEqualsToArray.mockResolvedValue([]);
    mocks.masteredBlockToArray.mockResolvedValue([]);
    mocks.indexedToArray.mockResolvedValue([]);
    mocks.updatedBetweenToArray.mockResolvedValue([]);
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    mocks.markAsSynced.mockResolvedValue(undefined);
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
    mocks.itemIdModify.mockResolvedValue(1);
    mocks.itemIdBetweenModify.mockResolvedValue(200);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('savePracticeDeck stores items without changing score', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T09:00:00.000Z'));

    await UserItem.savePracticeDeck([
      {
        user_id: 'u1',
        item_id: 1,
        progress: 2,
        started_at: '1970-01-01T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
        next_at: '1970-01-01T00:00:00.000Z',
      } as any,
    ]);

    expect(mocks.bulkPut).toHaveBeenCalledTimes(1);
  });

  it('savePracticeDeck uses provided dateTime when passed explicitly', async () => {
    const dateTime = '2026-03-06T12:00:00.000Z';

    await UserItem.savePracticeDeck(
      [
        {
          user_id: 'u1',
          item_id: 1,
          progress: 3,
          started_at: '1970-01-01T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
          next_at: '1970-01-01T00:00:00.000Z',
        } as any,
      ],
      dateTime,
    );

    expect(mocks.bulkPut).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          started_at: dateTime,
          updated_at: dateTime,
          mastered_at: dateTime,
        }),
      ]),
    );
  });

  it('deleteAllItems deletes by user_id', async () => {
    await UserItem.deleteByUserId('u1');

    expect(mocks.equalsDelete).toHaveBeenCalled();
  });

  it('getByUserId returns only practice items for user stats', async () => {
    mocks.userEqualsToArray.mockResolvedValueOnce([
      { item_id: 1, is_practice_item: 1 },
      { item_id: 2, is_practice_item: 0 },
      { item_id: 3 },
    ]);

    const result = await UserItem.getByUserId('u1');

    expect(result.map((item) => item.item_id)).toEqual([1, 3]);
  });

  it('fills the deck with odd due items before considering even or new vocabulary', async () => {
    mocks.indexedToArray.mockResolvedValueOnce([
      {
        item_id: 2,
        progress: 1,
        next_at: '2026-01-01T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
      },
      {
        item_id: 3,
        progress: 3,
        next_at: '2026-01-02T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
      },
    ]);

    const deck = await UserItem.getPracticeDeck('u1', 2);

    expect(deck.map((item) => item.item_id)).toEqual([2, 3]);
    expect(mocks.indexedToArray).toHaveBeenCalledTimes(1);
  });

  it('fills vocabulary with odd due, even due, then unscheduled items', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.indexedToArray
      .mockResolvedValueOnce([
        {
          item_id: 1,
          progress: 1,
          next_at: '2026-06-20T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          item_id: 2,
          progress: 2,
          next_at: '2026-06-21T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          item_id: 3,
          progress: 5,
          next_at: '1970-01-01T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
        },
      ]);

    const deck = await UserItem.getPracticeDeck('u1', 4, 'vocabulary');

    expect(deck.map((item) => item.item_id)).toEqual([1, 2, 3]);
    expect(mocks.indexedLimit.mock.calls.map(([limit]) => limit)).toEqual([4, 3, 2]);
    expect(mocks.indexedBetween).toHaveBeenNthCalledWith(
      3,
      ['u1', 1, 1, '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      ['u1', 1, 1, '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      true,
      true,
    );
    const newVocabularyFilter = mocks.indexedFilter.mock.calls[2][0] as (item: any) => boolean;
    expect(newVocabularyFilter({
      progress: 5,
      next_at: '1970-01-01T00:00:00.000Z',
      mastered_at: '1970-01-01T00:00:00.000Z',
    })).toBe(true);
  });

  it('returns an empty deck without querying when deckSize is not positive', async () => {
    await expect(UserItem.getPracticeDeck('u1', 0)).resolves.toEqual([]);
    expect(mocks.indexedToArray).not.toHaveBeenCalled();
  });

  it('getPracticeDeck excludes unscheduled items even from mastered grammar blocks', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.masteredBlockToArray.mockResolvedValueOnce([
      {
        block_id: 10,
        is_vocabulary: false,
        is_practice_block: true,
        mastered_at: '2026-06-20T12:00:00.000Z',
      },
    ]);
    mocks.indexedToArray.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const deck = await UserItem.getPracticeDeck('u1', 10, 'grammar');

    expect(deck).toEqual([]);
    expect(mocks.indexedBetween).toHaveBeenNthCalledWith(
      1,
      ['u1', 1, 0, expect.anything(), '1970-01-01T00:00:00.000Z', expect.anything()],
      ['u1', 1, 0, '2026-06-24T12:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      true,
      false,
    );

    const grammarFilter = mocks.indexedFilter.mock.calls[1][0] as (item: any) => boolean;
    expect(grammarFilter({
      block_id: 10,
      mastered_at: '1970-01-01T00:00:00.000Z',
      next_at: '2026-06-24T11:00:00.000Z',
      progress: 0,
    })).toBe(true);
    expect(grammarFilter({
      block_id: 11,
      mastered_at: '1970-01-01T00:00:00.000Z',
      next_at: '2026-06-24T11:00:00.000Z',
      progress: 0,
    })).toBe(false);
    expect(grammarFilter({
      block_id: 10,
      mastered_at: '2026-06-20T12:00:00.000Z',
      next_at: '2026-06-24T11:00:00.000Z',
      progress: 0,
    })).toBe(false);
    expect(grammarFilter({
      block_id: 10,
      mastered_at: '1970-01-01T00:00:00.000Z',
      next_at: '1970-01-01T00:00:00.000Z',
      progress: 0,
    })).toBe(false);
    expect(grammarFilter({
      block_id: 10,
      mastered_at: '1970-01-01T00:00:00.000Z',
      next_at: '2026-06-24T12:00:00.000Z',
      progress: 0,
    })).toBe(false);
  });

  it('getByBlockId returns block items ordered by sort_order', async () => {
    mocks.blockEqualsToArray.mockResolvedValue([
      { item_id: 2, sort_order: 20 },
      { item_id: 1, sort_order: 10 },
    ]);

    const result = await UserItem.getByBlockId('u1', 3);

    expect(result.map((item: any) => item.item_id)).toEqual([1, 2]);
  });

  it('saveNewGrammarBlockCompletion does not downgrade skipped item progress', async () => {
    const dateTime = '2026-03-06T12:00:00.000Z';
    mocks.blockEqualsToArray.mockResolvedValue([
      {
        item_id: 1,
        sort_order: 1,
        progress: 101,
        progress_history: [],
        started_at: '2026-03-01T00:00:00.000Z',
        mastered_at: '2026-03-06T11:00:00.000Z',
      },
      {
        item_id: 2,
        sort_order: 2,
        progress: 0,
        progress_history: [],
        started_at: '1970-01-01T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
      },
    ]);

    await UserItem.saveNewGrammarBlockCompletion('u1', 3, dateTime);

    expect(mocks.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        item_id: 1,
        progress: 101,
        started_at: '2026-03-01T00:00:00.000Z',
        updated_at: dateTime,
        mastered_at: '2026-03-06T11:00:00.000Z',
      }),
      expect.objectContaining({
        item_id: 2,
        progress: 2,
        started_at: dateTime,
        updated_at: dateTime,
      }),
    ]);
    expect(mocks.getNextAt).toHaveBeenCalledWith(101);
    expect(mocks.getNextAt).toHaveBeenCalledWith(2);
  });

  it('resetItemById triggers levels update when successful', async () => {
    await UserItem.resetItemById('u1', 10);

    expect(mocks.triggerLevelsUpdatedEvent).toHaveBeenCalledWith('u1');
  });

  it('getReadyVocabularyPracticeState counts ready started and not-started vocabulary', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.indexedToArray
      .mockResolvedValueOnce([{ item_id: 1, mastered_at: '1970-01-01T00:00:00.000Z' }])
      .mockResolvedValueOnce([
        { item_id: 2, mastered_at: '1970-01-01T00:00:00.000Z' },
        { item_id: 3, mastered_at: '1970-01-01T00:00:00.000Z' },
      ]);

    await expect(UserItem.getReadyVocabularyPracticeState('u1')).resolves.toEqual({
      readyCount: 3,
      schedule: [],
    });

    expect(mocks.indexedBetween).toHaveBeenNthCalledWith(
      1,
      ['u1', 1, 1, expect.anything(), '1970-01-01T00:00:00.000Z', expect.anything()],
      ['u1', 1, 1, '2026-06-24T12:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      true,
      false,
    );
    expect(mocks.indexedBetween).toHaveBeenNthCalledWith(
      2,
      ['u1', 1, 1, '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      ['u1', 1, 1, '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      true,
      true,
    );
    expect(mocks.indexedLimit).toHaveBeenNthCalledWith(1, 100);
    expect(mocks.indexedLimit).toHaveBeenNthCalledWith(2, 99);
  });

  it('getReadyVocabularyPracticeState caps availability above the badge cap', async () => {
    mocks.indexedToArray.mockResolvedValueOnce(Array.from({ length: 100 }, (_, index) => ({
      item_id: index + 1,
      mastered_at: '1970-01-01T00:00:00.000Z',
    })));

    await expect(UserItem.getReadyVocabularyPracticeState('u1')).resolves.toEqual({
      readyCount: 100,
      schedule: [],
    });

    expect(mocks.indexedToArray).toHaveBeenCalledTimes(1);
  });

  it('getReadyVocabularyPracticeState schedules future vocabulary when none is ready', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.indexedToArray
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          item_id: 1,
          next_at: '2026-06-24T12:00:10.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
        },
        {
          item_id: 2,
          next_at: '2026-06-24T12:00:10.800Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
        },
      ]);

    await expect(UserItem.getReadyVocabularyPracticeState('u1')).resolves.toEqual({
      readyCount: 0,
      schedule: [{ date: '2026-06-24T12:00:10.800Z', count: 2 }],
    });

    expect(mocks.indexedBetween).toHaveBeenNthCalledWith(
      3,
      ['u1', 1, 1, '2026-06-24T12:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      ['u1', 1, 1, '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      false,
      false,
    );
  });

  it('getReadyVocabularyPracticeState ignores mastered vocabulary candidates', async () => {
    mocks.indexedToArray.mockResolvedValueOnce([]);

    await UserItem.getReadyVocabularyPracticeState('u1');

    const filterCandidate = mocks.indexedFilter.mock.calls[0][0] as (item: {
      mastered_at: string;
    }) => boolean;
    expect(filterCandidate({ mastered_at: '1970-01-01T00:00:00.000Z' })).toBe(true);
    expect(filterCandidate({ mastered_at: '2026-06-24T11:00:00.000Z' })).toBe(false);
  });

  it('simulateData updates first configured range using indexed between+modify', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-10T10:00:00.000Z'));
    mocks.getNextAt.mockReturnValue('2026-06-12T00:00:00.000Z');

    const count = await UserItem.simulateData('u1');

    expect(count).toBe(200);
    expect(mocks.itemIdBetweenModify).toHaveBeenCalledTimes(1);

    const modifyFn = mocks.itemIdBetweenModify.mock.calls[0][0] as (item: any) => void;
    const item = {
      progress: 0,
      updated_at: '1970-01-01T00:00:00.000Z',
      next_at: '1970-01-01T00:00:00.000Z',
    };

    modifyFn(item);

    expect(item.progress).toBe(2);
    expect(item.updated_at).toBe('2026-06-10T10:00:00.000Z');
    expect(item.next_at).toBe('2026-06-12T00:00:00.000Z');
    expect(mocks.getNextAt).toHaveBeenCalledWith(2);
  });

  it('syncFromRemote pushes local items, applies pull, and marks sync', async () => {
    mocks.updatedBetweenToArray.mockResolvedValue([
      {
        user_id: 'u1',
        item_id: 1,
        progress_history: [{ progress: 1, created_at: '2026-03-03T09:59:00.000Z' }],
        progress: 1,
        started_at: '1970-01-01T00:00:00.000Z',
        updated_at: '2026-03-03T10:00:00.000Z',
        next_at: '1970-01-01T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
        deleted_at: null,
      },
    ]);
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: 'u1',
          item_id: 2,
          czech: 'dva',
          english: 'two',
          pronunciation: 'two',
          audio: null,
          is_vocabulary: true,
          is_practice_item: false,
          sort_order: 2,
          curriculum_sort_path: [1, 2, 3, 2],
          note_id: null,
          block_id: null,
          grammar_id: null,
          progress: 0,
          progress_history: [],
          started_at: null,
          updated_at: '2026-03-04T00:00:00.000Z',
          next_at: null,
          mastered_at: null,
          lesson_id: 1,
          deleted_at: null,
        },
        {
          user_id: 'u1',
          item_id: 3,
          deleted_at: '2026-03-04T00:00:00.000Z',
        },
      ],
      error: null,
    });

    await UserItem.syncFromRemote('u1', false);

    expect(mocks.rpc).toHaveBeenCalledWith('upsert_fetch_user_items', {
      p_user_id: 'u1',
      p_last_synced_at: '2026-03-03T00:00:00.000Z',
      p_user_items: [
        expect.objectContaining({
          user_id: 'u1',
          item_id: 1,
          progress_history: [{ progress: 1, created_at: '2026-03-03T09:59:00.000Z' }],
          progress: 1,
          updated_at: '2026-03-03T10:00:00.000Z',
          started_at: null,
          next_at: null,
          mastered_at: null,
        }),
      ],
    });
    expect(mocks.bulkDelete).toHaveBeenCalledWith([['u1', 3]]);
    expect(mocks.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        item_id: 2,
        is_vocabulary: 1,
        is_practice_item: 0,
        curriculum_sort_path: [1, 2, 3, 2],
        block_id: 0,
        grammar_id: 0,
        started_at: '1970-01-01T00:00:00.000Z',
        next_at: '1970-01-01T00:00:00.000Z',
        mastered_at: '1970-01-01T00:00:00.000Z',
      }),
    ]);
    expect(mocks.markAsSynced).toHaveBeenCalledWith('user_items', '2026-03-04T00:00:00.000Z', 'u1');
  });
});
