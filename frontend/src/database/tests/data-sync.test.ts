import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getFullSyncTime: vi.fn(),
  getPartialSyncTime: vi.fn(),
  setFullSyncTime: vi.fn(),
  setPartialSyncTime: vi.fn(),
  initDbMappings: vi.fn(),
  restoreUnsavedFromLocalStorage: vi.fn(),
  triggerUserItemsUpdatedEvent: vi.fn(),
  userScoreSyncAll: vi.fn(),
  userScoreSyncSince: vi.fn(),
  userItemSyncAll: vi.fn(),
  userItemSyncSince: vi.fn(),
  grammarSyncAll: vi.fn(),
  grammarSyncSince: vi.fn(),
  audioSyncData: vi.fn(),
  audioRemoveOrphaned: vi.fn(),
  errorHandler: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    sync: {
      fullSyncInterval: 1000,
      periodicSyncInterval: 500,
    },
    audio: {
      archives: ['pack-a.zip', 'pack-b.zip'],
    },
  },
}));

vi.mock('@/database/sync-time.utils', () => ({
  getFullSyncTime: (...args: unknown[]) => mocks.getFullSyncTime(...args),
  getPartialSyncTime: (...args: unknown[]) => mocks.getPartialSyncTime(...args),
  setFullSyncTime: (...args: unknown[]) => mocks.setFullSyncTime(...args),
  setPartialSyncTime: (...args: unknown[]) => mocks.setPartialSyncTime(...args),
}));

vi.mock('@/database/models/db-init', () => ({
  initDbMappings: (...args: unknown[]) => mocks.initDbMappings(...args),
}));

vi.mock('@/database/database.utils', () => ({
  restoreUnsavedFromLocalStorage: (...args: unknown[]) =>
    mocks.restoreUnsavedFromLocalStorage(...args),
  triggerUserItemsUpdatedEvent: (...args: unknown[]) => mocks.triggerUserItemsUpdatedEvent(...args),
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    syncUserScoreAll: (...args: unknown[]) => mocks.userScoreSyncAll(...args),
    syncUserScoreSinceLastSync: (...args: unknown[]) => mocks.userScoreSyncSince(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    syncUserItemsAll: (...args: unknown[]) => mocks.userItemSyncAll(...args),
    syncUserItemsSinceLastSync: (...args: unknown[]) => mocks.userItemSyncSince(...args),
  },
}));

vi.mock('@/database/models/grammar', () => ({
  default: {
    syncGrammarAll: (...args: unknown[]) => mocks.grammarSyncAll(...args),
    syncGrammarSinceLastSync: (...args: unknown[]) => mocks.grammarSyncSince(...args),
  },
}));

vi.mock('@/database/models/audio-records', () => ({
  default: {
    syncAudioData: (...args: unknown[]) => mocks.audioSyncData(...args),
    removeOrphaned: (...args: unknown[]) => mocks.audioRemoveOrphaned(...args),
  },
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => mocks.errorHandler(...args),
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {
    auth: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
    },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    syncSuccessToast: 'sync-success',
    syncErrorToast: 'sync-error',
  },
}));

import { dataSync, dataSyncOnUnmount, startPeriodicSync } from '@/database/models/data-sync';

async function flushAsyncWork(): Promise<void> {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

describe('data-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mocks.getFullSyncTime.mockReturnValue(0);
    mocks.getPartialSyncTime.mockReturnValue(0);

    mocks.initDbMappings.mockResolvedValue(undefined);
    mocks.restoreUnsavedFromLocalStorage.mockResolvedValue(undefined);
    mocks.userScoreSyncAll.mockResolvedValue(undefined);
    mocks.userItemSyncAll.mockResolvedValue(undefined);
    mocks.userScoreSyncSince.mockResolvedValue(undefined);
    mocks.userItemSyncSince.mockResolvedValue(undefined);
    mocks.grammarSyncAll.mockResolvedValue(undefined);
    mocks.grammarSyncSince.mockResolvedValue(undefined);
    mocks.audioSyncData.mockResolvedValue(undefined);
    mocks.audioRemoveOrphaned.mockResolvedValue(0);
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
  });

  describe('dataSync', () => {
    it('runs full sync path and stores both full and partial sync times', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(5000);
      mocks.getFullSyncTime.mockReturnValue(0);

      await dataSync('u1');

      expect(mocks.userScoreSyncAll).toHaveBeenCalledWith('u1');
      expect(mocks.userItemSyncAll).toHaveBeenCalledWith('u1');
      expect(mocks.grammarSyncAll).toHaveBeenCalled();
      expect(mocks.audioSyncData).toHaveBeenCalledWith(['pack-a.zip', 'pack-b.zip']);
      expect(mocks.setFullSyncTime).toHaveBeenCalledWith('u1', 5000);
      expect(mocks.setPartialSyncTime).toHaveBeenCalledWith('u1', 5000);
      expect(mocks.triggerUserItemsUpdatedEvent).toHaveBeenCalledTimes(2);
    });

    it('runs partial sync path and sets only partial sync time', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(900);
      mocks.getFullSyncTime.mockReturnValue(0);

      await dataSync('u1');

      expect(mocks.userScoreSyncSince).toHaveBeenCalledWith('u1');
      expect(mocks.userItemSyncSince).toHaveBeenCalledWith('u1');
      expect(mocks.grammarSyncSince).toHaveBeenCalled();
      expect(mocks.setFullSyncTime).not.toHaveBeenCalled();
      expect(mocks.setPartialSyncTime).toHaveBeenCalledWith('u1', 900);
    });

    it('throws first user promise error and logs it', async () => {
      const userError = new Error('user sync failed');
      mocks.userScoreSyncSince.mockRejectedValue(userError);
      vi.spyOn(Date, 'now').mockReturnValue(900);

      await expect(dataSync('u1')).rejects.toThrow('user sync failed');

      expect(mocks.errorHandler).toHaveBeenCalledWith('Data synchronization error:', userError);
    });
  });

  describe('dataSyncOnUnmount', () => {
    it('returns early when active session user does not match', async () => {
      mocks.getSession.mockResolvedValue({
        data: { session: { user: { id: 'other' } } },
        error: null,
      });

      await dataSyncOnUnmount('u1');

      expect(mocks.initDbMappings).not.toHaveBeenCalled();
      expect(mocks.userScoreSyncSince).not.toHaveBeenCalled();
      expect(mocks.userItemSyncSince).not.toHaveBeenCalled();
    });

    it('syncs user data and logs any unmount sync rejection', async () => {
      const unmountError = new Error('unmount fail');
      mocks.userItemSyncSince.mockRejectedValue(unmountError);

      await dataSyncOnUnmount('u1');

      expect(mocks.initDbMappings).toHaveBeenCalled();
      expect(mocks.userScoreSyncSince).toHaveBeenCalledWith('u1');
      expect(mocks.userItemSyncSince).toHaveBeenCalledWith('u1');
      expect(mocks.errorHandler).toHaveBeenCalledWith(
        'Unmount synchronization failed',
        unmountError,
      );
    });
  });

  describe('startPeriodicSync', () => {
    it('runs immediate sync success path and toggles loading', async () => {
      vi.useFakeTimers();
      const setLoading = vi.fn();
      const showToast = vi.fn();

      const dispose = startPeriodicSync('u1', setLoading, showToast);
      await vi.advanceTimersByTimeAsync(10);
      await flushAsyncWork();

      expect(mocks.audioRemoveOrphaned).toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith('sync-success', 'success');
      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      dispose();
    });

    it('runs periodic check and updates partial sync time when interval elapsed', async () => {
      vi.useFakeTimers();
      vi.spyOn(Date, 'now').mockReturnValue(2000);
      mocks.getPartialSyncTime.mockReturnValue(0);

      const setLoading = vi.fn();
      const showToast = vi.fn();

      const dispose = startPeriodicSync('u1', setLoading, showToast);
      await vi.advanceTimersByTimeAsync(500);

      expect(mocks.setPartialSyncTime).toHaveBeenCalledWith('u1', 2000);

      dispose();
    });

    it('cleanup triggers unmount sync when userId exists', async () => {
      vi.useFakeTimers();
      const setLoading = vi.fn();
      const showToast = vi.fn();

      const dispose = startPeriodicSync('u1', setLoading, showToast);
      dispose();
      await flushAsyncWork();

      expect(mocks.getSession).toHaveBeenCalled();
    });
  });
});
