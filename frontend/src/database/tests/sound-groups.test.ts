import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getByTypeWithStartedLessons: vi.fn(),
  getStartedByUser: vi.fn(),
}));

vi.mock('@/database/models/groups', () => ({
  default: {
    getByTypeWithStartedLessons: (...args: unknown[]) =>
      mocks.getByTypeWithStartedLessons(...args),
    getStartedByUser: (...args: unknown[]) => mocks.getStartedByUser(...args),
  },
}));

import SoundGroup from '@/database/models/sound-groups';

const sound = {
  id: 3,
  type: 'sound' as const,
  name: '/æ/',
  note: 'Example note',
  sort_order: 1,
  updated_at: '2026-01-01',
  deleted_at: null,
};
const startedSound = { ...sound, examples: [{ item_id: 8, english: 'man' }] };

describe('SoundGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getByTypeWithStartedLessons.mockResolvedValue([sound]);
    mocks.getStartedByUser.mockResolvedValue([startedSound]);
  });

  it('lists sounds with linked items in started lessons', async () => {
    await expect(SoundGroup.getOverview('u1')).resolves.toEqual([sound]);
    expect(mocks.getByTypeWithStartedLessons).toHaveBeenCalledWith('u1', 'sound');
  });

  it('returns only initiated examples in a visible sound detail', async () => {
    await expect(SoundGroup.getDetail('u1', 3)).resolves.toEqual({
      group: sound,
      items: [{ item_id: 8, english: 'man' }],
    });
    expect(mocks.getStartedByUser).toHaveBeenCalledWith('u1', 'sound');
  });

  it('hides a sound with no linked item in a started lesson', async () => {
    mocks.getByTypeWithStartedLessons.mockResolvedValue([]);
    await expect(SoundGroup.getDetail('u1', 3)).resolves.toBeNull();
  });
});
