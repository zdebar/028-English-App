import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dismissOverlay: vi.fn(),
  useKey: vi.fn(),
  isOverlayOpen: true,
}));

vi.mock('@/config/keyboard-listeners.config', () => ({
  KEYBOARD_LISTENERS: {
    Exit: ['Escape'],
  },
}));

vi.mock('@/hooks/use-key', () => ({
  useKey: (...args: unknown[]) => mocks.useKey(...args),
}));

vi.mock('@/features/overlay/use-overlay-store', () => ({
  useOverlayStore: (
    selector: (state: {
      dismissOverlay: typeof mocks.dismissOverlay;
      isOverlayOpen: boolean;
    }) => unknown,
  ) => selector({ dismissOverlay: mocks.dismissOverlay, isOverlayOpen: mocks.isOverlayOpen }),
}));

import OverlayMask from '@/features/overlay/OverlayMask';

describe('OverlayMask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isOverlayOpen = true;
  });

  it('registers useKey with exit keys and close handler', () => {
    render(<OverlayMask />);

    expect(mocks.useKey).toHaveBeenCalledTimes(1);
    const arg = mocks.useKey.mock.calls[0][0];
    expect(arg.keys).toEqual(['Escape']);
    expect(typeof arg.onKeyPress).toBe('function');

    arg.onKeyPress();
    expect(mocks.dismissOverlay).toHaveBeenCalledTimes(1);
  });

  it('requests overlay dismissal when mask is clicked', () => {
    render(<OverlayMask />);

    fireEvent.click(screen.getByRole('button'));

    expect(mocks.dismissOverlay).toHaveBeenCalledTimes(1);
  });
});
