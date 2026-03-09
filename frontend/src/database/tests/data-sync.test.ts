import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getFullSyncTime: vi.fn(),
  setFullSyncTime: vi.fn(),
  initDbMappings: vi.fn(),
  restoreUnsavedFromLocalStorage: vi.fn(),
  logRejectedResults: vi.fn(),
  userScoreSyncFromRemote: vi.fn(),
  userItemSyncFromRemote: vi.fn(),
  grammarSyncFromRemote: vi.fn(),
  levelsSyncFromRemote: vi.fn(),
  lessonsSyncFromRemote: vi.fn(),
  audioSyncFromRemote: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    sync: {
      fullSyncInterval: 1000,
    },
    audio: {
      archives: ['pack-a.zip', 'pack-b.zip'],
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
  logRejectedResults: (...args: unknown[]) => mocks.logRejectedResults(...args),
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.userScoreSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    syncFromRemote: (...args: unknown[]) => mocks.userItemSyncFromRemote(...args),
  },
}));

vi.mock('@/database/models/grammar', () => ({
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

vi.mock('@/database/models/db', () => ({
  db: {
    metadata: {},
    transaction: vi.fn(),
  },
}));

import { audioSync, dataSyncOnUnmount, splitDeleted } from '@/database/utils/data-sync.utils';

describe('data-sync.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getFullSyncTime.mockReturnValue(0);
    mocks.initDbMappings.mockResolvedValue(undefined);
    mocks.restoreUnsavedFromLocalStorage.mockResolvedValue(undefined);
    mocks.logRejectedResults.mockReturnValue(false);

    mocks.userScoreSyncFromRemote.mockResolvedValue(undefined);
    mocks.userItemSyncFromRemote.mockResolvedValue(undefined);
    mocks.grammarSyncFromRemote.mockResolvedValue(undefined);
    mocks.levelsSyncFromRemote.mockResolvedValue(undefined);
    mocks.lessonsSyncFromRemote.mockResolvedValue(undefined);
    mocks.audioSyncFromRemote.mockResolvedValue(undefined);
  });

  it('dataSync runs full sync and stores full sync time', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(5000);
    mocks.getFullSyncTime.mockReturnValue(0);

    await audioSync('u1');

    expect(mocks.userScoreSyncFromRemote).toHaveBeenCalledWith('u1', true);
    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1', true);
    expect(mocks.grammarSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.levelsSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.lessonsSyncFromRemote).toHaveBeenCalledWith(true);
    expect(mocks.audioSyncFromRemote).toHaveBeenCalledWith(['pack-a.zip', 'pack-b.zip']);
    expect(mocks.setFullSyncTime).toHaveBeenCalledWith('u1', 5000);
  });

  it('dataSync runs partial sync and does not store full sync time', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(500);
    mocks.getFullSyncTime.mockReturnValue(0);

    await audioSync('u1');

    expect(mocks.userScoreSyncFromRemote).toHaveBeenCalledWith('u1', false);
    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1', false);
    expect(mocks.grammarSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.levelsSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.lessonsSyncFromRemote).toHaveBeenCalledWith(false);
    expect(mocks.setFullSyncTime).not.toHaveBeenCalled();
  });

  it('dataSync throws when user sync reports rejected results', async () => {
    mocks.logRejectedResults.mockReturnValueOnce(false).mockReturnValueOnce(true);

    await expect(audioSync('u1')).rejects.toThrow('Data synchronization error');
  });

  it('dataSyncOnUnmount syncs only user stores in partial mode', async () => {
    await dataSyncOnUnmount('u1');

    expect(mocks.userScoreSyncFromRemote).toHaveBeenCalledWith('u1', false);
    expect(mocks.userItemSyncFromRemote).toHaveBeenCalledWith('u1', false);
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
