import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  metadataGet: vi.fn(),
  metadataPut: vi.fn(),
  metadataDelete: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: {
      nullReplacementUserId: '__none__',
      epochStartDate: '1970-01-01T00:00:00.000Z',
    },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    metadata: {
      get: (...args: unknown[]) => mocks.metadataGet(...args),
      put: (...args: unknown[]) => mocks.metadataPut(...args),
      delete: (...args: unknown[]) => mocks.metadataDelete(...args),
    },
  },
}));

import Metadata from '@/database/models/metadata';

describe('Metadata', () => {
  const tableName = 'grammar' as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.metadataDelete.mockResolvedValue(undefined);
  });

  describe('getSyncedAt', () => {
    it('returns stored synced_at for explicit user id', async () => {
      mocks.metadataGet.mockResolvedValue({ synced_at: '2026-02-28T09:00:00.000Z' });

      const result = await Metadata.getSyncedAt(tableName, 'u1');

      expect(mocks.metadataGet).toHaveBeenCalledWith(['grammar', 'u1']);
      expect(result).toBe('2026-02-28T09:00:00.000Z');
    });

    it('uses null replacement user id when userId is undefined', async () => {
      mocks.metadataGet.mockResolvedValue({ synced_at: '2026-02-28T08:00:00.000Z' });

      const result = await Metadata.getSyncedAt(tableName);

      expect(mocks.metadataGet).toHaveBeenCalledWith(['grammar', '__none__']);
      expect(result).toBe('2026-02-28T08:00:00.000Z');
    });

    it('returns epoch start date when no metadata row exists', async () => {
      mocks.metadataGet.mockResolvedValue(undefined);

      const result = await Metadata.getSyncedAt(tableName, null);

      expect(mocks.metadataGet).toHaveBeenCalledWith(['grammar', '__none__']);
      expect(result).toBe('1970-01-01T00:00:00.000Z');
    });
  });

  describe('markAsSynced', () => {
    it('writes sync row with explicit user id and returns true for truthy put result', async () => {
      mocks.metadataPut.mockResolvedValue(1);

      const ok = await Metadata.markAsSynced(tableName, '2026-02-28T10:00:00.000Z', 'u1');

      expect(mocks.metadataPut).toHaveBeenCalledWith({
        table_name: 'grammar',
        user_id: 'u1',
        synced_at: '2026-02-28T10:00:00.000Z',
      });
      expect(ok).toBe(true);
    });

    it('uses null replacement user id and returns false for falsy put result', async () => {
      mocks.metadataPut.mockResolvedValue(0);

      const ok = await Metadata.markAsSynced(tableName, '2026-02-28T11:00:00.000Z');

      expect(mocks.metadataPut).toHaveBeenCalledWith({
        table_name: 'grammar',
        user_id: '__none__',
        synced_at: '2026-02-28T11:00:00.000Z',
      });
      expect(ok).toBe(false);
    });
  });

  describe('deleteSyncRow', () => {
    it('deletes row by table and explicit user id and returns true', async () => {
      const ok = await Metadata.deleteSyncRow(tableName, 'u1');

      expect(mocks.metadataDelete).toHaveBeenCalledWith(['grammar', 'u1']);
      expect(ok).toBe(true);
    });

    it('uses null replacement user id when deleting without user id', async () => {
      const ok = await Metadata.deleteSyncRow(tableName);

      expect(mocks.metadataDelete).toHaveBeenCalledWith(['grammar', '__none__']);
      expect(ok).toBe(true);
    });
  });
});
