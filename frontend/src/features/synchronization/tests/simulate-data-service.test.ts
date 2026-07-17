import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  simulateItems: vi.fn(),
  simulateBlocks: vi.fn(),
  triggerLevelsUpdatedEvent: vi.fn(),
}));

vi.mock('@/database/models/db', () => ({
  db: {
    user_items: { name: 'user_items' },
    user_blocks: { name: 'user_blocks' },
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    simulateData: (...args: unknown[]) => mocks.simulateItems(...args),
  },
}));

vi.mock('@/database/models/user-blocks', () => ({
  default: {
    simulateGrammarProgress: (...args: unknown[]) => mocks.simulateBlocks(...args),
  },
}));

vi.mock('@/utils/dashboard.utils', () => ({
  triggerLevelsUpdatedEvent: (...args: unknown[]) => mocks.triggerLevelsUpdatedEvent(...args),
}));

import { simulateUserProgress } from '@/features/synchronization/simulate-data-service';

describe('simulateUserProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (...args: unknown[]) => {
      const callback = args.at(-1) as () => Promise<unknown>;
      return callback();
    });
    mocks.simulateItems.mockResolvedValue(64);
    mocks.simulateBlocks.mockResolvedValue(4);
  });

  it('updates items and blocks atomically before invalidating derived UI', async () => {
    await expect(
      simulateUserProgress('u1', '2026-07-17T12:00:00.000Z'),
    ).resolves.toBe(64);

    expect(mocks.transaction).toHaveBeenCalledWith(
      'rw',
      expect.objectContaining({ name: 'user_items' }),
      expect.objectContaining({ name: 'user_blocks' }),
      expect.any(Function),
    );
    expect(mocks.simulateItems).toHaveBeenCalledWith('u1', '2026-07-17T12:00:00.000Z');
    expect(mocks.simulateBlocks).toHaveBeenCalledWith('u1', '2026-07-17T12:00:00.000Z');
    expect(mocks.triggerLevelsUpdatedEvent).toHaveBeenCalledWith('u1');
    expect(mocks.triggerLevelsUpdatedEvent.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.simulateBlocks.mock.invocationCallOrder[0],
    );
  });

  it('propagates transaction failure without dispatching invalidation', async () => {
    const error = new Error('Not enough grammar blocks');
    mocks.simulateBlocks.mockRejectedValue(error);

    await expect(
      simulateUserProgress('u1', '2026-07-17T12:00:00.000Z'),
    ).rejects.toBe(error);

    expect(mocks.triggerLevelsUpdatedEvent).not.toHaveBeenCalled();
  });
});
