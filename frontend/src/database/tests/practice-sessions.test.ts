import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionGet: vi.fn(),
  sessionPut: vi.fn(),
  sessionDelete: vi.fn(),
  sessionItems: vi.fn(),
  userLessonRecordStart: vi.fn(),
  userLessonStartedCount: vi.fn(),
  getUserSettings: vi.fn(),
  userLessonsTable: {},
  usersTable: {},
  itemUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '9999-12-31T23:59:59+00:00', nullReplacementNumber: 0 },
    srs: { intervals: [1, 2, 3] },
    progress: {},
    practice: {
      grammarReviewLimitSize: 20,
      vocabularyReviewLimitSize: 20,
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_items: {
      update: (...args: unknown[]) => mocks.itemUpdate(...args),
      get: (...args: unknown[]) => mocks.sessionGet(...args),
      where: () => ({
        anyOf: () => ({ toArray: (...args: unknown[]) => mocks.sessionItems(...args) }),
      }),
    },
    practice_sessions: {
      get: (...args: unknown[]) => mocks.sessionGet(...args),
      put: (...args: unknown[]) => mocks.sessionPut(...args),
      delete: (...args: unknown[]) => mocks.sessionDelete(...args),
    },
    user_lessons: mocks.userLessonsTable,
    users: mocks.usersTable,
    transaction: (...args: unknown[]) => {
      mocks.transaction(...args.slice(0, -1));
      return (args.at(-1) as () => Promise<unknown>)();
    },
  },
}));

vi.mock('dexie', () => ({ Entity: class Entity {} }));
vi.mock('@/database/models/user-lessons', () => ({
  default: {
    recordStart: (...args: unknown[]) => mocks.userLessonRecordStart(...args),
    getStartedCountForToday: (...args: unknown[]) => mocks.userLessonStartedCount(...args),
  },
}));
vi.mock('@/database/models/user-settings', () => ({
  default: { getOrCreate: (...args: unknown[]) => mocks.getUserSettings(...args) },
}));

import PracticeSession from '@/database/models/practice-sessions';

describe('PracticeSession progress transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.itemUpdate.mockResolvedValue(1);
    mocks.sessionPut.mockResolvedValue(undefined);
    mocks.sessionDelete.mockResolvedValue(undefined);
    mocks.sessionItems.mockResolvedValue([]);
    mocks.userLessonRecordStart.mockResolvedValue(undefined);
    mocks.userLessonStartedCount.mockResolvedValue(0);
    mocks.getUserSettings.mockResolvedValue({ max_new_lessons_per_day: 3 });
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
      item({ progress_cz_to_en: 1 }),
      session,
    );

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.itemUpdate).toHaveBeenCalledOnce();
    expect(mocks.sessionPut).toHaveBeenCalledWith(session);
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
      item({ progress_cz_to_en: 1 }),
      session,
    );

    expect(mocks.sessionPut).toHaveBeenCalledWith(session);
  });

  it('does not store an initial-training session when the item is missing', async () => {
    mocks.sessionGet.mockResolvedValue(newSession());
    mocks.itemUpdate.mockResolvedValue(0);

    await expect(
      PracticeSession.recordInitialTrainingAnswer(
        item({ progress_cz_to_en: 1 }),
        newSession(),
      ),
    ).rejects.toThrow('The trained item no longer exists locally.');
    expect(mocks.sessionPut).not.toHaveBeenCalled();
  });

  it('records the final answer and removes the active initial-training session', async () => {
    const session = { ...newSession(), current_queue_item_ids: [1] };
    mocks.sessionGet.mockResolvedValue(session);

    await expect(
      PracticeSession.recordInitialTrainingAnswer(item(), null, session),
    ).resolves.toBeUndefined();
    expect(mocks.itemUpdate).toHaveBeenCalledOnce();
    expect(mocks.sessionDelete).toHaveBeenCalledWith('u1');
  });

  it('uses the expected session when it was removed before the final answer', async () => {
    mocks.sessionGet.mockResolvedValue(null);

    await expect(
      PracticeSession.recordInitialTrainingAnswer(item(), null, newSession()),
    ).resolves.toBeUndefined();
    expect(mocks.sessionDelete).toHaveBeenCalledWith('u1');
  });

  it('rejects a new-lesson session without items', async () => {
    await expect(PracticeSession.startNew('u1', 1, [])).rejects.toThrow(
      'Initial training requires at least one item.',
    );
    expect(mocks.sessionPut).not.toHaveBeenCalled();
  });

  it('starts a whole lesson and records it inside the session transaction', async () => {
    mocks.sessionGet.mockResolvedValue(null);
    mocks.sessionItems.mockResolvedValue([
      { item_id: 1, lesson_id: 4 },
      { item_id: 2, lesson_id: 4 },
    ]);

    const session = await PracticeSession.startNew('u1', 4, [1, 2], '2026-08-23T10:00:00Z');

    expect(session).toMatchObject({ lesson_id: 4, target_count: 2 });
    expect(mocks.userLessonRecordStart).toHaveBeenCalledWith(
      'u1',
      4,
      '2026-08-23T10:00:00Z',
    );
    expect(mocks.transaction.mock.calls[0]).toContain(mocks.userLessonsTable);
  });

  it('enforces the current daily lesson limit before recording another start', async () => {
    mocks.sessionGet.mockResolvedValue(null);
    mocks.sessionItems.mockResolvedValue([{ item_id: 1, lesson_id: 4 }]);
    mocks.getUserSettings.mockResolvedValue({ max_new_lessons_per_day: 2 });
    mocks.userLessonStartedCount.mockResolvedValue(2);

    await expect(PracticeSession.startNew('u1', 4, [1])).rejects.toThrow(
      'Daily new lesson limit reached.',
    );
    expect(mocks.userLessonRecordStart).not.toHaveBeenCalled();
  });

  it('removes an empty saved new-lesson session', async () => {
    mocks.sessionGet.mockResolvedValue({
      user_id: 'u1',
      mode: 'new',
      completed_count: 0,
      target_count: 0,
      lesson_id: 1,
      phase: 0,
      current_queue_item_ids: [],
      retry_queue_item_ids: [],
      completed_item_ids: [],
      started_at: '2026-08-23',
      updated_at: '2026-08-23',
    });

    await expect(PracticeSession.reconcileActive('u1')).resolves.toBeNull();
    expect(mocks.sessionDelete).toHaveBeenCalledWith('u1');
  });

  it('preserves a valid partial new-lesson session', async () => {
    const session = {
      ...newSession(),
      current_queue_item_ids: [2],
      completed_item_ids: [1],
      completed_count: 1,
    };
    mocks.sessionGet.mockResolvedValue(session);
    mocks.sessionItems.mockResolvedValue([
      { item_id: 1, lesson_id: 1, deleted_at: '9999-12-31T23:59:59+00:00' },
      { item_id: 2, lesson_id: 1, deleted_at: '9999-12-31T23:59:59+00:00' },
    ]);

    await expect(PracticeSession.reconcileActive('u1')).resolves.toBe(session);
    expect(mocks.sessionDelete).not.toHaveBeenCalled();
  });

  it('rejects a phase-1 initial-training session as invalid', async () => {
    const session = {
      ...newSession(),
      phase: 1 as const,
      current_queue_item_ids: [2],
      completed_item_ids: [1],
      completed_count: 1,
    };
    mocks.sessionGet.mockResolvedValue(session);
    mocks.sessionItems.mockResolvedValue([
      { item_id: 1, lesson_id: 1, deleted_at: '9999-12-31T23:59:59+00:00' },
      { item_id: 2, lesson_id: 1, deleted_at: '9999-12-31T23:59:59+00:00' },
    ]);

    await expect(PracticeSession.inspectActive('u1')).resolves.toEqual({
      activeSession: null,
      requiresReconciliation: true,
    });
  });
});

function newSession() {
  return {
    user_id: 'u1',
    mode: 'new' as const,
    completed_count: 0,
    target_count: 2,
    lesson_id: 1,
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
    czech_description: null,
    english: 'hello',
    pronunciation: '',
    audio: null,
    is_vocabulary: 1 as const,
    sort_order: 1,
    curriculum_sort_path: [1, 1, 1] as [number, number, number],
    note_id: null,
    lesson_id: 1,
    topic_id: 0,
    grammar_chunk_id: 0,
    progress_cz_to_en: 0,
    progress_en_to_cz: 0,
    is_cz_to_en_enabled: true,
    is_en_to_cz_enabled: true,
    started_at: '2026-01-01',
    updated_at: '2026-01-01',
    deleted_at: '9999-12-31T23:59:59+00:00',
    next_at_cz_to_en: '2026-01-01',
    mastered_at_cz_to_en: '9999-12-31T23:59:59+00:00',
    next_at_en_to_cz: '9999-12-31T23:59:59+00:00',
    mastered_at_en_to_cz: '9999-12-31T23:59:59+00:00',
    ...overrides,
  };
}
