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
  const sharedTable = 'grammar' as any;
  const userTable = 'user_items' as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.metadataDelete.mockResolvedValue(undefined);
  });

  describe('getSyncedAt', () => {
    it('returns stored synced_at for shared table without user id', async () => {
      mocks.metadataGet.mockResolvedValue({ synced_at: '2026-02-28T09:00:00.000Z' });

      const result = await Metadata.getSyncedAt(sharedTable);

      expect(mocks.metadataGet).toHaveBeenCalledWith(['grammar', '__none__']);
      expect(result).toBe('2026-02-28T09:00:00.000Z');
    });

    it('returns stored synced_at for user table with explicit user id', async () => {
      mocks.metadataGet.mockResolvedValue({ synced_at: '2026-02-28T08:00:00.000Z' });

      const result = await Metadata.getSyncedAt(userTable, 'u1');

      expect(mocks.metadataGet).toHaveBeenCalledWith(['user_items', 'u1']);
      expect(result).toBe('2026-02-28T08:00:00.000Z');
    });

    it('returns epoch start date when no metadata row exists', async () => {
      mocks.metadataGet.mockResolvedValue(undefined);

      const result = await Metadata.getSyncedAt(sharedTable);

      expect(mocks.metadataGet).toHaveBeenCalledWith(['grammar', '__none__']);
      expect(result).toBe('1970-01-01T00:00:00.000Z');
    });
  });

  describe('markAsSynced', () => {
    it('writes sync row for user-specific table with explicit user id', async () => {
      mocks.metadataPut.mockResolvedValue(1);

      await Metadata.markAsSynced(userTable, '2026-02-28T10:00:00.000Z', 'u1');

      expect(mocks.metadataPut).toHaveBeenCalledWith({
        table_name: 'user_items',
        user_id: 'u1',
        synced_at: '2026-02-28T10:00:00.000Z',
      });
    });

    it('uses null replacement user id for shared table', async () => {
      mocks.metadataPut.mockResolvedValue(undefined);

      await Metadata.markAsSynced(sharedTable, '2026-02-28T11:00:00.000Z');

      expect(mocks.metadataPut).toHaveBeenCalledWith({
        table_name: 'grammar',
        user_id: '__none__',
        synced_at: '2026-02-28T11:00:00.000Z',
      });
    });
  });

  describe('deleteSyncRow', () => {
    it('deletes row by table and explicit user id for user table', async () => {
      await Metadata.deleteSyncRow(userTable, 'u1');

      expect(mocks.metadataDelete).toHaveBeenCalledWith(['user_items', 'u1']);
    });

    it('uses null replacement user id for shared table', async () => {
      await Metadata.deleteSyncRow(sharedTable);

      expect(mocks.metadataDelete).toHaveBeenCalledWith(['grammar', '__none__']);
    });
  });
});
