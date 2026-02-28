import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearSyncTimes,
  getFullSyncKey,
  getFullSyncTime,
  getPartialSyncKey,
  getPartialSyncTime,
  setFullSyncTime,
  setPartialSyncTime,
} from '@/database/sync-time.utils';

describe('sync-time.utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('key helpers', () => {
    it('builds full sync key from prefix and user id', () => {
      expect(getFullSyncKey('user-1')).toBe('last-full-sync-at_user-1');
    });

    it('builds partial sync key from prefix and user id', () => {
      expect(getPartialSyncKey('user-1')).toBe('last-partial-sync-at_user-1');
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

  describe('partial sync time', () => {
    it('stores and returns partial sync time for a user', () => {
      setPartialSyncTime('user-1', 67890);

      expect(getPartialSyncTime('user-1')).toBe(67890);
      expect(localStorage.getItem('last-partial-sync-at_user-1')).toBe('67890');
    });

    it('returns 0 when partial sync time is missing', () => {
      expect(getPartialSyncTime('user-1')).toBe(0);
    });
  });

  describe('clearSyncTimes', () => {
    it('removes both full and partial sync times for a user', () => {
      setFullSyncTime('user-1', 111);
      setPartialSyncTime('user-1', 222);

      clearSyncTimes('user-1');

      expect(getFullSyncTime('user-1')).toBe(0);
      expect(getPartialSyncTime('user-1')).toBe(0);
      expect(localStorage.getItem('last-full-sync-at_user-1')).toBeNull();
      expect(localStorage.getItem('last-partial-sync-at_user-1')).toBeNull();
    });

    it('does not affect sync times of other users', () => {
      setFullSyncTime('user-1', 100);
      setPartialSyncTime('user-1', 200);
      setFullSyncTime('user-2', 300);
      setPartialSyncTime('user-2', 400);

      clearSyncTimes('user-1');

      expect(getFullSyncTime('user-1')).toBe(0);
      expect(getPartialSyncTime('user-1')).toBe(0);
      expect(getFullSyncTime('user-2')).toBe(300);
      expect(getPartialSyncTime('user-2')).toBe(400);
    });
  });
});
