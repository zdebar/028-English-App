import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getItemCandidates: vi.fn(),
  getBlockCandidates: vi.fn(),
  simulateItems: vi.fn(),
  simulateBlocks: vi.fn(),
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
    getSimulationCandidates: (...args: unknown[]) => mocks.getItemCandidates(...args),
    simulateData: (...args: unknown[]) => mocks.simulateItems(...args),
  },
}));

vi.mock('@/database/models/user-blocks', () => ({
  default: {
    getSimulationCandidates: (...args: unknown[]) => mocks.getBlockCandidates(...args),
    simulateStartedBlocks: (...args: unknown[]) => mocks.simulateBlocks(...args),
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
    mocks.getBlockCandidates.mockResolvedValue([{ block_id: 1 }]);
    mocks.simulateItems.mockResolvedValue(400);
    mocks.simulateBlocks.mockResolvedValue(8);
  });

  it('updates items and blocks atomically', async () => {
    await expect(
      simulateUserProgress('u1', '2026-07-17T12:00:00.000Z'),
    ).resolves.toBe(400);

    expect(mocks.transaction).toHaveBeenCalledWith(
      'rw',
      expect.objectContaining({ name: 'user_items' }),
      expect.objectContaining({ name: 'user_blocks' }),
      expect.any(Function),
    );
    expect(mocks.getItemCandidates).toHaveBeenCalledWith('u1');
    expect(mocks.getBlockCandidates).toHaveBeenCalledWith('u1');
    expect(mocks.simulateItems).toHaveBeenCalledWith(
      [{ item_id: 1 }],
      '2026-07-17T12:00:00.000Z',
    );
    expect(mocks.simulateBlocks).toHaveBeenCalledWith(
      'u1',
      [{ block_id: 1 }],
      '2026-07-17T12:00:00.000Z',
    );
  });

  it('loads all candidates before writing and propagates a loading failure', async () => {
    const error = new Error('Not enough practice blocks');
    mocks.getBlockCandidates.mockRejectedValue(error);

    await expect(
      simulateUserProgress('u1', '2026-07-17T12:00:00.000Z'),
    ).rejects.toBe(error);

    expect(mocks.simulateItems).not.toHaveBeenCalled();
    expect(mocks.simulateBlocks).not.toHaveBeenCalled();
  });
});
