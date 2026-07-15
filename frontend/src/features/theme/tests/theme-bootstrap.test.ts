import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInThisContext } from 'node:vm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const bootstrapScript = indexHtml.match(
  /<script data-theme-bootstrap>([\s\S]*?)<\/script>/,
)?.[1] ?? '';

if (!bootstrapScript) {
  throw new Error('Theme bootstrap script was not found in index.html');
}

function runThemeBootstrap() {
  runInThisContext(bootstrapScript);
}

describe('theme bootstrap script', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    document.head.innerHTML = '<meta name="theme-color" content="#f7b740">';
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  });

  it.each([
    ['light', '#f7b740'],
    ['dark', '#111827'],
  ] as const)('applies a stored %s theme before React starts', (theme, color) => {
    localStorage.setItem('theme_active', theme);

    runThemeBootstrap();

    expect(document.documentElement.classList.contains(theme)).toBe(true);
    expect(document.documentElement.classList.length).toBe(1);
    expect(document.querySelector("meta[name='theme-color']")?.getAttribute('content')).toBe(color);
  });

  it('uses the system theme when the active theme is missing', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));

    runThemeBootstrap();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('uses the system theme when the active theme is invalid', () => {
    localStorage.setItem('theme_active', 'sepia');

    runThemeBootstrap();

    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('uses the system theme when storage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    runThemeBootstrap();

    expect(document.documentElement.classList.contains('light')).toBe(true);
    getItem.mockRestore();
  });
});
