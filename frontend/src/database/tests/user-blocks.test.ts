import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  where: vi.fn(),
  equals: vi.fn(),
  filter: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  bulkDelete: vi.fn(),
  bulkPut: vi.fn(),
  toArray: vi.fn(),
  between: vi.fn(),
  transaction: vi.fn(),
  getSyncTimestamps: vi.fn(),
  markAsSynced: vi.fn(),
  rpc: vi.fn(),
  reportInfo: vi.fn(),
  getStartedBlocksIds: vi.fn(),
  getPracticeItems: vi.fn(),
  getMasteredGrammarBlockIds: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementDate: '9999-12-31T23:59:59+00:00',
      nullReplacementNumber: -1,
    },
    progress: {
      simulationProgress: 2,
      simulationCount: 10,
      simulationMasteredTrainingBlockCount: 3,
    },
    practice: {
      readyPracticeScheduleGroupWindowMs: 1000,
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    metadata: {},
    transaction: (...args: unknown[]) => mocks.transaction(...args),
    user_blocks: {
      where: (...args: unknown[]) => mocks.where(...args),
      get: (...args: unknown[]) => mocks.get(...args),
      bulkDelete: (...args: unknown[]) => mocks.bulkDelete(...args),
      bulkPut: (...args: unknown[]) => mocks.bulkPut(...args),
      update: (...args: unknown[]) => mocks.update(...args),
    },
    user_items: {
      where: (...args: unknown[]) => mocks.where(...args),
    },
  },
}));

vi.mock('@/database/models/metadata', () => ({
  default: {
    markAsSynced: (...args: unknown[]) => mocks.markAsSynced(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getStartedBlocksIds: (...args: unknown[]) => mocks.getStartedBlocksIds(...args),
    getByUserId: (...args: unknown[]) => mocks.getPracticeItems(...args),
    getMasteredGrammarBlockIds: (...args: unknown[]) => mocks.getMasteredGrammarBlockIds(...args),
    areAllVocabularyItemsStartedForLesson: vi.fn(),
  },
}));

vi.mock('@/database/utils/sync-generic.utils', async () => {
  const actual = await vi.importActual<any>('@/database/utils/sync-generic.utils');
  return {
    ...actual,
    getSyncTimestamps: (...args: unknown[]) => mocks.getSyncTimestamps(...args),
  };
});

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
  },
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportInfo: (...args: unknown[]) => mocks.reportInfo(...args),
}));

import UserBlock from '@/database/models/user-blocks';

describe('UserBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.toArray.mockResolvedValue([]);
    mocks.delete.mockResolvedValue(undefined);
    mocks.get.mockResolvedValue(undefined);
    mocks.bulkDelete.mockResolvedValue(undefined);
    mocks.bulkPut.mockResolvedValue(undefined);
    mocks.update.mockResolvedValue(1);
    mocks.equals.mockReturnValue({
      toArray: (...args: unknown[]) => mocks.toArray(...args),
      delete: (...args: unknown[]) => mocks.delete(...args),
      filter: (...args: unknown[]) => mocks.filter(...args),
    });
    mocks.filter.mockReturnValue({
      toArray: (...args: unknown[]) => mocks.toArray(...args),
    });
    mocks.between.mockReturnValue({
      toArray: (...args: unknown[]) => mocks.toArray(...args),
      filter: (predicate: (item: any) => boolean) => ({
        toArray: async () => (await mocks.toArray()).filter(predicate),
      }),
    });
    mocks.where.mockReturnValue({
      equals: (...args: unknown[]) => mocks.equals(...args),
      between: (...args: unknown[]) => mocks.between(...args),
    });
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2026-03-03T00:00:00.000Z',
      newSyncedAt: '2026-03-04T00:00:00.000Z',
    });
    mocks.markAsSynced.mockResolvedValue(undefined);
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    mocks.getStartedBlocksIds.mockResolvedValue([]);
    mocks.getPracticeItems.mockResolvedValue([]);
    mocks.getMasteredGrammarBlockIds.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getByUserId returns blocks sorted by sort_order', async () => {
    mocks.toArray.mockResolvedValueOnce([
      { user_id: 'u1', block_id: 2, sort_order: 20, name: 'B' },
      { user_id: 'u1', block_id: 1, sort_order: 10, name: 'A' },
    ]);

    const result = await UserBlock.getByUserId('u1');

    expect(mocks.where).toHaveBeenCalledWith('user_id');
    expect(mocks.equals).toHaveBeenCalledWith('u1');
    expect(result.map((block) => block.block_id)).toEqual([1, 2]);
  });

  it('getStartedTopicsByUserId returns started visible grammar blocks and vocabulary blocks with started items', async () => {
    mocks.toArray.mockResolvedValueOnce([
      {
        user_id: 'u1',
        block_id: 4,
        sort_order: 40,
        name: 'Locked vocabulary',
        is_removed_from_practice: false,
        show_in_topics: true,
        progress: 0,
        started_at: '9999-12-31T23:59:59+00:00',
      },
      {
        user_id: 'u1',
        block_id: 3,
        sort_order: 30,
        name: 'Started vocabulary',
        is_removed_from_practice: false,
        show_in_topics: true,
        progress: 0,
        started_at: '9999-12-31T23:59:59+00:00',
      },
      {
        user_id: 'u1',
        block_id: 2,
        sort_order: 20,
        name: 'Locked grammar',
        is_removed_from_practice: false,
        show_in_topics: true,
        progress: 0,
        started_at: '9999-12-31T23:59:59+00:00',
      },
      {
        user_id: 'u1',
        block_id: 1,
        sort_order: 10,
        name: 'Completed grammar',
        is_removed_from_practice: false,
        show_in_topics: true,
        progress: 1,
        started_at: '2026-03-01T00:00:00.000Z',
      },
      {
        user_id: 'u1',
        block_id: 6,
        sort_order: 15,
        name: 'Unlocked grammar',
        is_removed_from_practice: false,
        show_in_topics: true,
        progress: 0,
        started_at: '2026-03-01T00:00:00.000Z',
      },
      {
        user_id: 'u1',
        block_id: 5,
        sort_order: 50,
        name: 'Organizational grammar',
        is_removed_from_practice: false,
        show_in_topics: false,
        progress: 1,
        started_at: '2026-03-01T00:00:00.000Z',
      },
    ]);
    mocks.getStartedBlocksIds.mockResolvedValueOnce([3, 1]);

    const result = await UserBlock.getStartedTopicsByUserId('u1');

    expect(mocks.where).toHaveBeenCalledWith('user_id');
    expect(mocks.equals).toHaveBeenCalledWith('u1');
    expect(mocks.getStartedBlocksIds).toHaveBeenCalledWith('u1');
    expect(result.map((block) => block.block_id)).toEqual([1, 3]);
  });

  it('getStartedTopicsByUserId includes visible browse-only blocks without started items', async () => {
    mocks.toArray.mockResolvedValueOnce([
      {
        user_id: 'u1',
        block_id: 1,
        sort_order: 10,
        name: 'Letters',
        is_removed_from_practice: true,
        show_in_topics: true,
        started_at: '9999-12-31T23:59:59+00:00',
      },
      {
        user_id: 'u1',
        block_id: 2,
        sort_order: 20,
        name: 'Hidden letters',
        is_removed_from_practice: true,
        show_in_topics: false,
        started_at: '9999-12-31T23:59:59+00:00',
      },
      {
        user_id: 'u1',
        block_id: 3,
        sort_order: null,
        name: 'Unordered letters',
        is_removed_from_practice: true,
        show_in_topics: true,
        started_at: '9999-12-31T23:59:59+00:00',
      },
    ]);
    mocks.getStartedBlocksIds.mockResolvedValueOnce([]);

    const result = await UserBlock.getStartedTopicsByUserId('u1');

    expect(result.map((block) => block.block_id)).toEqual([1]);
  });

  it('getByBlockId reads by compound key', async () => {
    const block = { user_id: 'u1', block_id: 2, name: 'Block 2' };
    mocks.get.mockResolvedValueOnce(block);

    await expect(UserBlock.getByBlockId('u1', 2)).resolves.toEqual(block);
    expect(mocks.get).toHaveBeenCalledWith(['u1', 2]);
  });

  it('resetByBlockId resets progress dates and updates timestamp', async () => {
    await UserBlock.resetByBlockId('u1', 7, '2026-06-23T12:00:00.000Z');

    expect(mocks.update).toHaveBeenCalledWith(['u1', 7], {
      started_at: '9999-12-31T23:59:59+00:00',
      next_at: '9999-12-31T23:59:59+00:00',
      mastered_at: '9999-12-31T23:59:59+00:00',
      progress: 0,
      updated_at: '2026-06-23T12:00:00.000Z',
    });
  });

  it('markBlockMastered sets mastered date, progress, and updated timestamp', async () => {
    await UserBlock.markBlockMastered('u1', 7, '2026-06-23T12:00:00.000Z');

    expect(mocks.update).toHaveBeenCalledWith(['u1', 7], {
      mastered_at: '2026-06-23T12:00:00.000Z',
      progress: 1,
      updated_at: '2026-06-23T12:00:00.000Z',
    });
  });

  it('simulates three mastered training blocks and leaves the fourth unstarted', async () => {
    mocks.toArray.mockResolvedValueOnce([
      {
        user_id: 'u1',
        block_id: 4,
        sort_order: null,
        is_removed_from_practice: false,
        requires_initial_training: true,
      },
      {
        user_id: 'u1',
        block_id: 2,
        sort_order: null,
        is_removed_from_practice: false,
        requires_initial_training: true,
      },
      {
        user_id: 'u1',
        block_id: 1,
        sort_order: null,
        is_removed_from_practice: false,
        requires_initial_training: true,
      },
      {
        user_id: 'u1',
        block_id: 3,
        sort_order: null,
        is_removed_from_practice: false,
        requires_initial_training: true,
      },
      {
        user_id: 'u1',
        block_id: 99,
        sort_order: null,
        is_removed_from_practice: false,
        requires_initial_training: false,
      },
    ]);
    mocks.getPracticeItems.mockResolvedValueOnce([
      { block_id: 4, curriculum_sort_path: [1, 2, 1] },
      { block_id: 2, curriculum_sort_path: [1, 1, 2] },
      { block_id: 1, curriculum_sort_path: [1, 1, 1] },
      { block_id: 3, curriculum_sort_path: [1, 1, 3] },
    ]);

    await expect(
      UserBlock.simulateInitialTrainingProgress('u1', '2026-07-17T12:00:00.000Z'),
    ).resolves.toBe(3);

    expect(mocks.update.mock.calls).toEqual([
      [['u1', 1], { started_at: '2026-07-17T12:00:00.000Z', updated_at: '2026-07-17T12:00:00.000Z' }],
      [['u1', 1], { mastered_at: '2026-07-17T12:00:00.000Z', progress: 1, updated_at: '2026-07-17T12:00:00.000Z' }],
      [['u1', 2], { started_at: '2026-07-17T12:00:00.000Z', updated_at: '2026-07-17T12:00:00.000Z' }],
      [['u1', 2], { mastered_at: '2026-07-17T12:00:00.000Z', progress: 1, updated_at: '2026-07-17T12:00:00.000Z' }],
      [['u1', 3], { started_at: '2026-07-17T12:00:00.000Z', updated_at: '2026-07-17T12:00:00.000Z' }],
      [['u1', 3], { mastered_at: '2026-07-17T12:00:00.000Z', progress: 1, updated_at: '2026-07-17T12:00:00.000Z' }],
    ]);
  });

  it('rejects training simulation when four eligible blocks are unavailable', async () => {
    mocks.toArray.mockResolvedValueOnce([
      {
        user_id: 'u1',
        block_id: 1,
        sort_order: null,
        is_removed_from_practice: false,
        requires_initial_training: true,
      },
    ]);

    await expect(
      UserBlock.simulateInitialTrainingProgress('u1', '2026-07-17T12:00:00.000Z'),
    ).rejects.toThrow('requires at least 4 initial-training blocks');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('resetByGrammarChunkId resets matching user blocks and returns reset count', async () => {
    mocks.toArray.mockResolvedValueOnce([
      {
        user_id: 'u1',
        block_id: 1,
        grammar_chunk_id: 8,
        progress: 4,
        started_at: '2026-06-20T00:00:00.000Z',
        next_at: '2026-06-25T00:00:00.000Z',
        mastered_at: '2026-06-26T00:00:00.000Z',
        updated_at: '2026-06-26T00:00:00.000Z',
      },
      {
        user_id: 'u1',
        block_id: 2,
        grammar_chunk_id: 8,
        progress: 2,
        started_at: '2026-06-21T00:00:00.000Z',
        next_at: '2026-06-27T00:00:00.000Z',
        mastered_at: '9999-12-31T23:59:59+00:00',
        updated_at: '2026-06-27T00:00:00.000Z',
      },
    ]);

    const resetCount = await UserBlock.resetByGrammarChunkId('u1', 8, '2026-06-28T12:00:00.000Z');

    expect(resetCount).toBe(2);
    expect(mocks.where).toHaveBeenCalledWith('user_id');
    expect(mocks.equals).toHaveBeenCalledWith('u1');

    const grammarFilter = mocks.filter.mock.calls[0][0] as (block: { grammar_chunk_id: number }) => boolean;
    expect(grammarFilter({ grammar_chunk_id: 8 })).toBe(true);
    expect(grammarFilter({ grammar_chunk_id: 9 })).toBe(false);
    expect(mocks.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        block_id: 1,
        started_at: '9999-12-31T23:59:59+00:00',
        next_at: '9999-12-31T23:59:59+00:00',
        mastered_at: '9999-12-31T23:59:59+00:00',
        progress: 0,
        updated_at: '2026-06-28T12:00:00.000Z',
      }),
      expect.objectContaining({
        block_id: 2,
        started_at: '9999-12-31T23:59:59+00:00',
        next_at: '9999-12-31T23:59:59+00:00',
        mastered_at: '9999-12-31T23:59:59+00:00',
        progress: 0,
        updated_at: '2026-06-28T12:00:00.000Z',
      }),
    ]);
  });

  it('resetByGrammarChunkId returns zero without writing when no blocks match', async () => {
    await expect(UserBlock.resetByGrammarChunkId('u1', 8, '2026-06-28T12:00:00.000Z')).resolves.toBe(
      0,
    );

    expect(mocks.bulkPut).not.toHaveBeenCalled();
  });

  it('deleteByUserId deletes local user blocks', async () => {
    await UserBlock.deleteByUserId('u1');

    expect(mocks.where).toHaveBeenCalledWith('user_id');
    expect(mocks.equals).toHaveBeenCalledWith('u1');
    expect(mocks.delete).toHaveBeenCalled();
  });

  it('syncFromRemote pushes local blocks, applies pull, and marks metadata', async () => {
    mocks.toArray.mockResolvedValueOnce([
      {
        user_id: 'u1',
        block_id: 1,
        progress: 2,
        started_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-03T12:00:00.000Z',
        next_at: '9999-12-31T23:59:59+00:00',
        mastered_at: '9999-12-31T23:59:59+00:00',
      },
    ]);
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: 'u1',
          block_id: 1,
          name: 'Block 1',
          note: null,
          grammar_chunk_id: 10,
          sort_order: 1,
          progress: 2,
          show_in_topics: false,
          is_removed_from_practice: false,
          requires_initial_training: true,
          started_at: null,
          updated_at: '2026-03-04T00:00:00.000Z',
          next_at: null,
          mastered_at: null,
          deleted_at: null,
        },
      ],
      error: null,
    });

    await expect(UserBlock.syncFromRemote('u1', false)).resolves.toBe(1);

    expect(mocks.where).toHaveBeenCalledWith('[user_id+updated_at]');
    expect(mocks.between).toHaveBeenCalledWith(
      ['u1', '2026-03-03T00:00:00.000Z'],
      ['u1', '2026-03-04T00:00:00.000Z'],
      true,
      false,
    );
    expect(mocks.rpc).toHaveBeenCalledWith('upsert_fetch_user_blocks', {
      p_user_id: 'u1',
      p_last_synced_at: '2026-03-03T00:00:00.000Z',
      p_user_blocks: [
        {
          user_id: 'u1',
          block_id: 1,
          progress: 2,
          started_at: '2026-03-01T00:00:00.000Z',
          updated_at: '2026-03-03T12:00:00.000Z',
          next_at: null,
          mastered_at: null,
        },
      ],
    });
    expect(mocks.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        block_id: 1,
        note: null,
        show_in_topics: false,
        is_removed_from_practice: false,
        requires_initial_training: true,
        started_at: '9999-12-31T23:59:59+00:00',
        next_at: '9999-12-31T23:59:59+00:00',
        mastered_at: '9999-12-31T23:59:59+00:00',
        deleted_at: '9999-12-31T23:59:59+00:00',
      }),
    ]);
    expect(mocks.markAsSynced).toHaveBeenCalledWith(
      'user_blocks',
      '2026-03-04T00:00:00.000Z',
      'u1',
    );
  });

  it('syncFromRemote defaults missing topic visibility to true and removal from practice to false', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: 'u1',
          block_id: 1,
          name: 'Block 1',
          note: '',
          grammar_chunk_id: 10,
          sort_order: 1,
          progress: 0,
          requires_initial_training: false,
          started_at: null,
          updated_at: '2026-03-04T00:00:00.000Z',
          next_at: null,
          mastered_at: null,
          deleted_at: null,
        },
      ],
      error: null,
    });

    await expect(UserBlock.syncFromRemote('u1', false)).resolves.toBe(1);

    expect(mocks.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        block_id: 1,
        show_in_topics: true,
        is_removed_from_practice: false,
        requires_initial_training: false,
      }),
    ]);
  });

  it('full sync clears local user blocks before upserting', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });

    await UserBlock.syncFromRemote('u1', true);

    expect(mocks.delete).toHaveBeenCalled();
  });
});
