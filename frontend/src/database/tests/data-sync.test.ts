import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getFullSyncTime: vi.fn(),
  setFullSyncTime: vi.fn(),
  initDbMappings: vi.fn(),
  withSettledSummary: vi.fn(),
  userItemSyncFromRemote: vi.fn(),
  userLessonSyncFromRemote: vi.fn(),
  userSettingsSyncFromRemote: vi.fn(),
  groupsSyncFromRemote: vi.fn(),
  groupItemsSyncFromRemote: vi.fn(),
  groupRelationsSyncFromRemote: vi.fn(),
  levelsSyncFromRemote: vi.fn(),
  lessonsSyncFromRemote: vi.fn(),
  audioSyncFromRemote: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    sync: {
      fullSyncInterval: 1000,
    },
    database: {
      nullReplacementDate: '9999-12-31T23:59:59+00:00',
    },
    audio: {
      archiveBucketName: 'archive-bucket',
    },
  },
}));

vi.mock('@/database/utils/sync-time.utils', () => ({
  getFullSyncTime: (...args: unknown[]) => mocks.getFullSyncTime(...args),
  setFullSyncTime: (...args: unknown[]) => mocks.setFullSyncTime(...args),
}));

vi.mock('@/database/models/db-init', () => ({
  initDbMappings: (...args: unknown[]) => mocks.initDbMappings(...args),
}));

vi.mock('@/features/logging/logging.utils', () => ({
  withSettledSummary: async (promises: Promise<unknown>[], ...args: unknown[]) => {
    await Promise.allSettled(promises);
    return mocks.withSettledSummary(promises, ...args);
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.userItemSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/user-lessons', () => ({
  default: { syncFromRemote: (...args: unknown[]) => mocks.userLessonSyncFromRemote(...args) },
}));
vi.mock('@/database/models/user-settings', () => ({
  default: { syncFromRemote: (...args: unknown[]) => mocks.userSettingsSyncFromRemote(...args) },
}));

vi.mock('@/database/models/groups', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.groupsSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/group-items', () => ({
  default: { syncFromRemote: (...args: unknown[]) => mocks.groupItemsSyncFromRemote(...args) },
}));

vi.mock('@/database/models/group-relations', () => ({
  default: { syncFromRemote: (...args: unknown[]) => mocks.groupRelationsSyncFromRemote(...args) },
}));

vi.mock('@/database/models/levels', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.levelsSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/lessons', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.lessonsSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/audio-records', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.audioSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    metadata: {},
    transaction: vi.fn(),
  },
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    auth: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
    },
  },
}));

import { dataSync, dataSyncOnUnmount } from '@/database/utils/data-sync.utils';
import { splitDeleted } from '@/database/utils/sync-generic.utils';

describe('data-sync.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getFullSyncTime.mockReturnValue(0);
    mocks.initDbMappings.mockResolvedValue(undefined);
    mocks.withSettledSummary.mockResolvedValue({ total: 10, success: 10, failed: 0 });

    mocks.userItemSyncFromRemote.mockResolvedValue(undefined);
    mocks.userLessonSyncFromRemote.mockResolvedValue(0);
    mocks.userSettingsSyncFromRemote.mockResolvedValue(undefined);
    mocks.groupsSyncFromRemote.mockResolvedValue(undefined);
    mocks.groupItemsSyncFromRemote.mockResolvedValue(undefined);
    mocks.groupRelationsSyncFromRemote.mockResolvedValue(undefined);
    mocks.levelsSyncFromRemote.mockResolvedValue(undefined);
    mocks.lessonsSyncFromRemote.mockResolvedValue(undefined);
    mocks.audioSyncFromRemote.mockResolvedValue(undefined);
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dataSync runs full sync and stores full sync time', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(5000);
    mocks.getFullSyncTime.mockReturnValue(0);

    await dataSync('u1');

    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1', true);
    expect(mocks.userLessonSyncFromRemote).toHaveBeenCalledWith('u1', true);
    expect(mocks.userSettingsSyncFromRemote).toHaveBeenCalledWith('u1');
    expect(mocks.groupsSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.groupItemsSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.groupRelationsSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.levelsSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.lessonsSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.setFullSyncTime).toHaveBeenCalledWith('u1', 5000);
  });

  it('dataSync runs partial sync and does not store full sync time', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(500);
    mocks.getFullSyncTime.mockReturnValue(0);

    await dataSync('u1');

    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1', false);
    expect(mocks.userLessonSyncFromRemote).toHaveBeenCalledWith('u1', false);
    expect(mocks.userSettingsSyncFromRemote).toHaveBeenCalledWith('u1');
    expect(mocks.groupsSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.groupItemsSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.groupRelationsSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.levelsSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.lessonsSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.setFullSyncTime).not.toHaveBeenCalled();
  });

  it('dataSync throws when user sync reports rejected results', async () => {
    mocks.withSettledSummary.mockResolvedValueOnce({ total: 10, success: 9, failed: 1 });

    await expect(dataSync('u1')).rejects.toThrow('Data synchronization error');
  });

  it('dataSyncOnUnmount syncs only user stores in partial mode', async () => {
    await dataSyncOnUnmount('u1');

    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1', false);
    expect(mocks.userLessonSyncFromRemote).toHaveBeenCalledWith('u1', false);
    expect(mocks.userSettingsSyncFromRemote).toHaveBeenCalledWith('u1');
  });

  it('dataSyncOnUnmount does nothing when no auth session exists', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });

    await dataSyncOnUnmount('u1');

    expect(mocks.userItemSyncFromRemote).not.toHaveBeenCalled();
  });

  it('splitDeleted splits records into upsert and delete groups', () => {
    const result = splitDeleted([
      { id: 1, deleted_at: null },
      { id: 2, deleted_at: '2026-03-04T00:00:00.000Z' },
    ]);

    expect(result.toUpsert).toEqual([{ id: 1, deleted_at: null }]);
    expect(result.toDelete).toEqual([{ id: 2, deleted_at: '2026-03-04T00:00:00.000Z' }]);
  });
});
