import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getFullSyncTime: vi.fn(),
  setFullSyncTime: vi.fn(),
  initDbMappings: vi.fn(),
  restoreUnsavedFromLocalStorage: vi.fn(),
  withSettledSummary: vi.fn(),
  userItemSyncFromRemote: vi.fn(),
  blockSyncFromRemote: vi.fn(),
  grammarSyncFromRemote: vi.fn(),
  levelsSyncFromRemote: vi.fn(),
  lessonsSyncFromRemote: vi.fn(),
  audioSyncFromRemote: vi.fn(),
  pronunciationGroupSyncFromRemote: vi.fn(),
  pronunciationGroupItemSyncFromRemote: vi.fn(),
  grammarChunkExampleSyncFromRemote: vi.fn(),
  topicSyncFromRemote: vi.fn(),
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

vi.mock('@/database/utils/database.utils', () => ({
  restoreUnsavedFromLocalStorage: (...args: unknown[]) =>
    mocks.restoreUnsavedFromLocalStorage(...args),
}));

vi.mock('@/features/logging/logging.utils', () => ({
  withSettledSummary: (...args: unknown[]) => mocks.withSettledSummary(...args),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.userItemSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/blocks', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.blockSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/grammar-chunks', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.grammarSyncFromRemote(...args),
  },
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

vi.mock('@/database/models/pronunciation-groups', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.pronunciationGroupSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/pronunciation-group-items', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.pronunciationGroupItemSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/grammar-chunk-examples', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.grammarChunkExampleSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/topics', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.topicSyncFromRemote(...args),
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
    mocks.restoreUnsavedFromLocalStorage.mockResolvedValue(undefined);
    mocks.withSettledSummary.mockResolvedValue({ total: 10, success: 10, failed: 0 });

    mocks.userItemSyncFromRemote.mockResolvedValue(undefined);
    mocks.blockSyncFromRemote.mockResolvedValue(undefined);
    mocks.grammarSyncFromRemote.mockResolvedValue(undefined);
    mocks.levelsSyncFromRemote.mockResolvedValue(undefined);
    mocks.lessonsSyncFromRemote.mockResolvedValue(undefined);
    mocks.audioSyncFromRemote.mockResolvedValue(undefined);
    mocks.pronunciationGroupSyncFromRemote.mockResolvedValue(undefined);
    mocks.pronunciationGroupItemSyncFromRemote.mockResolvedValue(undefined);
    mocks.grammarChunkExampleSyncFromRemote.mockResolvedValue(undefined);
    mocks.topicSyncFromRemote.mockResolvedValue(undefined);
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
    expect(mocks.blockSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.grammarSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.levelsSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.lessonsSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.pronunciationGroupSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.pronunciationGroupItemSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.grammarChunkExampleSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.topicSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.setFullSyncTime).toHaveBeenCalledWith('u1', 5000);
  });

  it('dataSync runs partial sync and does not store full sync time', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(500);
    mocks.getFullSyncTime.mockReturnValue(0);

    await dataSync('u1');

    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1', false);
    expect(mocks.blockSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.grammarSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.levelsSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.lessonsSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.pronunciationGroupSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.pronunciationGroupItemSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.grammarChunkExampleSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.topicSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.setFullSyncTime).not.toHaveBeenCalled();
  });

  it('dataSync throws when user sync reports rejected results', async () => {
    mocks.withSettledSummary.mockResolvedValueOnce({ total: 10, success: 9, failed: 1 });

    await expect(dataSync('u1')).rejects.toThrow('Data synchronization error');
  });

  it('dataSyncOnUnmount syncs only user stores in partial mode', async () => {
    await dataSyncOnUnmount('u1');

    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1', false);
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
