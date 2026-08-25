import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getItemCandidates: vi.fn(),
  simulateItems: vi.fn(),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_items: { name: 'user_items' },
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getSimulationCandidates: (...args: unknown[]) => mocks.getItemCandidates(...args),
    simulateData: (...args: unknown[]) => mocks.simulateItems(...args),
  },
}));

import { simulateUserProgress } from '@/features/synchronization/simulate-data-service';

describe('simulateUserProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
    mocks.getItemCandidates.mockResolvedValue([{ item_id: 1 }]);
    mocks.simulateItems.mockResolvedValue(400);
  });

  it('updates items atomically', async () => {
    await expect(
      simulateUserProgress('u1', '2026-07-17T12:00:00.000Z'),
    ).resolves.toBe(400);

    expect(mocks.transaction).toHaveBeenCalledWith(
      'rw',
      expect.objectContaining({ name: 'user_items' }),
      expect.any(Function),
    );
    expect(mocks.getItemCandidates).toHaveBeenCalledWith('u1');
    expect(mocks.simulateItems).toHaveBeenCalledWith(
      [{ item_id: 1 }],
      '2026-07-17T12:00:00.000Z',
    );
  });
});
