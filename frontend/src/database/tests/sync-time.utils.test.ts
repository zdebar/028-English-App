import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearSyncTimes,
  getFullSyncKey,
  getFullSyncTime,
  setFullSyncTime,
} from '@/database/utils/sync-time.utils';

describe('sync-time.utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('key helpers', () => {
    it('builds full sync key from prefix and user id', () => {
      expect(getFullSyncKey('user-1')).toBe('last-full-sync-at_user-1');
    });
  });

  describe('full sync time', () => {
    it('stores and returns full sync time for a user', () => {
      setFullSyncTime('user-1', 12345);

      expect(getFullSyncTime('user-1')).toBe(12345);
      expect(localStorage.getItem('last-full-sync-at_user-1')).toBe('12345');
    });

    it('returns 0 when full sync time is missing', () => {
      expect(getFullSyncTime('user-1')).toBe(0);
    });
  });

  describe('clearSyncTimes', () => {
    it('removes full sync time for a user', () => {
      setFullSyncTime('user-1', 111);

      clearSyncTimes('user-1');

      expect(getFullSyncTime('user-1')).toBe(0);
      expect(localStorage.getItem('last-full-sync-at_user-1')).toBeNull();
    });

    it('does not affect sync times of other users', () => {
      setFullSyncTime('user-1', 100);
      setFullSyncTime('user-2', 300);

      clearSyncTimes('user-1');

      expect(getFullSyncTime('user-1')).toBe(0);
      expect(getFullSyncTime('user-2')).toBe(300);
    });
  });
});
