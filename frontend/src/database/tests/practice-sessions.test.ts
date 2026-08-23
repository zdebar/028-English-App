import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionGet: vi.fn(),
  sessionPut: vi.fn(),
  itemUpdate: vi.fn(),
  addStar: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/config/config', () => ({ default: { practice: { reviewStarSize: 20 } } }));
vi.mock('@/database/models/db', () => ({
  db: {
    user_items: { update: (...args: unknown[]) => mocks.itemUpdate(...args) },
    user_blocks: {},
    user_scores: {},
    practice_sessions: {
      get: (...args: unknown[]) => mocks.sessionGet(...args),
      put: (...args: unknown[]) => mocks.sessionPut(...args),
      delete: vi.fn(),
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
    mocks.addStar.mockResolvedValue(undefined);
  });

  it('persists an intermediate answer without awarding a star', async () => {
    mocks.sessionGet.mockResolvedValue(reviewSession(7));
    const result = await PracticeSession.recordReviewAnswer(item(), '2026-08-23T10:00:00.000Z');
    expect(result).toEqual({ completedCount: 8, earnedStar: false });
    expect(mocks.itemUpdate).toHaveBeenCalledOnce();
    expect(mocks.sessionPut).toHaveBeenCalledWith(expect.objectContaining({ completed_count: 8 }));
    expect(mocks.addStar).not.toHaveBeenCalled();
  });

  it('stores answer, completed session, and exactly one star in the same transaction', async () => {
    mocks.sessionGet.mockResolvedValue(reviewSession(19));
    const result = await PracticeSession.recordReviewAnswer(item(), '2026-08-23T10:00:00.000Z');
    expect(result).toEqual({ completedCount: 20, earnedStar: true });
    expect(mocks.addStar).toHaveBeenCalledOnce();
    expect(mocks.addStar).toHaveBeenCalledWith('u1', 1, '2026-08-23T10:00:00.000Z');
    expect(mocks.transaction).toHaveBeenCalledOnce();
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
