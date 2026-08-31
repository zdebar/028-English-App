import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  historyGet: vi.fn(),
  historyPut: vi.fn(),
  historyToArray: vi.fn(),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '9999-12-31T23:59:59.000Z' },
  },
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_item_progress_history: {
      get: (...args: unknown[]) => mocks.historyGet(...args),
      put: (...args: unknown[]) => mocks.historyPut(...args),
      where: () => ({
        equals: () => ({ toArray: (...args: unknown[]) => mocks.historyToArray(...args) }),
      }),
    },
  },
}));

vi.mock('dexie', () => ({ Entity: class Entity {} }));

import UserItemProgressHistory from '@/database/models/user-item-progress-history';

describe('UserItemProgressHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('2026-08-31');
    mocks.historyPut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('merges same-day answers while keeping the last progress state', async () => {
    mocks.historyGet.mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      user_id: 'u1',
      date: '2026-08-31',
      item_id: 4,
      direction: 'czToEn',
      progress: 2,
      max_progress: 10,
      progress_change: 2,
      updated_at: '2026-08-31T09:00:00.000Z',
      deleted_at: null,
    });

    await UserItemProgressHistory.recordChange(
      'u1',
      4,
      'czToEn',
      2,
      10,
      2,
      '2026-08-31T09:00:00.000Z',
    );
    await UserItemProgressHistory.recordChange(
      'u1',
      4,
      'czToEn',
      1,
      10,
      -1,
      '2026-08-31T10:00:00.000Z',
    );

    expect(mocks.historyPut).toHaveBeenNthCalledWith(2, {
      user_id: 'u1',
      date: '2026-08-31',
      item_id: 4,
      direction: 'czToEn',
      progress: 1,
      max_progress: 10,
      progress_change: 1,
      updated_at: '2026-08-31T10:00:00.000Z',
      deleted_at: null,
    });
  });

  it('sums positive and negative daily deltas from active records', async () => {
    mocks.historyToArray.mockResolvedValue([
      { item_id: 1, direction: 'czToEn', progress_change: 8, deleted_at: null },
      { item_id: 2, direction: 'enToCz', progress_change: -3, deleted_at: null },
      { item_id: 3, direction: 'czToEn', progress_change: 100, deleted_at: '2026-08-31' },
    ]);

    await expect(UserItemProgressHistory.getTodayProgressChange('u1', '2026-08-31')).resolves.toBe(
      5,
    );
  });
});
