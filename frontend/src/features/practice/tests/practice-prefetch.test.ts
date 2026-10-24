import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSelection: vi.fn(),
  getLesson: vi.fn(),
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
vi.mock('@/database/models/lessons', () => ({
  default: { getById: (...args: unknown[]) => mocks.getLesson(...args) },
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
  getPrefetchedNextInitialLesson,
  invalidateNextInitialLesson,
} from '../practice-prefetch';

describe('practice prefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPracticeCache(null);
    mocks.getSelection.mockResolvedValue(selection(7));
    mocks.getLesson.mockResolvedValue({ id: 7, grammar_chunk_id: 4 });
    mocks.resolveEntries.mockImplementation(async (_userId: string, items: Item[]) =>
      items.map((item) => ({ item, note: null, grammar: null })),
    );
    mocks.resolveGrammarContext.mockResolvedValue({
      grammar: null,
      grammarGroup: null,
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

    const first = getPrefetchedNextInitialLesson('u1');
    const second = getPrefetchedNextInitialLesson('u1');

    release();
    const [firstLesson, secondLesson] = await Promise.all([first, second]);

    expect(firstLesson).toBe(secondLesson);
    expect(mocks.getSelection).toHaveBeenCalledOnce();
    expect(mocks.warmReviewArrays).toHaveBeenCalledOnce();
  });

  it('returns the prepared lesson with resolved practice content', async () => {
    const prepared = await getPrefetchedNextInitialLesson('u1');

    expect(prepared).toMatchObject({
      lesson: { id: 7, grammar_chunk_id: 4 },
      items: selection(7).items,
      grammar: null,
      grammarGroup: null,
    });
    expect(prepared?.entries).toHaveLength(1);
    expect(mocks.getLesson).toHaveBeenCalledWith(7);
  });

  it('selects from currently unstarted items without persistent session exclusions', async () => {
    const prepared = await getPrefetchedNextInitialLesson('u1');

    await expect(getPrefetchedNextInitialLesson('u1')).resolves.toBe(prepared);
    expect(mocks.getSelection).toHaveBeenCalledOnce();
    expect(mocks.getSelection).toHaveBeenCalledWith('u1');
  });

  it('returns null for an invalid lesson and reloads after invalidation', async () => {
    mocks.getLesson.mockResolvedValueOnce(null);
    await expect(getPrefetchedNextInitialLesson('u1')).resolves.toBeNull();

    mocks.getLesson.mockResolvedValue({ id: 8, grammar_chunk_id: 0 });
    mocks.getSelection.mockResolvedValue(selection(8));
    invalidateNextInitialLesson('u1');

    await expect(getPrefetchedNextInitialLesson('u1')).resolves.toMatchObject({
      lesson: { id: 8 },
    });
    expect(mocks.getSelection).toHaveBeenCalledTimes(2);
  });
});

type Item = {
  item_id: number;
  grammar_chunk_id: number;
};

function selection(lessonId: number) {
  return {
    lessonId,
    items: [{ item_id: 1, grammar_chunk_id: 4 } satisfies Item],
  };
}
