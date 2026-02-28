import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKey } from '../use-key';

// Mock the overlay store
vi.mock('@/features/overlay/use-overlay-store', () => ({
  useOverlayStore: vi.fn(),
}));

import { useOverlayStore } from '@/features/overlay/use-overlay-store';

describe('useKey', () => {
  let mockUseOverlayStore: any;
  let isOverlayOpen = false;

  beforeEach(() => {
    mockUseOverlayStore = vi.mocked(useOverlayStore);
    isOverlayOpen = false;
    mockUseOverlayStore.mockImplementation((selector: any) => selector({ isOverlayOpen }));
  });

  it('calls onKeyPress when specified key is pressed', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onKeyPress when key is not in keys', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onKeyPress).not.toHaveBeenCalled();
  });

  it('calls onKeyPress for multiple keys', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter', 'Space'] }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(2);
  });

  it('does not call onKeyPress when disabledOnOverlayOpen is true and overlay is open', () => {
    const onKeyPress = vi.fn();
    isOverlayOpen = true;

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'], disabledOnOverlayOpen: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).not.toHaveBeenCalled();
  });

  it('calls onKeyPress when disabledOnOverlayOpen is true but overlay is closed', () => {
    const onKeyPress = vi.fn();

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'], disabledOnOverlayOpen: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('calls onKeyPress when disabledOnOverlayOpen is false and overlay is open', () => {
    const onKeyPress = vi.fn();
    isOverlayOpen = true;

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'], disabledOnOverlayOpen: false }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('uses default disabledOnOverlayOpen=false and still responds when overlay is open', () => {
    const onKeyPress = vi.fn();
    isOverlayOpen = true;

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('removes keydown listener on unmount', () => {
    const onKeyPress = vi.fn();
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('reacts to overlay state changes when disabledOnOverlayOpen is true', () => {
    const onKeyPress = vi.fn();

    const { rerender } = renderHook(() =>
      useKey({ onKeyPress, keys: ['Enter'], disabledOnOverlayOpen: true }),
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(onKeyPress).toHaveBeenCalledTimes(1);

    isOverlayOpen = true;
    rerender();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(onKeyPress).toHaveBeenCalledTimes(1);

    isOverlayOpen = false;
    rerender();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
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
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
