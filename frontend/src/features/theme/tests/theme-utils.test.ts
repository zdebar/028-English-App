import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearActiveTheme,
  clearUserTheme,
  loadActiveTheme,
  loadUserTheme,
  saveActiveTheme,
  saveUserTheme,
} from '@/features/theme/theme-utils';

describe('theme-utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads user theme by user id', () => {
    saveUserTheme('dark', 'u1');

    expect(localStorage.getItem('theme_u1')).toBe('dark');
    expect(loadUserTheme('u1')).toBe('dark');
  });

  it('uses guest key when user id is missing', () => {
    saveUserTheme('light');

    expect(localStorage.getItem('theme_guest')).toBe('light');
    expect(loadUserTheme()).toBe('light');
  });

  it('clears saved theme for given user', () => {
    saveUserTheme('dark', 'u1');

    clearUserTheme('u1');

    expect(loadUserTheme('u1')).toBeNull();
  });

  it('saves, loads, and clears the active theme', () => {
    saveActiveTheme('dark');

    expect(localStorage.getItem('theme_active')).toBe('dark');
    expect(loadActiveTheme()).toBe('dark');

    clearActiveTheme();

    expect(loadActiveTheme()).toBeNull();
  });

  it('rejects an invalid active theme', () => {
    localStorage.setItem('theme_active', 'sepia');

    expect(loadActiveTheme()).toBeNull();
  });

  it('handles unavailable storage for active theme operations', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    expect(loadActiveTheme()).toBeNull();
    expect(() => saveActiveTheme('light')).not.toThrow();
    expect(() => clearActiveTheme()).not.toThrow();

    getItem.mockRestore();
    setItem.mockRestore();
    removeItem.mockRestore();
  });
});
