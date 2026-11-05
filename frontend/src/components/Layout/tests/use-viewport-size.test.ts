import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useViewportSize } from '../use-viewport-size';

describe('useViewportSize', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reads initial dimensions, updates on resize, and removes its listener on unmount', () => {
    vi.stubGlobal('innerWidth', 800);
    vi.stubGlobal('innerHeight', 600);
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');

    const { result, unmount } = renderHook(() => useViewportSize());

    expect(result.current).toEqual({ width: 800, height: 600 });
    const resizeListener = addEventListener.mock.calls.find(
      ([eventName]) => eventName === 'resize',
    )?.[1];
    expect(resizeListener).toBeDefined();

    act(() => {
      vi.stubGlobal('innerWidth', 900);
      vi.stubGlobal('innerHeight', 700);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toEqual({ width: 900, height: 700 });

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('resize', resizeListener);
  });
});
