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

  beforeEach(() => {
    mockUseOverlayStore = vi.mocked(useOverlayStore);
  });

  it('calls onKeyPress when specified key is pressed', () => {
    const onKeyPress = vi.fn();
    mockUseOverlayStore.mockImplementation((selector: any) => selector({ isOverlayOpen: false }));

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onKeyPress when key is not in keys', () => {
    const onKeyPress = vi.fn();
    mockUseOverlayStore.mockImplementation((selector: any) => selector({ isOverlayOpen: false }));

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'] }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onKeyPress).not.toHaveBeenCalled();
  });

  it('calls onKeyPress for multiple keys', () => {
    const onKeyPress = vi.fn();
    mockUseOverlayStore.mockImplementation((selector: any) => selector({ isOverlayOpen: false }));

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
    mockUseOverlayStore.mockImplementation((selector: any) => selector({ isOverlayOpen: true }));

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'], disabledOnOverlayOpen: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).not.toHaveBeenCalled();
  });

  it('calls onKeyPress when disabledOnOverlayOpen is true but overlay is closed', () => {
    const onKeyPress = vi.fn();
    mockUseOverlayStore.mockImplementation((selector: any) => selector({ isOverlayOpen: false }));

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'], disabledOnOverlayOpen: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('calls onKeyPress when disabledOnOverlayOpen is false and overlay is open', () => {
    const onKeyPress = vi.fn();
    mockUseOverlayStore.mockImplementation((selector: any) => selector({ isOverlayOpen: true }));

    renderHook(() => useKey({ onKeyPress, keys: ['Enter'], disabledOnOverlayOpen: false }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });
});
