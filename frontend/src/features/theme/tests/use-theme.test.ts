import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadUserTheme: vi.fn(),
  saveUserTheme: vi.fn(),
  clearUserTheme: vi.fn(),
}));

vi.mock('@/features/theme/theme-utils', () => ({
  loadUserTheme: (...args: unknown[]) => mocks.loadUserTheme(...args),
  saveUserTheme: (...args: unknown[]) => mocks.saveUserTheme(...args),
  clearUserTheme: (...args: unknown[]) => mocks.clearUserTheme(...args),
}));

import { useThemeStore } from '@/features/theme/use-theme-store';

describe('useThemeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadUserTheme.mockReturnValue(null);

    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));

    document.documentElement.classList.remove('dark', 'light');
    useThemeStore.setState({ theme: 'light' });
  });

  it('loadTheme uses stored user theme when available', () => {
    mocks.loadUserTheme.mockReturnValue('dark');

    useThemeStore.getState().loadTheme('u1');

    expect(mocks.loadUserTheme).toHaveBeenCalledWith('u1');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('loadTheme falls back to system theme when no stored value', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    mocks.loadUserTheme.mockReturnValue(null);

    useThemeStore.getState().loadTheme('u2');

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('chooseTheme saves and applies new theme when changed', () => {
    useThemeStore.setState({ theme: 'light' });

    useThemeStore.getState().chooseTheme('dark', 'u1');

    expect(mocks.saveUserTheme).toHaveBeenCalledWith('dark', 'u1');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('chooseTheme does not save when selecting current theme', () => {
    useThemeStore.setState({ theme: 'light' });

    useThemeStore.getState().chooseTheme('light', 'u1');

    expect(mocks.saveUserTheme).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('clearTheme removes stored value and resets to system theme', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    useThemeStore.setState({ theme: 'dark' });

    useThemeStore.getState().clearTheme('u1');

    expect(mocks.clearUserTheme).toHaveBeenCalledWith('u1');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});
