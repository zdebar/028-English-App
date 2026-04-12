import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('zustand/middleware', () => ({
  devtools: (stateCreator: unknown) => stateCreator,
}));

import { useOverlayStore } from '@/features/overlay/use-overlay-store';

describe('useOverlayStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOverlayStore.setState({ isOverlayOpen: false });
  });

  it('starts with closed overlay', () => {
    expect(useOverlayStore.getState().isOverlayOpen).toBe(false);
  });

  it('openOverlay opens overlay and closeOverlay closes it', () => {
    useOverlayStore.getState().openOverlay();
    expect(useOverlayStore.getState().isOverlayOpen).toBe(true);

    useOverlayStore.getState().closeOverlay();
    expect(useOverlayStore.getState().isOverlayOpen).toBe(false);
  });

  it('calls close callback once when overlay closes', () => {
    const onClose = vi.fn();

    useOverlayStore.getState().openOverlay(onClose);
    useOverlayStore.getState().closeOverlay();
    useOverlayStore.getState().closeOverlay();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses latest callback when openOverlay is called again', () => {
    const first = vi.fn();
    const second = vi.fn();

    useOverlayStore.getState().openOverlay(first);
    useOverlayStore.getState().openOverlay(second);
    useOverlayStore.getState().closeOverlay();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
