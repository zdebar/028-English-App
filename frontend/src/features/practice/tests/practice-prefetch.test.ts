import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PracticeSessionType } from '@/types/practice-session.types';

const mocks = vi.hoisted(() => ({
  getSelection: vi.fn(),
  getBlock: vi.fn(),
  inspectActive: vi.fn(),
  resolveEntries: vi.fn(),
  resolveGrammarContext: vi.fn(),
  warmReviewArrays: vi.fn().mockResolvedValue(undefined),
  invalidateReviewArrays: vi.fn(),
  clearReviewArrays: vi.fn(),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getNextInitialTrainingSelection: (...args: unknown[]) => mocks.getSelection(...args),
  },
}));
vi.mock('@/database/models/blocks', () => ({
  default: { getById: (...args: unknown[]) => mocks.getBlock(...args) },
}));
vi.mock('@/database/models/practice-sessions', () => ({
  default: { inspectActive: (...args: unknown[]) => mocks.inspectActive(...args) },
}));
vi.mock('@/database/utils/practice-content.utils', () => ({
  resolvePracticeEntries: (...args: unknown[]) => mocks.resolveEntries(...args),
  resolvePracticeGrammarContext: (...args: unknown[]) => mocks.resolveGrammarContext(...args),
}));
vi.mock('../review-prefetch', () => ({
  warmReviewArrays: (...args: unknown[]) => mocks.warmReviewArrays(...args),
  invalidateReviewArrays: (...args: unknown[]) => mocks.invalidateReviewArrays(...args),
  clearReviewArrays: (...args: unknown[]) => mocks.clearReviewArrays(...args),
}));

import {
  clearPracticeCache,
  getPrefetchedNextInitialBlock,
  invalidateNextInitialBlock,
} from '../practice-prefetch';

describe('practice prefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPracticeCache(null);
    mocks.getSelection.mockResolvedValue(selection(7));
    mocks.getBlock.mockResolvedValue({ id: 7, grammar_chunk_id: 4 });
    mocks.resolveEntries.mockImplementation(async (_userId: string, items: Item[]) =>
      items.map((item) => ({ item, note: null, grammar: null })),
    );
    mocks.resolveGrammarContext.mockResolvedValue({
      grammar: null,
      grammarGroup: null,
    });
    mocks.inspectActive.mockResolvedValue({
      activeSession: null,
      requiresReconciliation: false,
    });
  });

  it('deduplicates concurrent review and initial prefetch work', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    mocks.getSelection.mockImplementation(async () => {
      await pending;
      return selection(7);
    });

    const first = getPrefetchedNextInitialBlock('u1', null);
    const second = getPrefetchedNextInitialBlock('u1', null);

    release();
    const [firstBlock, secondBlock] = await Promise.all([first, second]);

    expect(firstBlock).toBe(secondBlock);
    expect(mocks.getSelection).toHaveBeenCalledOnce();
    expect(mocks.warmReviewArrays).toHaveBeenCalledOnce();
  });

  it('returns the prepared block with resolved practice content', async () => {
    const prepared = await getPrefetchedNextInitialBlock('u1', null);

    expect(prepared).toMatchObject({
      block: { id: 7, grammar_chunk_id: 4 },
      items: selection(7).items,
      grammar: null,
      grammarGroup: null,
    });
    expect(prepared?.entries).toHaveLength(1);
    expect(mocks.getBlock).toHaveBeenCalledWith(7);
  });

  it('excludes the active initial block and its saved items', async () => {
    const activeSession = activeSessionFixture();
    await getPrefetchedNextInitialBlock('u1', activeSession);

    expect(mocks.getSelection).toHaveBeenCalledWith(
      'u1',
      expect.any(Number),
      {
        excludeBlockId: 7,
        excludeItemIds: [1, 2],
      },
    );
  });

  it('returns null for an invalid block and reloads after invalidation', async () => {
    mocks.getBlock.mockResolvedValueOnce(null);
    await expect(getPrefetchedNextInitialBlock('u1', null)).resolves.toBeNull();

    mocks.getBlock.mockResolvedValue({ id: 8, grammar_chunk_id: 0 });
    mocks.getSelection.mockResolvedValue(selection(8));
    invalidateNextInitialBlock('u1');

    await expect(getPrefetchedNextInitialBlock('u1', null)).resolves.toMatchObject({
      block: { id: 8 },
    });
    expect(mocks.getSelection).toHaveBeenCalledTimes(2);
  });
});

type Item = {
  item_id: number;
  block_id: number;
  grammar_chunk_id: number;
};

function selection(blockId: number) {
  return {
    blockId,
    items: [{ item_id: 1, block_id: blockId, grammar_chunk_id: 4 } satisfies Item],
  };
}

function activeSessionFixture(): PracticeSessionType {
  return {
    user_id: 'u1',
    mode: 'new',
    completed_count: 0,
    target_count: 2,
    block_id: 7,
    phase: 0,
    current_queue_item_ids: [1],
    retry_queue_item_ids: [],
    completed_item_ids: [2],
    started_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}