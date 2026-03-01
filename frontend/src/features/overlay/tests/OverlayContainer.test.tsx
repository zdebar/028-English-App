import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isOverlayOpen: false,
  closeOverlay: vi.fn(),
  useKey: vi.fn(),
}));

vi.mock('@/config/keyboard-listeners.config', () => ({
  KEYBOARD_LISTENERS: {
    Exit: ['Escape'],
  },
}));

vi.mock('@/features/key-listener/use-key', () => ({
  useKey: (...args: unknown[]) => mocks.useKey(...args),
}));

vi.mock('@/features/overlay/use-overlay-store', () => ({
  useOverlayStore: (
    selector: (state: {
      isOverlayOpen: boolean;
      closeOverlay: typeof mocks.closeOverlay;
    }) => unknown,
  ) => selector({ isOverlayOpen: mocks.isOverlayOpen, closeOverlay: mocks.closeOverlay }),
}));

import OverlayMask from '@/features/overlay/OverlayMask';

describe('OverlayMask visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isOverlayOpen = false;
  });

  it('renders null when overlay is closed', () => {
    const { container } = render(<OverlayMask />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders overlay mask when overlay is open', () => {
    mocks.isOverlayOpen = true;

    render(<OverlayMask />);

    expect(screen.getByRole('button')).toBeTruthy();
  });
});
