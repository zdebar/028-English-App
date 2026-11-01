import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useKey } from '../use-key';

describe('useKey', () => {
  it('calls onKeyPress when specified key is pressed', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onKeyPress when key is not in keys', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onKeyPress).not.toHaveBeenCalled();
  });

  it('calls onKeyPress for multiple keys', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter', 'Space'] }));

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(2);
  });

  it('does not call onKeyPress when disabled', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'], enabled: false }));

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).not.toHaveBeenCalled();
  });

  it('calls onKeyPress when enabled', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'], enabled: true }));

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('is enabled by default', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('removes keydown listener on unmount', () => {
    const onKeyPress = vi.fn();
    const removeSpy = vi.spyOn(globalThis, 'removeEventListener');

    const { unmount } = renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('adds and removes the listener when enabled changes', () => {
    const onKeyPress = vi.fn();

    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useKey({ onKeyPress, keys: ['Enter'], enabled }),
      { initialProps: { enabled: true } },
    );

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(onKeyPress).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(onKeyPress).toHaveBeenCalledTimes(1);

    rerender({ enabled: true });

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(onKeyPress).toHaveBeenCalledTimes(2);
  });

  it('uses the latest callback after rerender', () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(
      ({ onKeyPress }: { onKeyPress: () => void }) => useKey({ onKeyPress, keys: ['Enter'] }),
      { initialProps: { onKeyPress: first } },
    );

    rerender({ onKeyPress: second });

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
