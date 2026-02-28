import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isOverlayOpen: false,
}));

vi.mock('@/features/overlay/use-overlay-store', () => ({
  useOverlayStore: (selector: (state: { isOverlayOpen: boolean }) => unknown) =>
    selector({ isOverlayOpen: mocks.isOverlayOpen }),
}));

vi.mock('@/features/overlay/OverlayMask', () => ({
  default: () => <div data-testid="overlay-mask" />,
}));

import OverlayContainer from '@/features/overlay/OverlayContainer';

describe('OverlayContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isOverlayOpen = false;
  });

  it('renders null when overlay is closed', () => {
    const { container } = render(<OverlayContainer />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('overlay-mask')).toBeNull();
  });

  it('renders OverlayMask when overlay is open', () => {
    mocks.isOverlayOpen = true;

    render(<OverlayContainer />);

    expect(screen.getByTestId('overlay-mask')).toBeTruthy();
  });
});
