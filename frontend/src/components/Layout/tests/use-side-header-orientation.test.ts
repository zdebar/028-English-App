import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveSideHeaderOrientation,
  useSideHeaderOrientation,
} from '../use-side-header-orientation';

function createRect(width: number): DOMRect {
  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: width,
    top: 0,
    width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
}

function addHeaderSide(): void {
  const headerSide = document.createElement('nav');
  headerSide.dataset.headerSide = '';
  headerSide.append(document.createElement('button'), document.createElement('button'));
  document.body.appendChild(headerSide);
}

describe('resolveSideHeaderOrientation', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    { viewportWidth: 823, expected: 'vertical' },
    { viewportWidth: 824, expected: 'horizontal' },
    { viewportWidth: 825, expected: 'horizontal' },
  ] as const)('returns $expected at $viewportWidth px', ({ viewportWidth, expected }) => {
    expect(resolveSideHeaderOrientation(viewportWidth, 600, 112)).toBe(expected);
  });

  it('moves the breakpoint when the measured side header width changes', () => {
    expect(resolveSideHeaderOrientation(850, 600, 130)).toBe('vertical');
    expect(resolveSideHeaderOrientation(860, 600, 130)).toBe('horizontal');
  });

  it('measures two 52px buttons and their 8px gap before switching', () => {
    addHeaderSide();
    addHeaderSide();
    vi.stubGlobal('innerWidth', 600);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      columnGap: '8px',
    } as CSSStyleDeclaration);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.style.width === 'var(--max-width-card)') return createRect(600);
      if (this instanceof HTMLButtonElement) return createRect(52);
      return createRect(0);
    });

    const { result } = renderHook(() => useSideHeaderOrientation());

    expect(result.current).toBe('vertical');
  });
});
