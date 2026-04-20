import { beforeEach, describe, expect, it } from 'vitest';

import { clearUserTheme, loadUserTheme, saveUserTheme } from '@/features/theme/theme-utils';

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
});
