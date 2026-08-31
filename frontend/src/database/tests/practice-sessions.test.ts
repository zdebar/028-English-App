import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionGet: vi.fn(),
  sessionPut: vi.fn(),
  sessionDelete: vi.fn(),
  blockGet: vi.fn(),
  blockItems: vi.fn(),
  itemUpdate: vi.fn(),
  recordProgressChange: vi.fn(),
  saveInitialTrainingCompletion: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '9999-12-31T23:59:59+00:00', nullReplacementNumber: 0 },
    srs: { intervals: { czToEn: [1, 2, 3], enToCz: [1, 2, 3] } },
    progress: { afterNewBlockProgress: 2 },
    practice: { initialTrainingBatchSize: 8, reviewMinimumSize: 20 },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_items: {
      update: (...args: unknown[]) => mocks.itemUpdate(...args),
      get: (...args: unknown[]) => mocks.sessionGet(...args),
      where: () => ({
        anyOf: () => ({ toArray: (...args: unknown[]) => mocks.blockItems(...args) }),
      }),
    },
    user_item_progress_history: {},
    blocks: { get: (...args: unknown[]) => mocks.blockGet(...args) },
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

vi.mock('@/database/models/user-item-progress-history', () => ({
  default: {
    recordChange: (...args: unknown[]) => mocks.recordProgressChange(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    saveInitialTrainingCompletion: (...args: unknown[]) =>
      mocks.saveInitialTrainingCompletion(...args),
  },
}));

vi.mock('dexie', () => ({ Entity: class Entity {} }));

import PracticeSession from '@/database/models/practice-sessions';

describe('PracticeSession progress transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.itemUpdate.mockResolvedValue(1);
    mocks.sessionPut.mockResolvedValue(undefined);
    mocks.sessionDelete.mockResolvedValue(undefined);
    mocks.blockItems.mockResolvedValue([]);
    mocks.recordProgressChange.mockResolvedValue(undefined);
    mocks.saveInitialTrainingCompletion.mockResolvedValue([]);
  });

  it('persists a review answer and records its effective progress delta atomically', async () => {
    mocks.sessionGet.mockResolvedValue(reviewSession(7));
    const original = item({ progress_cz_to_en: 1 });
    const updated = item({ progress_cz_to_en: 2, updated_at: '2026-08-23T10:00:00.000Z' });

    const result = await PracticeSession.recordReviewAnswer(
      original,
      updated,
      'czToEn',
      '2026-08-23T10:00:00.000Z',
    );

    expect(result).toEqual({ completedCount: 8, progressChange: 1 });
    expect(mocks.itemUpdate).toHaveBeenCalledOnce();
    expect(mocks.sessionPut).toHaveBeenCalledWith(
      expect.objectContaining({ completed_count: 8, review_queue: [] }),
    );
    expect(mocks.recordProgressChange).toHaveBeenCalledWith(
      'u1',
      1,
      'czToEn',
      2,
      3,
      1,
      '2026-08-23T10:00:00.000Z',
    );
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it('records skip as the remaining distance to the mastered SRS maximum', async () => {
    mocks.sessionGet.mockResolvedValue(reviewSession(0));
    const original = item({ progress_cz_to_en: 1 });
    const updated = item({
      progress_cz_to_en: 1,
      mastered_at_cz_to_en: '2026-08-23T10:00:00.000Z',
      updated_at: '2026-08-23T10:00:00.000Z',
    });

    await PracticeSession.recordReviewAnswer(
      original,
      updated,
      'czToEn',
      '2026-08-23T10:00:00.000Z',
    );

    expect(mocks.recordProgressChange).toHaveBeenCalledWith(
      'u1',
      1,
      'czToEn',
      3,
      3,
      2,
      '2026-08-23T10:00:00.000Z',
    );
  });

  it('stores an initial-training answer and session in the same transaction', async () => {
    const session = {
      ...newSession(),
      current_queue_item_ids: [2],
      completed_item_ids: [1],
      completed_count: 1,
    };
    mocks.sessionGet.mockResolvedValue(newSession());

    await PracticeSession.recordInitialTrainingAnswer(
      item(),
      item({ progress_cz_to_en: 1 }),
      'czToEn',
      session,
    );

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.itemUpdate).toHaveBeenCalledOnce();
    expect(mocks.sessionPut).toHaveBeenCalledWith(session);
    expect(mocks.recordProgressChange).toHaveBeenCalledOnce();
  });

  it('restores the expected initial-training session when reconciliation removed it', async () => {
    mocks.sessionGet.mockResolvedValue(null);
    const session = {
      ...newSession(),
      current_queue_item_ids: [2],
      completed_item_ids: [1],
      completed_count: 1,
    };

    await PracticeSession.recordInitialTrainingAnswer(
      item(),
      item({ progress_cz_to_en: 1 }),
      'czToEn',
      session,
    );

    expect(mocks.sessionPut).toHaveBeenCalledWith(session);
  });

  it('does not store an initial-training session when the item is missing', async () => {
    mocks.sessionGet.mockResolvedValue(newSession());
    mocks.itemUpdate.mockResolvedValue(0);

    await expect(
      PracticeSession.recordInitialTrainingAnswer(
        item(),
        item({ progress_cz_to_en: 1 }),
        'czToEn',
        newSession(),
      ),
    ).rejects.toThrow('The trained item no longer exists locally.');
    expect(mocks.sessionPut).not.toHaveBeenCalled();
  });

  it('records final completion and removes the active initial-training session', async () => {
    mocks.sessionGet.mockResolvedValue({
      ...newSession(),
      current_queue_item_ids: [1, 2],
    });

    await expect(
      PracticeSession.completeInitialTraining('u1', [1, 2], '2026-08-23T10:00:00.000Z'),
    ).resolves.toBeUndefined();
    expect(mocks.saveInitialTrainingCompletion).toHaveBeenCalledWith(
      'u1',
      [1, 2],
      '2026-08-23T10:00:00.000Z',
    );
    expect(mocks.sessionDelete).toHaveBeenCalledWith('u1');
  });

  it('uses the expected session when the active session was removed before completion', async () => {
    mocks.sessionGet.mockResolvedValue(null);

    await expect(
      PracticeSession.completeInitialTraining(
        'u1',
        [1, 2],
        '2026-08-23T10:00:00.000Z',
        undefined,
        'enToCz',
        newSession(),
      ),
    ).resolves.toBeUndefined();
    expect(mocks.sessionDelete).toHaveBeenCalledWith('u1');
  });

  it('rejects a new-block session without items', async () => {
    await expect(PracticeSession.startNew('u1', 1, [])).rejects.toThrow(
      'Initial training requires at least one item.',
    );
    expect(mocks.sessionPut).not.toHaveBeenCalled();
  });

  it('removes an empty saved new-block session', async () => {
    mocks.sessionGet.mockResolvedValue({
      user_id: 'u1',
      mode: 'new',
      completed_count: 0,
      target_count: 0,
      block_id: 1,
      phase: 0,
      current_queue_item_ids: [],
      retry_queue_item_ids: [],
      completed_item_ids: [],
      started_at: '2026-08-23',
      updated_at: '2026-08-23',
    });
    mocks.blockGet.mockResolvedValue({ id: 1 });

    await expect(PracticeSession.reconcileActive('u1')).resolves.toBeNull();
    expect(mocks.sessionDelete).toHaveBeenCalledWith('u1');
  });

  it('preserves a valid partial new-block session', async () => {
    const session = {
      ...newSession(),
      current_queue_item_ids: [2],
      completed_item_ids: [1],
      completed_count: 1,
    };
    mocks.sessionGet.mockResolvedValue(session);
    mocks.blockGet.mockResolvedValue({ id: 10 });
    mocks.blockItems.mockResolvedValue([
      { item_id: 1, block_id: 10, deleted_at: '9999-12-31T23:59:59+00:00' },
      { item_id: 2, block_id: 10, deleted_at: '9999-12-31T23:59:59+00:00' },
    ]);

    await expect(PracticeSession.reconcileActive('u1')).resolves.toBe(session);
    expect(mocks.sessionDelete).not.toHaveBeenCalled();
  });
});

function reviewSession(completedCount: number) {
  return {
    user_id: 'u1',
    mode: 'review' as const,
    completed_count: completedCount,
    target_count: 20,
    block_id: null,
    phase: null,
    current_queue_item_ids: [],
    retry_queue_item_ids: [],
    completed_item_ids: [],
    review_queue: [{ item_id: 1, direction: 'czToEn' as const }],
    review_direction: 'czToEn' as const,
    started_at: '2026-08-23T09:00:00.000Z',
    updated_at: '2026-08-23T09:00:00.000Z',
  };
}

function newSession() {
  return {
    user_id: 'u1',
    mode: 'new' as const,
    completed_count: 0,
    target_count: 2,
    block_id: 10,
    phase: 0 as const,
    current_queue_item_ids: [1, 2],
    retry_queue_item_ids: [],
    completed_item_ids: [],
    started_at: '2026-08-23',
    updated_at: '2026-08-23',
  };
}

function item(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 'u1',
    item_id: 1,
    czech: 'ahoj',
    english: 'hello',
    pronunciation: '',
    audio: null,
    is_vocabulary: 1 as const,
    has_pronunciation_practice: 0 as const,
    sort_order: 1,
    curriculum_sort_path: [1, 1, 1] as [number, number, number],
    note_id: null,
    lesson_id: 1,
    block_id: 10,
    topic_id: 0,
    grammar_chunk_id: 0,
    progress_cz_to_en: 0,
    progress_en_to_cz: 0,
    started_at: '2026-01-01',
    updated_at: '2026-01-01',
    deleted_at: '9999-12-31T23:59:59+00:00',
    next_at_cz_to_en: '2026-01-01',
    next_at_en_to_cz: '2026-01-01',
    mastered_at_cz_to_en: '9999-12-31T23:59:59+00:00',
    mastered_at_en_to_cz: '9999-12-31T23:59:59+00:00',
    ...overrides,
  };
}
