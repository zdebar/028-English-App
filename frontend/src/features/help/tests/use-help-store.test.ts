import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  openOverlay: vi.fn(),
  closeCallback: null as null | (() => void),
}));

vi.mock('zustand/middleware', () => ({
  devtools: (stateCreator: unknown) => stateCreator,
}));

vi.mock('@/features/overlay/use-overlay-store', () => ({
  useOverlayStore: {
    getState: () => ({
      openOverlay: (callback: () => void) => {
        mocks.closeCallback = callback;
        mocks.openOverlay(callback);
      },
    }),
  },
}));

import { useHelpStore } from '@/features/help/use-help-store';

describe('useHelpStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.closeCallback = null;
    useHelpStore.setState({ isHelpOpened: false });
  });

  it('starts with help closed', () => {
    expect(useHelpStore.getState().isHelpOpened).toBe(false);
  });

  it('openHelp opens help and registers overlay close callback', () => {
    useHelpStore.getState().openHelp();

    expect(useHelpStore.getState().isHelpOpened).toBe(true);
    expect(mocks.openOverlay).toHaveBeenCalledTimes(1);
    expect(typeof mocks.closeCallback).toBe('function');
  });

  it('overlay callback closes help', () => {
    useHelpStore.getState().openHelp();
    mocks.closeCallback?.();

    expect(useHelpStore.getState().isHelpOpened).toBe(false);
  });

  it('closeHelp closes help directly', () => {
    useHelpStore.setState({ isHelpOpened: true });

    useHelpStore.getState().closeHelp();

    expect(useHelpStore.getState().isHelpOpened).toBe(false);
  });
});
