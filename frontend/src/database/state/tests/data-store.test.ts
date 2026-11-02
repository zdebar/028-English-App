import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import config from '@/config/config';
import type { UserItemLocal } from '@/types/user-item.types';
import UserItem from '@/database/models/user-items';
import { usePracticeAvailabilityBoundary } from '@/features/practice/hooks/use-practice-availability-boundary';

const mocks = vi.hoisted(() => ({
  rows: {
    levels: [] as unknown[],
    lessons: [] as unknown[],
    notes: [] as unknown[],
    groups: [] as unknown[],
    group_items: [] as unknown[],
    group_relations: [] as unknown[],
    user_items: [] as unknown[],
    user_lessons: [] as unknown[],
  },
  loadUserItems: vi.fn(),
  userItemUpdate: vi.fn(),
}));

vi.mock('@/database/models/db', () => {
  const table = (name: keyof typeof mocks.rows) => ({
    toArray: () => Promise.resolve(mocks.rows[name]),
    where: () => ({
      equals: (userId: string) => ({
        toArray: () => name === 'user_items'
          ? mocks.loadUserItems(userId)
          : Promise.resolve(mocks.rows[name].filter((row) => (row as { user_id?: string }).user_id === userId)),
      }),
    }),
  });
  return {
    db: {
      levels: table('levels'),
      lessons: table('lessons'),
      notes: table('notes'),
      groups: table('groups'),
      group_items: table('group_items'),
      group_relations: table('group_relations'),
      user_items: {
        ...table('user_items'),
        update: (...args: unknown[]) => mocks.userItemUpdate(...args),
      },
      user_lessons: table('user_lessons'),
      transaction: async (...args: unknown[]) => {
        const callback = args.at(-1);
        if (typeof callback !== 'function') throw new Error('Missing transaction callback');
        return callback();
      },
    },
  };
});

import {
  applyRemoteDataChanges,
  dataManagerStore,
  initializeDataManager,
  mergeAppDataChanges,
  publishDataChanges,
  resetDataManager,
} from '../data-store';
import { EMPTY_APP_DATA, EMPTY_REVIEW_ARRAYS } from '../data-types';

describe('central data manager', () => {
  beforeEach(() => {
    resetDataManager();
    vi.clearAllMocks();
    FakeBroadcastChannel.instances.length = 0;
    vi.stubGlobal('BroadcastChannel', undefined);
    for (const rows of Object.values(mocks.rows)) rows.length = 0;
    mocks.loadUserItems.mockImplementation((userId: string) =>
      Promise.resolve(mocks.rows.user_items.filter((row) => (row as { user_id?: string }).user_id === userId)),
    );
    mocks.userItemUpdate.mockResolvedValue(1);
  });

  afterEach(() => {
    resetDataManager();
    vi.unstubAllGlobals();
  });

  it('loads shared tables and only the active account rows', async () => {
    mocks.rows.levels.push({ id: 1 });
    mocks.rows.user_items.push({ item_id: 1, user_id: 'u1' }, { item_id: 2, user_id: 'u2' });
    mocks.rows.user_lessons.push({ user_id: 'u1', lesson_id: 1 }, { user_id: 'u2', lesson_id: 2 });

    await initializeDataManager('u1');

    expect(dataManagerStore.getState()).toMatchObject({
      userId: 'u1',
      status: 'ready',
      levels: [{ id: 1 }],
      user_items: [{ item_id: 1, user_id: 'u1' }],
      user_lessons: [{ user_id: 'u1', lesson_id: 1 }],
    });
  });

  it('ignores a delayed bootstrap after the active account changes', async () => {
    const oldItems = deferred<unknown[]>();
    const activeItems = deferred<unknown[]>();
    mocks.loadUserItems.mockImplementation((userId: string) =>
      userId === 'u1' ? oldItems.promise : activeItems.promise,
    );

    const oldLoad = initializeDataManager('u1');
    const activeLoad = initializeDataManager('u2');
    activeItems.resolve([{ item_id: 2, user_id: 'u2' }]);
    await activeLoad;
    oldItems.resolve([{ item_id: 1, user_id: 'u1' }]);
    await oldLoad;

    expect(dataManagerStore.getState().userId).toBe('u2');
    expect(dataManagerStore.getState().user_items).toEqual([{ item_id: 2, user_id: 'u2' }]);
  });

  it('applies committed upserts and deletions as one store update', async () => {
    mocks.rows.levels.push({ id: 1, name: 'Before' });
    mocks.rows.user_items.push({ item_id: 1, user_id: 'u1' }, { item_id: 2, user_id: 'u1' });
    await initializeDataManager('u1');
    const listener = vi.fn();
    const unsubscribe = dataManagerStore.subscribe(listener);

    publishDataChanges('u1', {
      levels: { upserted: [{ id: 1, name: 'After' }, { id: 2, name: 'New' }] as never[] },
      user_items: { upserted: [{ item_id: 3, user_id: 'u1' }] as never[], deleted: [1] },
    });

    expect(listener).toHaveBeenCalledOnce();
    expect(dataManagerStore.getState().levels).toEqual([{ id: 1, name: 'After' }, { id: 2, name: 'New' }]);
    expect(dataManagerStore.getState().user_items.map((item) => item.item_id)).toEqual([2, 3]);
    unsubscribe();
  });

  it('merges table changes by keeping the last operation for each key', () => {
    const changes = mergeAppDataChanges([
      { levels: { upserted: [{ id: 1, name: 'Old' }] as never[] } },
      { levels: { deleted: [1], upserted: [{ id: 2, name: 'Other' }] as never[] } },
      { levels: { upserted: [{ id: 1, name: 'Latest' }] as never[] } },
    ]);

    expect(changes.levels).toEqual({
      upserted: [{ id: 2, name: 'Other' }, { id: 1, name: 'Latest' }],
      deleted: [],
    });
  });

  it('applies shared changes from another account but ignores its user-specific rows', async () => {
    await initializeDataManager('u1');

    applyRemoteDataChanges('u2', {
      levels: { upserted: [{ id: 1 }] as never[] },
      user_items: { upserted: [{ item_id: 3, user_id: 'u2' }] as never[] },
      user_lessons: { upserted: [{ user_id: 'u2', lesson_id: 4, started_at: '2026-01-01' }] as never[] },
    });
    applyRemoteDataChanges('u1', {
      user_items: { upserted: [{ item_id: 1, user_id: 'u2' }, { item_id: 2, user_id: 'u1' }] as never[] },
    });

    expect(dataManagerStore.getState().levels).toEqual([{ id: 1 }]);
    expect(dataManagerStore.getState().user_items).toEqual([{ item_id: 2, user_id: 'u1' }]);
    expect(dataManagerStore.getState().user_lessons).toEqual([]);
  });

  it('broadcasts deltas and applies matching cross-tab messages', async () => {
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    await initializeDataManager('u1');
    const channel = FakeBroadcastChannel.instances[0];

    publishDataChanges('u1', { levels: { upserted: [{ id: 2 }] as never[] } });
    expect(channel?.posted[0]).toMatchObject({ userId: 'u1', changes: { levels: { upserted: [{ id: 2 }] } } });

    channel?.dispatch({
      source: 'other-tab',
      userId: 'u1',
      changes: { levels: { upserted: [{ id: 3 }] as never[] } },
    });
    expect(dataManagerStore.getState().levels).toEqual([{ id: 2 }, { id: 3 }]);
  });

  it('keeps a committed write alive through unmount and publishes it after commit', async () => {
    const original = createUserItem();
    const updated = { ...original, progress_cz_to_en: 3, updated_at: '2026-02-01T00:00:00.000Z' };
    setReadyUserItems([original]);
    const commit = deferred<number>();
    mocks.userItemUpdate.mockReturnValueOnce(commit.promise);
    const { result, unmount } = renderHook(() => usePracticeAvailabilityBoundary('u1'));
    let write!: Promise<void>;

    act(() => {
      write = result.current.trackPracticeWrite(UserItem.saveInitialTrainingProgress(updated));
    });
    unmount();
    commit.resolve(1);
    await write;

    expect(dataManagerStore.getState().user_items[0]?.progress_cz_to_en).toBe(3);
  });

  it('does not publish a write whose IndexedDB transaction fails', async () => {
    const original = createUserItem();
    setReadyUserItems([original]);
    mocks.userItemUpdate.mockRejectedValueOnce(new Error('IndexedDB failed'));

    await expect(UserItem.saveInitialTrainingProgress({ ...original, progress_cz_to_en: 4 }))
      .rejects.toThrow('IndexedDB failed');

    expect(dataManagerStore.getState().user_items).toEqual([original]);
  });
});

class FakeBroadcastChannel {
  static readonly instances: FakeBroadcastChannel[] = [];
  readonly posted: unknown[] = [];
  private listener: ((event: MessageEvent) => void) | null = null;

  constructor(_name: string) {
    FakeBroadcastChannel.instances.push(this);
  }

  addEventListener(_type: string, listener: (event: MessageEvent) => void): void {
    this.listener = listener;
  }

  postMessage(message: unknown): void {
    this.posted.push(message);
  }

  dispatch(data: unknown): void {
    this.listener?.({ data } as MessageEvent);
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function setReadyUserItems(userItems: readonly UserItemLocal[]): void {
  dataManagerStore.setState({
    ...EMPTY_APP_DATA,
    userId: 'u1',
    status: 'ready',
    error: null,
    nowIso: '2026-02-01T00:00:00.000Z',
    localDate: '2026-02-01',
    user_items: userItems,
    reviewArrays: EMPTY_REVIEW_ARRAYS,
    nextInitialLesson: null,
  });
}

function createUserItem(): UserItemLocal {
  const nullDate = config.database.nullReplacementDate;
  return {
    user_id: 'u1', item_id: 1, czech: 'ahoj', czech_description: null, english: 'hello', pronunciation: 'hello',
    audio: null, sort_order: 1, curriculum_sort_path: [1, 1, 1], progress_cz_to_en: 0, progress_en_to_cz: 0,
    is_cz_to_en_enabled: true, is_en_to_cz_enabled: true, note_id: null, lesson_id: 1,
    updated_at: '2026-01-01T00:00:00.000Z', is_vocabulary: 1, started_at: '2026-01-01T00:00:00.000Z',
    deleted_at: nullDate, next_at_cz_to_en: nullDate, mastered_at_cz_to_en: nullDate,
    next_at_en_to_cz: nullDate, mastered_at_en_to_cz: nullDate,
  };
}
