import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserItemLocal } from '@/types/user-item.types';

const NULL_DATE = '9999-12-31T23:59:59+00:00';

const mocks = vi.hoisted(() => ({
  currentItems: [] as UserItemLocal[],
  dueItems: [] as UserItemLocal[],
  userItemGet: vi.fn(),
  bulkUpdate: vi.fn(),
  bulkPut: vi.fn(),
  bulkDelete: vi.fn(),
  getSyncTimestamps: vi.fn(),
  splitDeleted: vi.fn(),
  markAsSynced: vi.fn(),
  rpc: vi.fn(),
}));

function createDueQuery() {
  return {
    between: () => ({
      filter: (predicate: (item: UserItemLocal) => boolean) => ({
        limit: (limit: number) => ({
          toArray: async () => mocks.dueItems.filter(predicate).slice(0, limit),
        }),
        toArray: async () => mocks.dueItems.filter(predicate),
      }),
    }),
  };
}

function createItemQuery() {
  return {
    anyOf: () => ({ toArray: async () => mocks.currentItems }),
    equals: () => ({
      first: async () => mocks.currentItems[0],
      toArray: async () => mocks.currentItems,
    }),
    toArray: async () => mocks.currentItems,
  };
}

vi.mock('@/database/models/db', () => ({
  db: {
    user_items: {
      get: (...args: unknown[]) => mocks.userItemGet(...args),
      bulkUpdate: (...args: unknown[]) => mocks.bulkUpdate(...args),
      bulkPut: (...args: unknown[]) => mocks.bulkPut(...args),
      bulkDelete: (...args: unknown[]) => mocks.bulkDelete(...args),
      where: (field: string) => {
        if (field === '[user_id+next_at_cz_to_en+mastered_at_cz_to_en+curriculum_sort_path]') {
          return createDueQuery();
        }
        return createItemQuery();
      },
    },
    transaction: async (...args: unknown[]) => {
      const callback = args.at(-1);
      if (typeof callback !== 'function') throw new Error('Missing transaction callback');
      return callback();
    },
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: { rpc: (...args: unknown[]) => mocks.rpc(...args) },
}));

vi.mock('@/database/models/metadata', () => ({
  default: { markAsSynced: (...args: unknown[]) => mocks.markAsSynced(...args) },
}));
vi.mock('@/database/utils/sync-generic.utils', () => ({
  getSyncTimestamps: (...args: unknown[]) => mocks.getSyncTimestamps(...args),
  splitDeleted: (...args: unknown[]) => mocks.splitDeleted(...args),
}));

import UserItem from '@/database/models/user-items';

function makeItem(overrides: Partial<UserItemLocal> = {}): UserItemLocal {
  return {
    user_id: 'u1',
    item_id: 1,
    czech: 'ahoj',
    english: 'hello',
    pronunciation: 'hello',
    audio: null,
    sort_order: 1,
    progress_cz_to_en: 0,
    note_id: null,
    lesson_id: 1,
    updated_at: '2026-01-01T00:00:00.000Z',
    is_vocabulary: 1,
    block_id: 0,
    topic_id: 0,
    grammar_chunk_id: 0,
    started_at: '2026-01-01T00:00:00.000Z',
    deleted_at: NULL_DATE,
    next_at_cz_to_en: '2026-01-01T00:00:00.000Z',
    mastered_at_cz_to_en: NULL_DATE,
    curriculum_sort_path: [1, 1, 1],
    ...overrides,
  };
}

describe('UserItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentItems = [];
    mocks.dueItems = [];
    mocks.userItemGet.mockResolvedValue(makeItem());
    mocks.bulkUpdate.mockResolvedValue(undefined);
    mocks.bulkPut.mockResolvedValue(undefined);
    mocks.bulkDelete.mockResolvedValue(undefined);
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '2025-01-01T00:00:00.000Z',
      newSyncedAt: '2026-02-01T00:00:00.000Z',
    });
    mocks.splitDeleted.mockImplementation((items: UserItemLocal[]) => ({
      toUpsert: items.filter((item) => item.deleted_at == null || item.deleted_at === NULL_DATE),
      toDelete: items.filter((item) => item.deleted_at != null && item.deleted_at !== NULL_DATE),
    }));
    mocks.markAsSynced.mockResolvedValue(undefined);
    mocks.rpc.mockResolvedValue({ data: [], error: null });
  });

  it('saves only CZ-to-EN practice fields in one bulk update', async () => {
    const item = makeItem({ item_id: 4, progress_cz_to_en: 3 });
    mocks.userItemGet.mockResolvedValue(item);

    await UserItem.savePracticeDeck([item]);

    expect(mocks.bulkUpdate).toHaveBeenCalledWith([
      {
        key: ['u1', 4],
        changes: {
          progress_cz_to_en: 3,
          started_at: item.started_at,
          updated_at: item.updated_at,
          next_at_cz_to_en: item.next_at_cz_to_en,
          mastered_at_cz_to_en: item.mastered_at_cz_to_en,
        },
      },
    ]);
  });

  it('loads every due CZ-to-EN item as one deck', async () => {
    mocks.dueItems = [
      makeItem({ item_id: 1, next_at_cz_to_en: '2026-01-01T00:00:00.000Z' }),
      makeItem({ item_id: 2, next_at_cz_to_en: '2026-01-02T00:00:00.000Z' }),
    ];

    const deck = await UserItem.getReviewDeck('u1', '2026-02-01T00:00:00.000Z');

    expect(deck.map((item) => item.item_id)).toEqual([1, 2]);
  });

  it('applies review outcomes without reverse-direction state', () => {
    const item = makeItem({ progress_cz_to_en: 2 });
    const updated = UserItem.applyPracticeProgress(
      item,
      'correct',
      '2026-02-01T00:00:00.000Z',
    );

    expect(updated.progress_cz_to_en).toBe(3);
    expect(updated.started_at).toBe(item.started_at);
    expect(Object.keys(updated).some((key) => key.includes('en_to_cz'))).toBe(false);
  });

  it('handles initial-training skip as a CZ-to-EN mastery', () => {
    const dateTime = '2026-02-01T00:00:00.000Z';
    const updated = UserItem.applyPracticeProgress(
      makeItem({ started_at: NULL_DATE, progress_cz_to_en: 2 }),
      'skip',
      dateTime,
      { initialTraining: true },
    );

    expect(updated).toMatchObject({
      started_at: NULL_DATE,
      progress_cz_to_en: 0,
      next_at_cz_to_en: NULL_DATE,
      mastered_at_cz_to_en: dateTime,
    });
  });

  it('preserves a local change made during incremental synchronization', async () => {
    const snapshot = makeItem({ item_id: 1, updated_at: '2026-01-10T00:00:00.000Z' });
    const changedLocally = makeItem({
      item_id: 1,
      progress_cz_to_en: 4,
      updated_at: '2026-01-20T00:00:00.000Z',
    });
    mocks.currentItems = [snapshot];
    mocks.rpc.mockImplementation(async () => {
      mocks.currentItems = [changedLocally];
      return { data: [toApiItem(snapshot, { progress_cz_to_en: 2 })], error: null };
    });

    await UserItem.syncFromRemote('u1', false);

    expect(mocks.rpc).toHaveBeenCalledWith(
      'upsert_fetch_user_items',
      expect.objectContaining({
        p_user_items: [expect.objectContaining({ item_id: 1, updated_at: snapshot.updated_at })],
      }),
    );
    expect(mocks.bulkPut).not.toHaveBeenCalled();
    expect(mocks.markAsSynced).not.toHaveBeenCalled();
    expect(mocks.currentItems).toEqual([changedLocally]);

    mocks.rpc.mockResolvedValue({ data: [], error: null });
    await UserItem.syncFromRemote('u1', false);

    expect(mocks.rpc).toHaveBeenNthCalledWith(
      2,
      'upsert_fetch_user_items',
      expect.objectContaining({
        p_user_items: [expect.objectContaining({
          item_id: 1,
          updated_at: changedLocally.updated_at,
          progress_cz_to_en: changedLocally.progress_cz_to_en,
        })],
      }),
    );
  });

  it('preserves a newly created local row during full synchronization', async () => {
    const snapshot = makeItem({ item_id: 1, updated_at: '2026-01-10T00:00:00.000Z' });
    const createdDuringSync = makeItem({
      item_id: 2,
      updated_at: '2026-01-20T00:00:00.000Z',
    });
    mocks.currentItems = [snapshot];
    mocks.getSyncTimestamps.mockResolvedValue({
      lastSyncedAt: '1970-01-01T00:00:00.000Z',
      newSyncedAt: '2026-02-01T00:00:00.000Z',
    });
    mocks.rpc.mockImplementation(async () => {
      mocks.currentItems = [snapshot, createdDuringSync];
      return { data: [toApiItem(snapshot)], error: null };
    });

    await UserItem.syncFromRemote('u1', true);

    expect(mocks.bulkDelete).toHaveBeenCalledWith([['u1', 1]]);
    expect(mocks.bulkPut).toHaveBeenCalledWith([expect.objectContaining({ item_id: 1 })]);
    expect(mocks.markAsSynced).not.toHaveBeenCalled();
  });
});

function toApiItem(item: UserItemLocal, overrides: Partial<UserItemLocal> = {}) {
  const merged = { ...item, ...overrides };
  return {
    ...merged,
    is_vocabulary: merged.is_vocabulary === 1,
    block_id: merged.block_id,
    topic_id: merged.topic_id,
    grammar_chunk_id: merged.grammar_chunk_id,
    started_at: merged.started_at === NULL_DATE ? null : merged.started_at,
    deleted_at: merged.deleted_at === NULL_DATE ? null : merged.deleted_at,
    next_at_cz_to_en: merged.next_at_cz_to_en === NULL_DATE ? null : merged.next_at_cz_to_en,
    mastered_at_cz_to_en: merged.mastered_at_cz_to_en === NULL_DATE ? null : merged.mastered_at_cz_to_en,
  };
}
