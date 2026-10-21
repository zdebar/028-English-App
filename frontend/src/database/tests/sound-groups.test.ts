import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getAllByTypeWithStartedExamples: vi.fn() }));

vi.mock('@/database/models/groups', () => ({
  default: {
    getAllByTypeWithStartedExamples: (...args: unknown[]) =>
      mocks.getAllByTypeWithStartedExamples(...args),
  },
}));

import SoundGroup from '@/database/models/sound-groups';

describe('SoundGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAllByTypeWithStartedExamples.mockResolvedValue([{
      id: 3,
      type: 'sound',
      name: '/æ/',
      note: 'Example note',
      sort_order: 1,
      updated_at: '2026-01-01',
      deleted_at: null,
      examples: [{ item_id: 8, english: 'man' }],
    }]);
  });

  it('lists only unlocked sounds from the generic groups model', async () => {
    await expect(SoundGroup.getOverview('u1')).resolves.toEqual([{
      id: 3,
      type: 'sound',
      name: '/æ/',
      note: 'Example note',
      sort_order: 1,
      updated_at: '2026-01-01',
      deleted_at: null,
    }]);
    expect(mocks.getAllByTypeWithStartedExamples).toHaveBeenCalledWith('u1', 'sound');
  });

  it('returns only started examples for an unlocked sound detail', async () => {
    await expect(SoundGroup.getDetail('u1', 3)).resolves.toMatchObject({
      group: { id: 3, type: 'sound', name: '/æ/' },
      items: [{ item_id: 8, english: 'man' }],
    });
  });

  it('hides a sound that has no started examples', async () => {
    mocks.getAllByTypeWithStartedExamples.mockResolvedValue([]);
    await expect(SoundGroup.getDetail('u1', 3)).resolves.toBeNull();
  });
});
