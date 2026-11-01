import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '@/config/config';

const mocks = vi.hoisted(() => ({
  initDbMappings: vi.fn(),
  summarizeSettledResults: vi.fn(),
  userItemSyncFromRemote: vi.fn(),
  userLessonSyncFromRemote: vi.fn(),
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
    sync: {},
    database: {
      nullReplacementDate: '9999-12-31T23:59:59+00:00',
    },
    audio: {
      archiveBucketName: 'archive-bucket',
    },
  },
}));

vi.mock('@/database/models/db-init', () => ({
  initDbMappings: (...args: unknown[]) => mocks.initDbMappings(...args),
}));

vi.mock('@/features/logging/logging.utils', () => ({
  summarizeSettledResults: (...args: unknown[]) => mocks.summarizeSettledResults(...args),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.userItemSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/user-lessons', () => ({
  default: { syncFromRemote: (...args: unknown[]) => mocks.userLessonSyncFromRemote(...args) },
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

import { dataSync, dataSyncBeforeSessionEnd } from '@/database/sync/data-sync';
import { splitDeleted } from '@/database/sync/sync-helpers';

describe('data synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.initDbMappings.mockResolvedValue(undefined);
    mocks.summarizeSettledResults.mockReturnValue({ total: 8, success: 8, failed: 0 });

    mocks.userItemSyncFromRemote.mockResolvedValue(undefined);
    mocks.userLessonSyncFromRemote.mockResolvedValue(0);
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

  it('dataSync runs date-based sync for each table', async () => {
    await dataSync('u1');

    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1');
    expect(mocks.userLessonSyncFromRemote).toHaveBeenCalledWith('u1');
    expect(mocks.groupsSyncFromRemote).toHaveBeenCalledWith();
    expect(mocks.groupItemsSyncFromRemote).toHaveBeenCalledWith();
    expect(mocks.groupRelationsSyncFromRemote).toHaveBeenCalledWith();
    expect(mocks.levelsSyncFromRemote).toHaveBeenCalledWith();
    expect(mocks.lessonsSyncFromRemote).toHaveBeenCalledWith();
  });

  it('dataSync throws when user sync reports rejected results', async () => {
    mocks.summarizeSettledResults.mockReturnValueOnce({ total: 8, success: 7, failed: 1 });

    await expect(dataSync('u1')).rejects.toThrow('Data synchronization error');
  });

  it('dataSyncBeforeSessionEnd syncs only user stores', async () => {
    await dataSyncBeforeSessionEnd('u1');

    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1');
    expect(mocks.userLessonSyncFromRemote).toHaveBeenCalledWith('u1');
  });

  it('dataSyncBeforeSessionEnd does nothing when no auth session exists', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });

    await dataSyncBeforeSessionEnd('u1');

    expect(mocks.userItemSyncFromRemote).not.toHaveBeenCalled();
  });

  it('splitDeleted splits records into upsert and delete groups', () => {
    const result = splitDeleted([
      { id: 1, deleted_at: null },
      { id: 2, deleted_at: '2026-03-04T00:00:00.000Z' },
      { id: 3, deleted_at: config.database.nullReplacementDate },
    ]);

    expect(result.toUpsert).toEqual([
      { id: 1, deleted_at: null },
      { id: 3, deleted_at: config.database.nullReplacementDate },
    ]);
    expect(result.toDelete).toEqual([{ id: 2, deleted_at: '2026-03-04T00:00:00.000Z' }]);
  });
});
