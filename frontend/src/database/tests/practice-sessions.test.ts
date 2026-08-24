import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionGet: vi.fn(),
  sessionPut: vi.fn(),
  sessionDelete: vi.fn(),
  blockGet: vi.fn(),
  blockItems: vi.fn(),
  itemUpdate: vi.fn(),
  addStar: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '9999-12-31T23:59:59+00:00' },
    practice: { reviewStarSize: 20 },
  },
}));
vi.mock('@/database/models/db', () => ({
  db: {
    user_items: {
      update: (...args: unknown[]) => mocks.itemUpdate(...args),
      where: () => ({
        equals: () => ({ toArray: (...args: unknown[]) => mocks.blockItems(...args) }),
      }),
    },
    user_blocks: { get: (...args: unknown[]) => mocks.blockGet(...args) },
    user_scores: {},
    practice_sessions: {
      get: (...args: unknown[]) => mocks.sessionGet(...args),
      put: (...args: unknown[]) => mocks.sessionPut(...args),
      delete: (...args: unknown[]) => mocks.sessionDelete(...args),
    },
    transaction: (...args: unknown[]) => {
      mocks.transaction(...args.slice(0, -1));
      return (args.at(-1) as () => Promise<unknown>)();
    },
  },
}));
vi.mock('@/database/models/user-scores', () => ({
  default: { addStar: (...args: unknown[]) => mocks.addStar(...args) },
}));
vi.mock('@/database/models/user-items', () => ({ default: { saveNewBlockCompletion: vi.fn() } }));
vi.mock('@/database/models/user-blocks', () => ({ default: { completeNewBlock: vi.fn() } }));
vi.mock('dexie', () => ({ Entity: class Entity {} }));

import PracticeSession from '@/database/models/practice-sessions';

describe('PracticeSession review transaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.itemUpdate.mockResolvedValue(1);
    mocks.sessionPut.mockResolvedValue(undefined);
    mocks.sessionDelete.mockResolvedValue(undefined);
    mocks.blockItems.mockResolvedValue([]);
    mocks.addStar.mockResolvedValue(11);
  });

  it('persists an intermediate answer without awarding a star', async () => {
    mocks.sessionGet.mockResolvedValue(reviewSession(7));
    const result = await PracticeSession.recordReviewAnswer(item(), '2026-08-23T10:00:00.000Z');
    expect(result).toEqual({ completedCount: 8, earnedStar: false, starCount: null });
    expect(mocks.itemUpdate).toHaveBeenCalledOnce();
    expect(mocks.sessionPut).toHaveBeenCalledWith(expect.objectContaining({ completed_count: 8 }));
    expect(mocks.addStar).not.toHaveBeenCalled();
  });

  it('stores answer, completed session, and exactly one star in the same transaction', async () => {
    mocks.sessionGet.mockResolvedValue(reviewSession(19));
    const result = await PracticeSession.recordReviewAnswer(item(), '2026-08-23T10:00:00.000Z');
    expect(result).toEqual({ completedCount: 20, earnedStar: true, starCount: 11 });
    expect(mocks.addStar).toHaveBeenCalledOnce();
    expect(mocks.addStar).toHaveBeenCalledWith('u1', 1, '2026-08-23T10:00:00.000Z');
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it('returns the awarded count and removes a completed new-block session', async () => {
    mocks.sessionGet.mockResolvedValue({
      ...reviewSession(2),
      mode: 'new',
      block_id: 7,
      target_count: 2,
    });

    await expect(
      PracticeSession.completeNewBlock('u1', 7, '2026-08-23T10:00:00.000Z'),
    ).resolves.toBe(11);
    expect(mocks.sessionDelete).toHaveBeenCalledWith('u1');
  });

  it('rejects a new-block session without items', async () => {
    await expect(PracticeSession.startNew('u1', 1, [])).rejects.toThrow(
      'New-block practice requires at least one item.',
    );
    expect(mocks.sessionPut).not.toHaveBeenCalled();
  });

  it('removes an empty saved new-block session', async () => {
    mocks.sessionGet.mockResolvedValue({
      user_id: 'u1', mode: 'new', completed_count: 0, target_count: 0,
      block_id: 1, phase: 0, current_queue_item_ids: [], retry_queue_item_ids: [],
      completed_item_ids: [], started_at: '2026-08-23', updated_at: '2026-08-23',
    });
    mocks.blockGet.mockResolvedValue({
      block_id: 1,
      is_practice_block: true,
      started_at: '9999-12-31T23:59:59+00:00',
    });

    await expect(PracticeSession.reconcileActive('u1')).resolves.toBeNull();
    expect(mocks.sessionDelete).toHaveBeenCalledWith('u1');
  });

  it('preserves a valid partial new-block session', async () => {
    const session = {
      user_id: 'u1', mode: 'new' as const, completed_count: 1, target_count: 2,
      block_id: 1, phase: 0 as const, current_queue_item_ids: [2], retry_queue_item_ids: [],
      completed_item_ids: [1], started_at: '2026-08-23', updated_at: '2026-08-23',
    };
    mocks.sessionGet.mockResolvedValue(session);
    mocks.blockGet.mockResolvedValue({
      block_id: 1,
      is_practice_block: true,
      started_at: '9999-12-31T23:59:59+00:00',
    });
    mocks.blockItems.mockResolvedValue([{ item_id: 1 }, { item_id: 2 }]);

    await expect(PracticeSession.reconcileActive('u1')).resolves.toBe(session);
    expect(mocks.sessionDelete).not.toHaveBeenCalled();
  });
});

function reviewSession(completedCount: number) {
  return {
    user_id: 'u1', mode: 'review' as const, completed_count: completedCount, target_count: 20,
    block_id: null, phase: null, current_queue_item_ids: [], retry_queue_item_ids: [],
    completed_item_ids: [], started_at: '2026-08-23T09:00:00.000Z', updated_at: '2026-08-23T09:00:00.000Z',
  };
}

function item() {
  return { user_id: 'u1', item_id: 1 } as never;
}
