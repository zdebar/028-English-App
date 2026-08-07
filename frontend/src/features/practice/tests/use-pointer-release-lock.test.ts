import { act, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePointerReleaseLock } from '../hooks/use-pointer-release-lock';

describe('usePointerReleaseLock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays locked through the release event and unlocks on the next task', async () => {
    const { result } = renderHook(() => usePointerReleaseLock());

    act(() => {
      result.current.lockUntilRelease();
    });
    expect(result.current.isLocked).toBe(true);

    fireEvent.pointerUp(window);
    expect(result.current.isLocked).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.isLocked).toBe(false);
  });

  it.each(['pointerCancel', 'blur'] as const)('unlocks after %s', async (releaseEvent) => {
    const { result } = renderHook(() => usePointerReleaseLock());

    act(() => {
      result.current.lockUntilRelease();
    });
    fireEvent[releaseEvent](window);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.isLocked).toBe(false);
  });

  it('removes release listeners when unmounted while locked', () => {
    const removeEventListener = vi.spyOn(globalThis, 'removeEventListener');
    const { result, unmount } = renderHook(() => usePointerReleaseLock());

    act(() => {
      result.current.lockUntilRelease();
    });
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
  });
});
