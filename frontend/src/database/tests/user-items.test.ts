import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  bulkPut: vi.fn(),
  bulkUpdate: vi.fn(),
  bulkDelete: vi.fn(),
  equalsDelete: vi.fn(),
  blockEqualsToArray: vi.fn(),
  itemIdsToArray: vi.fn(),
  topicEqualsToArray: vi.fn(),
  topicModify: vi.fn(),
  itemIdModify: vi.fn(),
  itemIdBetween: vi.fn(),
  itemIdLimit: vi.fn(),
  simulationToArray: vi.fn(),
  userEqualsToArray: vi.fn(),
  indexedBetween: vi.fn(),
  indexedFilter: vi.fn(),
  indexedLimit: vi.fn(),
  indexedToArray: vi.fn(),
  startedGrammarCandidates: [] as any[],
  updatedBetweenToArray: vi.fn(),
  transaction: vi.fn(),
  rpc: vi.fn(),
  getNextAt: vi.fn(),
  getSyncTimestamps: vi.fn(),
  markAsSynced: vi.fn(),
  userItemGet: vi.fn(),
  userItemUpdate: vi.fn(),
  blockGet: vi.fn(),
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
      afterNewBlockProgress: 2,
      simulationItemProgress: 1,
      simulationItemCount: 4,
      simulationPronunciationItemCount: 2,
    },
    practice: {
      initialTrainingBatchSize: 8,
      reviewStarSize: 20,
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    blocks: {
      get: (...args: unknown[]) => mocks.blockGet(...args),
    },
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
            anyOf: () => ({
              toArray: (...args: unknown[]) => mocks.itemIdsToArray(...args),
            }),
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
            '[user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]' ||
          field ===
            '[user_id+next_at_en_to_cz+mastered_at_en_to_cz+curriculum_sort_path]'
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
        if (field === '[user_id+is_vocabulary+started_at]') {
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
                  const predicate = filterArgs[0] as (item: any) => boolean;
                  return {
                    toArray: (...toArrayArgs: unknown[]) => mocks.indexedToArray(...toArrayArgs),
                    first: async () => mocks.startedGrammarCandidates.find(predicate),
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
        if (field === '[user_id+topic_id]') {
          return {
            equals: () => ({
              filter: (predicate: (item: any) => boolean) => ({
                toArray: async (...args: unknown[]) =>
                  ((await mocks.topicEqualsToArray(...args)) ?? []).filter(predicate),
              }),
              modify: (...args: unknown[]) => mocks.topicModify(...args),
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

function initialItem(itemId: number, overrides: Record<string, unknown> = {}) {
  return {
    user_id: 'u1',
    item_id: itemId,
    lesson_id: 1,
    is_vocabulary: 1,
    block_id: 0,
    grammar_chunk_id: 0,
    started_at: '1970-01-01T00:00:00.000Z',
    deleted_at: '1970-01-01T00:00:00.000Z',
    curriculum_sort_path: [1, 1, itemId],
    ...overrides,
  } as any;
}

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
    mocks.startedGrammarCandidates = [];
    vi.useRealTimers();

    mocks.getNextAt.mockReturnValue('2026-03-05T00:00:00.000Z');
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2026-03-03T00:00:00.000Z',
      newSyncedAt: '2026-03-04T00:00:00.000Z',
    });
    mocks.equalsDelete.mockResolvedValue(0);
    mocks.userEqualsToArray.mockResolvedValue([]);
    mocks.blockEqualsToArray.mockResolvedValue([]);
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
    mocks.blockGet.mockResolvedValue({ id: 7 });
    mocks.bulkUpdate.mockResolvedValue(1);
    mocks.pronunciationCount.mockResolvedValue(0);
    mocks.pronunciationToArray.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([
    ['no items', [], false],
    ['an item without a grammar chunk', [{ grammar_chunk_id: 0 }], false],
    [
      'a reset started grammar item',
      [
        {
          grammar_chunk_id: 7,
          started_at: '2026-03-01T00:00:00.000Z',
          progress_cz_to_en: 0,
          progress_en_to_cz: 0,
        },
      ],
      true,
    ],
  ])('hasStartedGrammar returns the expected result for %s', async (_name, items, expected) => {
    mocks.startedGrammarCandidates = items as any[];

    await expect(UserItem.hasStartedGrammar('u1')).resolves.toBe(expected);
  });

  it('savePracticeDeck updates only practice progress fields', async () => {
    mocks.userItemGet.mockResolvedValue({
      deleted_at: '1970-01-01T00:00:00.000Z',
      mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
      mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
    });
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
        practice_direction: 'czToEn',
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
    mocks.userItemGet.mockResolvedValue({
      deleted_at: '1970-01-01T00:00:00.000Z',
      mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
      mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
    });
    await UserItem.savePracticeDeck([
      {
        user_id: 'u1',
        item_id: 1,
        progress_cz_to_en: 2,
        has_pronunciation_practice: 0,
        practice_direction: 'czToEn',
      } as any,
    ]);

    const [{ changes }] = mocks.bulkUpdate.mock.calls[0][0];
    expect(changes).not.toHaveProperty('has_pronunciation_practice');
    expect(changes).not.toHaveProperty('czech');
    expect(changes).not.toHaveProperty('audio');
  });

  it('silently skips missing, deleted, and direction-mastered practice items', async () => {
    const nullDate = '1970-01-01T00:00:00.000Z';
    mocks.userItemGet
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        deleted_at: '2026-08-10T10:00:00.000Z',
        mastered_at_cz_to_en: nullDate,
        mastered_at_en_to_cz: nullDate,
      })
      .mockResolvedValueOnce({
        deleted_at: nullDate,
        mastered_at_cz_to_en: '2026-08-10T10:00:00.000Z',
        mastered_at_en_to_cz: nullDate,
      })
      .mockResolvedValueOnce({
        deleted_at: nullDate,
        mastered_at_cz_to_en: nullDate,
        mastered_at_en_to_cz: '2026-08-10T10:00:00.000Z',
      })
      .mockResolvedValueOnce({
        deleted_at: nullDate,
        mastered_at_cz_to_en: nullDate,
        mastered_at_en_to_cz: nullDate,
      });

    const makeUpdate = (itemId: number) =>
      ({
        user_id: 'u1',
        item_id: itemId,
        practice_direction: 'czToEn',
        progress_cz_to_en: 2,
        progress_en_to_cz: 1,
        progress_history: [],
        started_at: '2026-08-10T10:00:00.000Z',
        updated_at: '2026-08-10T10:00:00.000Z',
        next_at_cz_to_en: '2026-08-11T10:00:00.000Z',
        next_at_en_to_cz: '2026-08-11T10:00:00.000Z',
        mastered_at_cz_to_en: nullDate,
        mastered_at_en_to_cz: nullDate,
      }) as any;

    await UserItem.savePracticeDeck([1, 2, 3, 4, 5].map(makeUpdate));

    expect(mocks.bulkUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.bulkUpdate.mock.calls[0][0].map((update: any) => update.key)).toEqual([
      ['u1', 4],
      ['u1', 5],
    ]);
  });

  it('toggles pronunciation selection without changing progress fields', async () => {
    mocks.userItemGet.mockResolvedValue({
      item_id: 7,
      is_vocabulary: 1,
      audio: 'seven.opus',
      has_pronunciation_practice: 0,
      deleted_at: '1970-01-01T00:00:00.000Z',
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
        deleted_at: '1970-01-01T00:00:00.000Z',
      })
      .mockResolvedValueOnce({
        item_id: 9,
        is_vocabulary: 1,
        audio: null,
        has_pronunciation_practice: 0,
        deleted_at: '1970-01-01T00:00:00.000Z',
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

  it('silently skips missing and deleted pronunciation items but allows mastered items', async () => {
    const nullDate = '1970-01-01T00:00:00.000Z';
    mocks.userItemGet
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        item_id: 10,
        audio: 'ten.opus',
        has_pronunciation_practice: 0,
        deleted_at: '2026-08-10T10:00:00.000Z',
      })
      .mockResolvedValueOnce({
        item_id: 11,
        audio: 'eleven.opus',
        has_pronunciation_practice: 0,
        deleted_at: nullDate,
        mastered_at_cz_to_en: '2026-08-10T10:00:00.000Z',
        mastered_at_en_to_cz: '2026-08-10T10:00:00.000Z',
      });

    await expect(UserItem.togglePronunciationPractice('u1', 9)).resolves.toBeNull();
    await expect(UserItem.togglePronunciationPractice('u1', 10)).resolves.toBeNull();
    await expect(UserItem.togglePronunciationPractice('u1', 11)).resolves.toBe(true);

    expect(mocks.userItemUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.userItemUpdate).toHaveBeenCalledWith(
      ['u1', 11],
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
      { oppositeDirectionNextAt: '2026-03-04T09:00:00.000Z' },
    );

    expect(updated).toMatchObject({
      progress_cz_to_en: 1,
      progress_en_to_cz: 0,
      started_at: '2026-03-04T09:00:00.000Z',
      next_at_cz_to_en: '2026-03-04T09:02:00.000Z',
      next_at_en_to_cz: '2026-03-04T09:00:00.000Z',
    });
    expect(updated.progress_history).toEqual([
      expect.objectContaining({ direction: 'czToEn', outcome: 'correct', progress: 1 }),
    ]);
  });

  it('advances the opposite direction normally in the second phase', () => {
    mocks.getNextAt.mockReturnValue('2026-03-04T09:02:00.000Z');
    const updated = UserItem.applyPracticeProgress(
      {
        progress_cz_to_en: 1,
        progress_en_to_cz: 0,
        progress_history: [],
        started_at: '2026-03-04T09:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      } as any,
      'enToCz',
      'correct',
      '2026-03-04T09:01:00.000Z',
    );

    expect(updated).toMatchObject({
      progress_en_to_cz: 1,
      next_at_en_to_cz: '2026-03-04T09:02:00.000Z',
    });
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

  it('getByUserId returns all items for user stats', async () => {
    mocks.userEqualsToArray.mockResolvedValueOnce([
      { item_id: 1 },
      { item_id: 2 },
      { item_id: 3 },
    ]);

    const result = await UserItem.getByUserId('u1');

    expect(result.map((item) => item.item_id)).toEqual([1, 2, 3]);
  });

  it('returns a full CZ to EN due deck before considering EN to CZ', async () => {
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

    const deck = await UserItem.getReviewDeck('u1', 2);

    expect(deck.map((item) => item.item_id)).toEqual([2, 3]);
    expect(deck.every((item) => item.practice_direction === 'czToEn')).toBe(true);
    expect(mocks.indexedToArray).toHaveBeenCalledTimes(1);
  });

  it('returns an empty deck when neither direction is complete', async () => {
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
      ]);

    const deck = await UserItem.getReviewDeck('u1', 4);

    expect(deck).toEqual([]);
    expect(mocks.indexedLimit.mock.calls.map(([limit]) => limit)).toEqual([4, 4]);
  });

  it('never adds a new-only CZ to EN item to review', async () => {
    mocks.indexedToArray
      .mockResolvedValueOnce([
        {
          item_id: 1,
          progress: 1,
          next_at: '2026-01-01T00:00:00.000Z',
          mastered_at: '1970-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([]);

    const deck = await UserItem.getReviewDeck('u1', 3);

    expect(deck).toEqual([]);
    expect(mocks.indexedLimit.mock.calls.map(([limit]) => limit)).toEqual([3, 3]);
  });

  it('does not inspect blocks while selecting a due-only review deck', async () => {
    mocks.indexedToArray
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ item_id: 1, progress: 2 }]);
    const deck = await UserItem.getReviewDeck('u1', 5);

    expect(deck).toEqual([]);
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
      .mockResolvedValueOnce([]);

    const deck = await UserItem.getReviewDeck('u1', 3);

    expect(deck).toEqual([]);
  });

  it('uses a full EN to CZ deck when CZ to EN is partial', async () => {
    mocks.indexedToArray
      .mockResolvedValueOnce([{ item_id: 1, block_id: 10, progress: 1 }])
      .mockResolvedValueOnce([
        { item_id: 2, block_id: 10, progress: 2 },
        { item_id: 3, block_id: 10, progress: 2 },
        { item_id: 4, block_id: 10, progress: 2 },
      ]);

    const deck = await UserItem.getReviewDeck('u1', 3);

    expect(deck.map((item) => item.item_id)).toEqual([2, 3, 4]);
    expect(deck.every((item) => item.practice_direction === 'enToCz')).toBe(true);
    expect(mocks.indexedToArray).toHaveBeenCalledTimes(2);
  });

  it('restores a partial EN to CZ grammar deck when no CZ to EN items exist', async () => {
    mocks.indexedToArray
      .mockResolvedValueOnce([{ item_id: 1, block_id: 10, progress: 1 }])
      .mockResolvedValueOnce([]);

    const deck = await UserItem.getReviewDeck('u1', 3);

    expect(deck).toEqual([]);
  });

  it('returns an empty deck without querying when deckSize is not positive', async () => {
    await expect(UserItem.getReviewDeck('u1', 0)).resolves.toEqual([]);
    expect(mocks.indexedToArray).not.toHaveBeenCalled();
  });

  it('getReviewDeck excludes unscheduled items even from mastered grammar blocks', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.indexedToArray.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const deck = await UserItem.getReviewDeck('u1', 10);

    expect(deck).toEqual([]);
    expect(mocks.indexedBetween).toHaveBeenNthCalledWith(
      1,
      ['u1', expect.anything(), '1970-01-01T00:00:00.000Z', expect.anything()],
      ['u1', '2026-06-24T12:00:00.000Z', '1970-01-01T00:00:00.000Z', expect.anything()],
      true,
      false,
    );

    const grammarFilter = mocks.indexedFilter.mock.calls[0][0] as (item: any) => boolean;
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

  it('allows automatic vocabulary batches to cross lesson boundaries', async () => {
    mocks.userEqualsToArray.mockResolvedValue([
      initialItem(1, { curriculum_sort_path: [1, 1, 1] }),
      initialItem(2, { curriculum_sort_path: [1, 2, 1], lesson_id: 2 }),
      initialItem(3, { curriculum_sort_path: [1, 2, 2], is_vocabulary: 0, grammar_chunk_id: 4 }),
    ]);

    const selection = await UserItem.getNextInitialTrainingSelection('u1', 8);

    expect(selection?.blockId).toBeNull();
    expect(selection?.items.map((item) => item.item_id)).toEqual([1, 2]);
  });

  it('keeps automatic grammar batches within one lesson', async () => {
    mocks.userEqualsToArray.mockResolvedValue([
      initialItem(1, { is_vocabulary: 0, grammar_chunk_id: 1, curriculum_sort_path: [1, 1, 1] }),
      initialItem(2, { is_vocabulary: 0, grammar_chunk_id: 2, curriculum_sort_path: [1, 2, 1], lesson_id: 2 }),
    ]);

    const selection = await UserItem.getNextInitialTrainingSelection('u1', 8);

    expect(selection?.items.map((item) => item.item_id)).toEqual([1]);
  });

  it('limits an automatic batch while allowing multiple grammar chunks', async () => {
    mocks.userEqualsToArray.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) =>
        initialItem(index + 1, {
          is_vocabulary: 0,
          grammar_chunk_id: index + 1,
          curriculum_sort_path: [1, 1, index + 1],
        }),
      ),
    );

    const selection = await UserItem.getNextInitialTrainingSelection('u1', 8);

    expect(selection?.items).toHaveLength(8);
    expect(selection?.items.map((item) => item.grammar_chunk_id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('selects only unstarted members when an explicit block becomes available again', async () => {
    mocks.userEqualsToArray.mockResolvedValue([
      initialItem(1, { block_id: 7, curriculum_sort_path: [1, 1, 1], started_at: '2026-01-01' }),
      initialItem(2, { block_id: 7, curriculum_sort_path: [1, 1, 2] }),
      initialItem(3, { block_id: 7, curriculum_sort_path: [1, 1, 3] }),
      initialItem(4, { curriculum_sort_path: [1, 1, 4] }),
    ]);

    const selection = await UserItem.getNextInitialTrainingSelection('u1');

    expect(selection?.blockId).toBe(7);
    expect(selection?.items.map((item) => item.item_id)).toEqual([2, 3]);
  });

  it('ignores an explicit selection whose synchronized block metadata is missing', async () => {
    mocks.blockGet.mockResolvedValue(null);
    mocks.userEqualsToArray.mockResolvedValue([
      initialItem(1, { block_id: 7, curriculum_sort_path: [1, 1, 1] }),
    ]);

    await expect(UserItem.getNextInitialTrainingSelection('u1')).resolves.toBeNull();
  });

  it('getStartedByTopicId excludes unstarted items and preserves curriculum order', async () => {
    mocks.topicEqualsToArray.mockResolvedValue([
      {
        item_id: 2,
        started_at: '2026-08-02T00:00:00.000Z',
        curriculum_sort_path: [1, 1, 2],
      },
      {
        item_id: 3,
        started_at: '1970-01-01T00:00:00.000Z',
        curriculum_sort_path: [1, 1, 2],
      },
      {
        item_id: 1,
        started_at: '2026-08-01T00:00:00.000Z',
        curriculum_sort_path: [1, 1, 1],
      },
    ]);

    const result = await UserItem.getStartedByTopicId('u1', 4);

    expect(result.map((item) => item.item_id)).toEqual([1, 2]);
  });

  it('resetItemsByTopicId resets all items assigned to the topic', async () => {
    mocks.topicModify.mockResolvedValue(3);

    await expect(UserItem.resetItemsByTopicId('u1', 4)).resolves.toBe(3);
    expect(mocks.topicModify).toHaveBeenCalledOnce();
  });

  it('saveInitialTrainingCompletion does not downgrade skipped item progress', async () => {
    const dateTime = '2026-03-06T12:00:00.000Z';
    mocks.itemIdsToArray.mockResolvedValue([
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

    await UserItem.saveInitialTrainingCompletion('u1', [1, 2], dateTime);

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

  it('getReadyReviewState ignores not-started vocabulary', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.userEqualsToArray.mockResolvedValueOnce([
      ...Array.from({ length: 20 }, (_, index) => ({
        item_id: index + 1,
        started_at: '2026-01-01T00:00:00.000Z',
        next_at_cz_to_en: '2026-06-20T00:00:00.000Z',
        next_at_en_to_cz: '2026-06-20T00:00:00.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      })),
      { item_id: 21, started_at: '1970-01-01T00:00:00.000Z' },
    ]);

    await expect(UserItem.getReadyReviewState('u1')).resolves.toEqual({
      reviewReadyAt: '2026-06-24T12:00:00.000Z',
    });

  });

  it('getReadyReviewState caps availability at the badge cap', async () => {
    mocks.userEqualsToArray.mockResolvedValueOnce(Array.from({ length: 100 }, (_, index) => ({
      item_id: index + 1,
      started_at: '1970-01-01T00:00:00.000Z',
    })));

    await expect(UserItem.getReadyReviewState('u1')).resolves.toEqual({
      reviewReadyAt: null,
    });

    expect(mocks.userEqualsToArray).toHaveBeenCalledTimes(1);
  });

  it('getReadyReviewState keeps a future schedule when some practice is already ready', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.userEqualsToArray.mockResolvedValueOnce([
      {
        item_id: 1,
        started_at: '1970-01-01T00:00:00.000Z',
      },
      {
        item_id: 2,
        started_at: '1970-01-01T00:00:00.000Z',
      },
      {
        item_id: 3,
        started_at: '2026-01-01T00:00:00.000Z',
        next_at_cz_to_en: '2026-06-24T12:00:10.000Z',
        next_at_en_to_cz: '2026-06-24T12:00:10.800Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      },
    ]);

    await expect(UserItem.getReadyReviewState('u1')).resolves.toEqual({
      reviewReadyAt: null,
    });
  });

  it('returns the date when the twentieth item becomes ready', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    const readyItems = Array.from({ length: 19 }, (_, index) => ({
      item_id: index + 1,
      started_at: '2026-01-01T00:00:00.000Z',
      next_at_cz_to_en: '2026-06-20T00:00:00.000Z',
      next_at_en_to_cz: '2026-06-20T00:00:00.000Z',
      mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
      mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
    }));
    mocks.userEqualsToArray.mockResolvedValueOnce([
      ...readyItems,
      {
        item_id: 20,
        started_at: '2026-01-01T00:00:00.000Z',
        next_at_cz_to_en: '2026-06-24T12:00:20.000Z',
        next_at_en_to_cz: '2026-06-24T12:00:10.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      },
    ]);

    await expect(UserItem.getReadyReviewState('u1')).resolves.toEqual({
      reviewReadyAt: '2026-06-24T12:00:10.000Z',
    });
  });

  it('getReadyReviewState caps ready and scheduled practice together', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    const readyItems = Array.from({ length: 98 }, (_, index) => ({
      item_id: index + 1,
      started_at: '1970-01-01T00:00:00.000Z',
    }));
    mocks.userEqualsToArray.mockResolvedValueOnce([
      ...readyItems,
      {
        item_id: 99,
        started_at: '2026-01-01T00:00:00.000Z',
        next_at_cz_to_en: '2026-06-24T12:00:20.000Z',
        next_at_en_to_cz: '2026-06-24T12:00:10.000Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      },
    ]);

    await expect(UserItem.getReadyReviewState('u1')).resolves.toEqual({
      reviewReadyAt: null,
    });
  });

  it('getReadyReviewState schedules future vocabulary when none is ready', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    mocks.userEqualsToArray.mockResolvedValueOnce([
      {
        item_id: 1,
        started_at: '2026-01-01T00:00:00.000Z',
        next_at_cz_to_en: '2026-06-24T12:00:10.000Z',
        next_at_en_to_cz: '2026-06-24T12:00:10.800Z',
        mastered_at_cz_to_en: '1970-01-01T00:00:00.000Z',
        mastered_at_en_to_cz: '1970-01-01T00:00:00.000Z',
      },
    ]);

    await expect(UserItem.getReadyReviewState('u1')).resolves.toEqual({
      reviewReadyAt: null,
    });

  });

  it('getReadyReviewState ignores mastered vocabulary candidates', async () => {
    mocks.userEqualsToArray.mockResolvedValueOnce([
      {
        item_id: 1,
        started_at: '2026-01-01T00:00:00.000Z',
        next_at_cz_to_en: '2026-01-01T00:00:00.000Z',
        next_at_en_to_cz: '2026-01-01T00:00:00.000Z',
        mastered_at_cz_to_en: '2026-06-24T11:00:00.000Z',
        mastered_at_en_to_cz: '2026-06-24T11:00:00.000Z',
      },
    ]);

    await expect(UserItem.getReadyReviewState('u1')).resolves.toEqual({
      reviewReadyAt: null,
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
          has_pronunciation_practice: true,
          sort_order: 2,
          curriculum_sort_path: [1, 2, 2],
          note_id: null,
          block_id: 10,
          topic_id: 3,
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
        has_pronunciation_practice: 1,
        curriculum_sort_path: [1, 2, 2],
        block_id: 10,
        topic_id: 3,
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
