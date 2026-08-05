import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  bulkPut: vi.fn(),
  bulkUpdate: vi.fn(),
  bulkDelete: vi.fn(),
  equalsDelete: vi.fn(),
  blockEqualsToArray: vi.fn(),
  masteredBlockToArray: vi.fn(),
  userBlockGet: vi.fn(),
  itemIdModify: vi.fn(),
  itemIdBetween: vi.fn(),
  itemIdLimit: vi.fn(),
  simulationToArray: vi.fn(),
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
  userItemGet: vi.fn(),
  userItemUpdate: vi.fn(),
  pronunciationCount: vi.fn(),
  pronunciationToArray: vi.fn(),
  pronunciationMemberships: [] as Array<{ pronunciation_group_id: number; item_id: number }>,
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '1970-01-01T00:00:00.000Z',
      nullReplacementNumber: 0,
    },
    srs: {
      intervals: {
        czToEn: [1, 2, 3],
        enToCz: [1, 2, 3],
      },
    },
    lesson: {
      deckSize: 10,
    },
    progress: {
      afterInitialTrainingProgress: 2,
      simulationItemProgress: 1,
      simulationItemCount: 4,
      simulationPronunciationItemCount: 2,
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
      get: (...args: unknown[]) => mocks.userItemGet(...args),
      update: (...args: unknown[]) => mocks.userItemUpdate(...args),
      bulkPut: (...args: unknown[]) => mocks.bulkPut(...args),
      bulkUpdate: (...args: unknown[]) => mocks.bulkUpdate(...args),
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
            between: (...args: unknown[]) => {
              mocks.itemIdBetween(...args);
              return {
                limit: (...limitArgs: unknown[]) => {
                  mocks.itemIdLimit(...limitArgs);
                  return {
                    toArray: (...toArrayArgs: unknown[]) =>
                      mocks.simulationToArray(...toArrayArgs),
                  };
                },
              };
            },
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
            '[user_id+is_practice_item+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]' ||
          field ===
            '[user_id+is_practice_item+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]'
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
                          Promise.resolve(mocks.indexedToArray(...toArrayArgs)).then((items) =>
                            (items ?? []).map((item: any) => ({
                              ...item,
                              progress_cz_to_en: item.progress_cz_to_en ?? item.progress ?? 0,
                              progress_en_to_cz: item.progress_en_to_cz ?? item.progress ?? 0,
                              next_at_cz_to_en: item.next_at_cz_to_en ?? item.next_at,
                              next_at_en_to_cz: item.next_at_en_to_cz ?? item.next_at,
                              mastered_at_cz_to_en:
                                item.mastered_at_cz_to_en ?? item.mastered_at,
                              mastered_at_en_to_cz:
                                item.mastered_at_en_to_cz ?? item.mastered_at,
                              started_at:
                                item.started_at ??
                                (item.next_at === '1970-01-01T00:00:00.000Z'
                                  ? '1970-01-01T00:00:00.000Z'
                                  : '2025-01-01T00:00:00.000Z'),
                            })),
                          ),
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
        if (field === '[user_id+has_pronunciation_practice]') {
          return {
            equals: () => ({
              count: (...args: unknown[]) => mocks.pronunciationCount(...args),
              toArray: (...args: unknown[]) => mocks.pronunciationToArray(...args),
            }),
          };
        }
        throw new Error(`Unexpected user_items.where field: ${field}`);
      },
    },
    pronunciation_group_items: {
      toArray: async () => mocks.pronunciationMemberships,
    },
    user_blocks: {
      get: (...args: unknown[]) => mocks.userBlockGet(...args),
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

vi.mock('@/database/models/grammar-chunks', () => ({
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

import UserItem from '@/database/models/user-items';

describe('UserItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pronunciationMemberships = [];
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
    mocks.userBlockGet.mockResolvedValue(null);
    mocks.indexedToArray.mockResolvedValue([]);
    mocks.updatedBetweenToArray.mockResolvedValue([]);
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    mocks.markAsSynced.mockResolvedValue(undefined);
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
    mocks.itemIdModify.mockResolvedValue(1);
    mocks.simulationToArray.mockResolvedValue([]);
    mocks.userItemGet.mockResolvedValue(undefined);
    mocks.userItemUpdate.mockResolvedValue(1);
    mocks.bulkUpdate.mockResolvedValue(1);
    mocks.pronunciationCount.mockResolvedValue(0);
    mocks.pronunciationToArray.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('savePracticeDeck updates only practice progress fields', async () => {
    await UserItem.savePracticeDeck([
      {
        user_id: 'u1',
        item_id: 1,
        czech: 'ahoj',
        english: 'hello',
        audio: 'hello.opus',
        has_pronunciation_practice: 0,
        progress_cz_to_en: 2,
        progress_en_to_cz: 3,
        progress_history: [
          {
            progress: 2,
            created_at: '2026-03-04T09:00:00.000Z',
            direction: 'czToEn',
            outcome: 'correct',
          },
        ],
        started_at: '2026-03-01T09:00:00.000Z',
        updated_at: '2026-03-04T09:00:00.000Z',
        next_at_cz_to_en: '2026-03-06T09:00:00.000Z',
        next_at_en_to_cz: '2026-03-07T09:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '2026-03-04T09:00:00.000Z',
      } as any,
    ]);

    expect(mocks.bulkUpdate).toHaveBeenCalledWith([
      {
        key: ['u1', 1],
        changes: {
          progress_cz_to_en: 2,
          progress_en_to_cz: 3,
          progress_history: [
            {
              progress: 2,
              created_at: '2026-03-04T09:00:00.000Z',
              direction: 'czToEn',
              outcome: 'correct',
            },
          ],
          started_at: '2026-03-01T09:00:00.000Z',
          updated_at: '2026-03-04T09:00:00.000Z',
          next_at_cz_to_en: '2026-03-06T09:00:00.000Z',
          next_at_en_to_cz: '2026-03-07T09:00:00.000Z',
          mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
          mastered_at_en_to_cz: '2026-03-04T09:00:00.000Z',
        },
      },
    ]);
    expect(mocks.bulkPut).not.toHaveBeenCalled();
  });

  it('does not overwrite pronunciation selection from a stale practice snapshot', async () => {
    await UserItem.savePracticeDeck([
      {
        user_id: 'u1',
        item_id: 1,
        progress_cz_to_en: 2,
        has_pronunciation_practice: 0,
      } as any,
    ]);

    const [{ changes }] = mocks.bulkUpdate.mock.calls[0][0];
    expect(changes).not.toHaveProperty('has_pronunciation_practice');
    expect(changes).not.toHaveProperty('czech');
    expect(changes).not.toHaveProperty('audio');
  });

  it('toggles pronunciation selection without changing progress fields', async () => {
    mocks.userItemGet.mockResolvedValue({
      item_id: 7,
      is_vocabulary: 1,
      audio: 'seven.opus',
      has_pronunciation_practice: 0,
    });

    await expect(
      UserItem.togglePronunciationPractice(
        'u1',
        7,
        '2026-07-30T10:00:00.000Z',
      ),
    ).resolves.toBe(true);

    expect(mocks.userItemUpdate).toHaveBeenCalledWith(['u1', 7], {
      has_pronunciation_practice: 1,
      updated_at: '2026-07-30T10:00:00.000Z',
    });
  });

  it('allows non-vocabulary pronunciation selection and rejects audio-less items', async () => {
    mocks.userItemGet
      .mockResolvedValueOnce({
        item_id: 8,
        is_vocabulary: 0,
        audio: 'grammar.opus',
        has_pronunciation_practice: 0,
      })
      .mockResolvedValueOnce({
        item_id: 9,
        is_vocabulary: 1,
        audio: null,
        has_pronunciation_practice: 0,
      });

    await expect(UserItem.togglePronunciationPractice('u1', 8)).resolves.toBe(true);
    await expect(UserItem.togglePronunciationPractice('u1', 9)).rejects.toThrow(
      'not eligible',
    );
    expect(mocks.userItemUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.userItemUpdate).toHaveBeenCalledWith(
      ['u1', 8],
      expect.objectContaining({ has_pronunciation_practice: 1 }),
    );
  });

  it('counts pronunciation selections on the dedicated index', async () => {
    mocks.pronunciationCount.mockResolvedValue(3);

    await expect(UserItem.getPronunciationPracticeCount('u1')).resolves.toBe(3);
    expect(mocks.pronunciationCount).toHaveBeenCalledTimes(1);
  });

  it('builds an eligible pronunciation deck by group id and then curriculum order', async () => {
    mocks.pronunciationToArray.mockResolvedValue([
      {
        item_id: 3,
        is_vocabulary: 1,
        audio: 'three.opus',
        curriculum_sort_path: [2, 1, 1],
      },
      {
        item_id: 2,
        is_vocabulary: 0,
        audio: 'grammar.opus',
        curriculum_sort_path: [1, 1, 2],
      },
      {
        item_id: 1,
        is_vocabulary: 1,
        audio: 'one.opus',
        curriculum_sort_path: [1, 1, 1],
      },
    ]);
    mocks.pronunciationMemberships = [
      { pronunciation_group_id: 1, item_id: 3 },
      { pronunciation_group_id: 2, item_id: 1 },
    ];

    const deck = await UserItem.getPronunciationPracticeDeck('u1');

    expect(deck.map((item) => item.item_id)).toEqual([3, 1, 2]);
  });

  it('records a correct first answer and schedules the opposite direction at zero', () => {
    mocks.getNextAt.mockReturnValue('2026-03-04T09:02:00.000Z');
    const updated = UserItem.applyPracticeProgress(
      {
        progress_cz_to_en: 0,
        progress_en_to_cz: 0,
        progress_history: [],
        started_at: '1970-01-01T00:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      } as any,
      'czToEn',
      'correct',
      '2026-03-04T09:00:00.000Z',
    );

    expect(updated).toMatchObject({
      progress_cz_to_en: 1,
      progress_en_to_cz: 0,
      started_at: '2026-03-04T09:00:00.000Z',
      next_at_cz_to_en: '2026-03-04T09:02:00.000Z',
      next_at_en_to_cz: '2026-03-04T09:02:00.000Z',
    });
    expect(updated.progress_history).toEqual([
      expect.objectContaining({ direction: 'czToEn', outcome: 'correct', progress: 1 }),
    ]);
  });

  it('records an incorrect answer and resets only the displayed direction', () => {
    mocks.getNextAt.mockReturnValue('2026-03-04T09:02:00.000Z');
    const updated = UserItem.applyPracticeProgress(
      {
        progress_cz_to_en: 4,
        progress_en_to_cz: 2,
        progress_history: [],
        started_at: '2026-03-01T00:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '2026-03-02T00:00:00.000Z',
      } as any,
      'enToCz',
      'incorrect',
      '2026-03-04T09:00:00.000Z',
    );

    expect(updated.progress_cz_to_en).toBe(4);
    expect(updated.progress_en_to_cz).toBe(0);
    expect(updated.mastered_at_en_to_cz).toBe('1970-01-01T00:00:00.000Z');
    expect(updated.progress_history).toEqual([
      expect.objectContaining({ direction: 'enToCz', outcome: 'incorrect', progress: 0 }),
    ]);
  });

  it('schedules the opposite direction without history on a first incorrect answer', () => {
    mocks.getNextAt.mockReturnValue('2026-03-04T09:02:00.000Z');
    const updated = UserItem.applyPracticeProgress(
      {
        progress_cz_to_en: 4,
        progress_en_to_cz: 2,
        progress_history: [],
        started_at: '1970-01-01T00:00:00.000Z',
        mastered_at_cz_to_en: '2026-03-02T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      } as any,
      'enToCz',
      'incorrect',
      '2026-03-04T09:00:00.000Z',
    );

    expect(updated).toMatchObject({
      progress_cz_to_en: 0,
      progress_en_to_cz: 0,
      mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
      mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      next_at_cz_to_en: '2026-03-04T09:02:00.000Z',
      next_at_en_to_cz: '2026-03-04T09:02:00.000Z',
    });
    expect(updated.progress_history).toEqual([
      expect.objectContaining({ direction: 'enToCz', outcome: 'incorrect', progress: 0 }),
    ]);
  });

  it('skip preserves progress, masters the selected direction, and clears its schedule', () => {
    mocks.getNextAt.mockReturnValue('2026-03-04T09:02:00.000Z');
    const updated = UserItem.applyPracticeProgress(
      {
        progress_cz_to_en: 2,
        progress_en_to_cz: 0,
        progress_history: [],
        started_at: '1970-01-01T00:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      } as any,
      'czToEn',
      'skip',
      '2026-03-04T09:00:00.000Z',
    );

    expect(updated.progress_cz_to_en).toBe(2);
    expect(updated.progress_en_to_cz).toBe(0);
    expect(updated.next_at_cz_to_en).toBe('1970-01-01T00:00:00.000Z');
    expect(updated.next_at_en_to_cz).toBe('2026-03-04T09:02:00.000Z');
    expect(updated.mastered_at_cz_to_en).toBe('2026-03-04T09:00:00.000Z');
    expect(updated.mastered_at_en_to_cz).toBe('1970-01-01T00:00:00.000Z');
    expect(updated.progress_history).toEqual([
      expect.objectContaining({ direction: 'czToEn', outcome: 'skip', progress: 2 }),
    ]);
  });

  it('masters a direction naturally when a correct answer reaches the SRS limit', () => {
    const updated = UserItem.applyPracticeProgress(
      {
        progress_cz_to_en: 2,
        progress_en_to_cz: 1,
        progress_history: [],
        started_at: '2026-03-01T00:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '2026-03-02T00:00:00.000Z',
      } as any,
      'czToEn',
      'correct',
      '2026-03-04T09:00:00.000Z',
    );

    expect(updated.progress_cz_to_en).toBe(3);
    expect(updated.progress_en_to_cz).toBe(1);
    expect(updated.mastered_at_cz_to_en).toBe('2026-03-04T09:00:00.000Z');
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

  it('returns a full EN to CZ due deck before considering CZ to EN or new items', async () => {
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

  it('replaces a partial EN to CZ deck with due and new CZ to EN items', async () => {
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

    const deck = await UserItem.getPracticeDeck('u1', 4);

    expect(deck.map((item) => item.item_id)).toEqual([2, 3]);
    expect(mocks.indexedLimit.mock.calls.map(([limit]) => limit)).toEqual([4, 4, 3]);
    expect(mocks.indexedBetween).toHaveBeenNthCalledWith(
      3,
      ['u1', 1, '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      ['u1', 1, '1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      true,
      true,
    );
    const newVocabularyFilter = mocks.indexedFilter.mock.calls[2][0] as (item: any) => boolean;
    expect(newVocabularyFilter({
      started_at: '1970-01-01T00:00:00.000Z',
    })).toBe(true);
  });

  it('returns a new-only CZ to EN deck instead of a partial EN to CZ deck', async () => {
    mocks.indexedToArray
      .mockResolvedValueOnce([
        {
          item_id: 1,
          progress: 1,
          next_at: '2026-01-01T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          item_id: 3,
          progress: 0,
          next_at: '1970-01-01T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
        },
      ]);

    const deck = await UserItem.getPracticeDeck('u1', 3);

    expect(deck.map((item) => item.item_id)).toEqual([3]);
    expect(mocks.indexedLimit.mock.calls.map(([limit]) => limit)).toEqual([3, 3, 3]);
  });

  it('shortens the alternative deck at the first item from an unstarted training block', async () => {
    mocks.indexedToArray
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ item_id: 1, progress: 2 }])
      .mockResolvedValueOnce([
        {
          item_id: 2,
          block_id: 20,
          grammar_chunk_id: 7,
          progress: 0,
        },
        {
          item_id: 3,
          block_id: 30,
          grammar_chunk_id: 0,
          progress: 0,
        },
        {
          item_id: 4,
          block_id: 40,
          grammar_chunk_id: 9,
          progress: 0,
        },
      ]);
    mocks.userBlockGet
      .mockResolvedValueOnce({ block_id: 20, requires_initial_training: false })
      .mockResolvedValueOnce({
        block_id: 30,
        requires_initial_training: true,
        started_at: '1970-01-01T00:00:00.000Z',
      });

    const deck = await UserItem.getPracticeDeck('u1', 5);

    expect(deck.map((item) => item.item_id)).toEqual([1, 2, 3]);
    expect(deck.at(-1)).toMatchObject({
      item_id: 3,
      is_initial_training_trigger: true,
    });
    expect(mocks.userBlockGet.mock.calls).toEqual([[['u1', 20]], [['u1', 30]]]);
  });

  it('restores a partial EN to CZ deck when CZ to EN and new alternatives are empty', async () => {
    mocks.indexedToArray
      .mockResolvedValueOnce([
        {
          item_id: 1,
          progress: 1,
          next_at: '2026-01-01T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const deck = await UserItem.getPracticeDeck('u1', 3);

    expect(deck.map((item) => item.item_id)).toEqual([1]);
  });

  it('uses any CZ to EN grammar deck instead of a partial EN to CZ deck', async () => {
    mocks.masteredBlockToArray.mockResolvedValueOnce([
      {
        block_id: 10,
        is_vocabulary: false,
        mastered_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    mocks.indexedToArray
      .mockResolvedValueOnce([{ item_id: 1, block_id: 10, progress: 1 }])
      .mockResolvedValueOnce([{ item_id: 2, block_id: 10, progress: 2 }]);

    const deck = await UserItem.getPracticeDeck('u1', 3);

    expect(deck.map((item) => item.item_id)).toEqual([2]);
    expect(mocks.indexedToArray).toHaveBeenCalledTimes(3);
  });

  it('restores a partial EN to CZ grammar deck when no CZ to EN items exist', async () => {
    mocks.masteredBlockToArray.mockResolvedValueOnce([
      {
        block_id: 10,
        is_vocabulary: false,
        mastered_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    mocks.indexedToArray
      .mockResolvedValueOnce([{ item_id: 1, block_id: 10, progress: 1 }])
      .mockResolvedValueOnce([]);

    const deck = await UserItem.getPracticeDeck('u1', 3);

    expect(deck.map((item) => item.item_id)).toEqual([1]);
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
        is_practice_item: true,
        mastered_at: '2026-06-20T12:00:00.000Z',
      },
    ]);
    mocks.indexedToArray.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const deck = await UserItem.getPracticeDeck('u1', 10);

    expect(deck).toEqual([]);
    expect(mocks.indexedBetween).toHaveBeenNthCalledWith(
      1,
      ['u1', 1, expect.anything(), '1970-01-01T00:00:00.000Z', expect.anything()],
      ['u1', 1, '2026-06-24T12:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      true,
      false,
    );

    const grammarFilter = mocks.indexedFilter.mock.calls[1][0] as (item: any) => boolean;
    expect(grammarFilter({
      block_id: 10,
      started_at: '2026-01-01T00:00:00.000Z',
      mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
      next_at_cz_to_en: '2026-06-24T11:00:00.000Z',
    })).toBe(true);
    expect(grammarFilter({
      block_id: 11,
      started_at: '2026-01-01T00:00:00.000Z',
      mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
      next_at_cz_to_en: '2026-06-24T11:00:00.000Z',
    })).toBe(true);
    expect(grammarFilter({
      block_id: 10,
      started_at: '2026-01-01T00:00:00.000Z',
      mastered_at_cz_to_en: '2026-06-20T12:00:00.000Z',
      next_at_cz_to_en: '2026-06-24T11:00:00.000Z',
    })).toBe(false);
    expect(grammarFilter({
      block_id: 10,
      started_at: '2026-01-01T00:00:00.000Z',
      mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
      next_at_cz_to_en: '1970-01-01T00:00:00.000Z',
    })).toBe(false);
    expect(grammarFilter({
      block_id: 10,
      started_at: '2026-01-01T00:00:00.000Z',
      mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
      next_at_cz_to_en: '2026-06-24T12:00:00.000Z',
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

  it('saveInitialTrainingBlockCompletion does not downgrade skipped item progress', async () => {
    const dateTime = '2026-03-06T12:00:00.000Z';
    mocks.blockEqualsToArray.mockResolvedValue([
      {
        item_id: 1,
        sort_order: 1,
        progress_cz_to_en: 101,
        progress_en_to_cz: 101,
        progress_history: [],
        started_at: '2026-03-01T00:00:00.000Z',
        mastered_at_cz_to_en: '2026-03-06T11:00:00.000Z',
        mastered_at_en_to_cz: '2026-03-06T11:00:00.000Z',
      },
      {
        item_id: 2,
        sort_order: 2,
        progress_cz_to_en: 0,
        progress_en_to_cz: 0,
        progress_history: [],
        started_at: '1970-01-01T00:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      },
    ]);

    await UserItem.saveInitialTrainingBlockCompletion('u1', 3, dateTime);

    expect(mocks.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        item_id: 1,
        progress_cz_to_en: 101,
        progress_en_to_cz: 101,
        started_at: '2026-03-01T00:00:00.000Z',
        updated_at: dateTime,
        mastered_at_cz_to_en: '2026-03-06T11:00:00.000Z',
        mastered_at_en_to_cz: '2026-03-06T11:00:00.000Z',
      }),
      expect.objectContaining({
        item_id: 2,
        progress_cz_to_en: 2,
        progress_en_to_cz: 2,
        started_at: dateTime,
        updated_at: dateTime,
      }),
    ]);
    expect(mocks.getNextAt).toHaveBeenCalledWith(101, 'czToEn');
    expect(mocks.getNextAt).toHaveBeenCalledWith(101, 'enToCz');
    expect(mocks.getNextAt).toHaveBeenCalledWith(2, 'czToEn');
    expect(mocks.getNextAt).toHaveBeenCalledWith(2, 'enToCz');
  });

  it('getReadyPracticeState counts ready started and not-started vocabulary', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.userEqualsToArray.mockResolvedValueOnce([
      {
        item_id: 1,
        is_practice_item: 1,
        started_at: '2026-01-01T00:00:00.000Z',
        next_at_cz_to_en: '2026-06-20T00:00:00.000Z',
        next_at_en_to_cz: '2026-06-20T00:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      },
      {
        item_id: 2,
        is_practice_item: 1,
        started_at: '1970-01-01T00:00:00.000Z',
      },
    ]);

    await expect(UserItem.getReadyPracticeState('u1')).resolves.toEqual({
      readyCount: 3,
      schedule: [],
    });

  });

  it('getReadyPracticeState caps availability above the badge cap', async () => {
    mocks.userEqualsToArray.mockResolvedValueOnce(Array.from({ length: 100 }, (_, index) => ({
      item_id: index + 1,
      is_practice_item: 1,
      started_at: '1970-01-01T00:00:00.000Z',
    })));

    await expect(UserItem.getReadyPracticeState('u1')).resolves.toEqual({
      readyCount: 100,
      schedule: [],
    });

    expect(mocks.userEqualsToArray).toHaveBeenCalledTimes(1);
  });

  it('getReadyPracticeState schedules future vocabulary when none is ready', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.userEqualsToArray.mockResolvedValueOnce([
      {
        item_id: 1,
        is_practice_item: 1,
        started_at: '2026-01-01T00:00:00.000Z',
        next_at_cz_to_en: '2026-06-24T12:00:10.000Z',
        next_at_en_to_cz: '2026-06-24T12:00:10.800Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      },
    ]);

    await expect(UserItem.getReadyPracticeState('u1')).resolves.toEqual({
      readyCount: 0,
      schedule: [{ date: '2026-06-24T12:00:10.800Z', count: 2 }],
    });

  });

  it('getReadyPracticeState ignores mastered vocabulary candidates', async () => {
    mocks.userEqualsToArray.mockResolvedValueOnce([
      {
        item_id: 1,
        is_practice_item: 1,
        started_at: '2026-01-01T00:00:00.000Z',
        next_at_cz_to_en: '2026-01-01T00:00:00.000Z',
        next_at_en_to_cz: '2026-01-01T00:00:00.000Z',
        mastered_at_cz_to_en: '2026-06-24T11:00:00.000Z',
        mastered_at_en_to_cz: '2026-06-24T11:00:00.000Z',
      },
    ]);

    await expect(UserItem.getReadyPracticeState('u1')).resolves.toEqual({
      readyCount: 0,
      schedule: [],
    });
  });

  it('simulates an exact fixture and adds the first configured audio items', async () => {
    const items = [
      { item_id: 2, audio: null, has_pronunciation_practice: 1 },
      { item_id: 4, audio: 'four.opus', has_pronunciation_practice: 0 },
      { item_id: 9, audio: ' ', has_pronunciation_practice: 0 },
      { item_id: 10, audio: 'ten.opus', has_pronunciation_practice: 0 },
    ] as any[];
    mocks.simulationToArray.mockResolvedValue(items);

    await expect(UserItem.getSimulationCandidates('u1')).resolves.toBe(items);
    expect(mocks.itemIdLimit).toHaveBeenCalledWith(4);

    await expect(
      UserItem.simulateData(items as any, '2026-06-10T10:00:00.000Z'),
    ).resolves.toBe(4);

    const simulated = mocks.bulkPut.mock.calls[0][0] as any[];
    expect(simulated.map((item) => item.item_id)).toEqual([2, 4, 9, 10]);
    expect(simulated.map((item) => item.has_pronunciation_practice)).toEqual([1, 1, 0, 1]);
    expect(simulated[0]).toMatchObject({
      progress_cz_to_en: 1,
      progress_en_to_cz: 1,
      started_at: '2026-06-10T10:00:00.000Z',
      updated_at: '2026-06-10T10:00:00.000Z',
      next_at_cz_to_en: '2026-06-10T10:00:00.000Z',
      next_at_en_to_cz: '2026-06-10T10:00:00.000Z',
      mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
      mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
    });
    expect(simulated[0].progress_history).toEqual([
      {
        progress: 1,
        created_at: '2026-06-10T10:00:00.000Z',
        direction: 'czToEn',
        outcome: 'correct',
      },
      {
        progress: 1,
        created_at: '2026-06-10T10:00:00.000Z',
        direction: 'enToCz',
        outcome: 'correct',
      },
    ]);
  });

  it('allows any number of available items and audio candidates up to configured maxima', async () => {
    mocks.simulationToArray.mockResolvedValueOnce([]);
    await expect(UserItem.getSimulationCandidates('u1')).resolves.toEqual([]);

    const availableItems = [
      { item_id: 1, audio: 'one.opus' },
      { item_id: 2, audio: null },
    ];
    mocks.simulationToArray.mockResolvedValueOnce(availableItems);
    await expect(UserItem.getSimulationCandidates('u1')).resolves.toBe(availableItems);
  });

  it('syncFromRemote pushes local items, applies pull, and marks sync', async () => {
    mocks.updatedBetweenToArray.mockResolvedValue([
      {
        user_id: 'u1',
        item_id: 1,
        progress_history: [
          {
            progress: 1,
            direction: 'czToEn',
            outcome: 'correct',
            created_at: '2026-03-03T09:59:00.000Z',
          },
        ],
        progress_cz_to_en: 1,
        progress_en_to_cz: 1,
        has_pronunciation_practice: 1,
        started_at: '1970-01-01T00:00:00.000Z',
        updated_at: '2026-03-03T10:00:00.000Z',
        next_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        next_at_en_to_cz: '1970-01-01T00:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
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
          has_pronunciation_practice: true,
          sort_order: 2,
          curriculum_sort_path: [1, 2, 2],
          note_id: null,
          block_id: null,
          grammar_chunk_id: null,
          progress_cz_to_en: 0,
          progress_en_to_cz: 0,
          progress_history: [],
          started_at: null,
          updated_at: '2026-03-04T00:00:00.000Z',
          next_at_cz_to_en: null,
          next_at_en_to_cz: null,
          mastered_at_cz_to_en: null,
          mastered_at_en_to_cz: null,
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
          progress_history: [
            {
              progress: 1,
              direction: 'czToEn',
              outcome: 'correct',
              created_at: '2026-03-03T09:59:00.000Z',
            },
          ],
          progress_cz_to_en: 1,
          progress_en_to_cz: 1,
          has_pronunciation_practice: true,
          updated_at: '2026-03-03T10:00:00.000Z',
          started_at: null,
          next_at_cz_to_en: null,
          next_at_en_to_cz: null,
          mastered_at_cz_to_en: null,
          mastered_at_en_to_cz: null,
        }),
      ],
    });
    expect(mocks.bulkDelete).toHaveBeenCalledWith([['u1', 3]]);
    expect(mocks.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        item_id: 2,
        is_vocabulary: 1,
        is_practice_item: 0,
        has_pronunciation_practice: 1,
        curriculum_sort_path: [1, 2, 2],
        block_id: 0,
        grammar_chunk_id: 0,
        started_at: '1970-01-01T00:00:00.000Z',
        next_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        next_at_en_to_cz: '1970-01-01T00:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      }),
    ]);
    expect(mocks.markAsSynced).toHaveBeenCalledWith('user_items', '2026-03-04T00:00:00.000Z', 'u1');
  });
});
