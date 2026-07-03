import { beforeEach, describe, expect, it } from 'vitest';
import { getUnpackedLevelStorageKey, useLevelsStore } from '@/features/levels/use-levels-store';

describe('useLevelsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useLevelsStore.setState({ showMastered: false, unpackedLevelId: null });
  });

  it('persists unpacked level id by user id', () => {
    useLevelsStore.getState().setUnpackedLevelId('u1', 12);

    expect(localStorage.getItem(getUnpackedLevelStorageKey('u1'))).toBe('12');

    useLevelsStore.getState().setUnpackedLevelId('u1', null);

    expect(localStorage.getItem(getUnpackedLevelStorageKey('u1'))).toBeNull();
  });

  it('hydrates unpacked level id from user-specific storage', () => {
    localStorage.setItem(getUnpackedLevelStorageKey('u1'), '3');
    localStorage.setItem(getUnpackedLevelStorageKey('u2'), '4');

    useLevelsStore.getState().hydrateUnpackedLevelId('u2');

    expect(useLevelsStore.getState().unpackedLevelId).toBe(4);
  });

  it('clears invalid stored unpacked level id on hydrate', () => {
    localStorage.setItem(getUnpackedLevelStorageKey('u1'), 'bad-value');

    useLevelsStore.getState().hydrateUnpackedLevelId('u1');

    expect(useLevelsStore.getState().unpackedLevelId).toBeNull();
    expect(localStorage.getItem(getUnpackedLevelStorageKey('u1'))).toBeNull();
  });
});
