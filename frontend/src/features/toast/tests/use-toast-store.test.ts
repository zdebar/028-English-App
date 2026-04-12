import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config before importing the store
vi.mock('@/config/config', () => ({
  default: { toast: { duration: 1000 } },
}));

import { useToastStore } from '../use-toast-store';

describe('useToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // reset store to initial values
    useToastStore.setState({
      message: '',
      type: 'info',
      visible: false,
      timeoutId: null,
    });
  });

  afterEach(() => {
    // run any pending timers and restore real timers
    try {
      vi.runOnlyPendingTimers();
    } catch {}
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('showToast sets message, type, visible and schedules hide', () => {
    const { showToast } = useToastStore.getState();

    showToast('Hello', 'success');

    const stateAfter = useToastStore.getState();
    expect(stateAfter.message).toBe('Hello');
    expect(stateAfter.type).toBe('success');
    expect(stateAfter.visible).toBe(true);
    expect(stateAfter.timeoutId).not.toBeNull();

    // advance time to trigger hide
    vi.advanceTimersByTime(1000);

    const stateFinal = useToastStore.getState();
    expect(stateFinal.visible).toBe(false);
    expect(stateFinal.timeoutId).toBeNull();
  });

  it('calling showToast again clears previous timeout', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');

    useToastStore.getState().showToast('One');
    const first = useToastStore.getState().timeoutId;

    useToastStore.getState().showToast('Two');
    const second = useToastStore.getState().timeoutId;

    expect(clearSpy).toHaveBeenCalled();
    expect(useToastStore.getState().message).toBe('Two');
    expect(second).not.toEqual(first);

    // triggering the remaining timer should hide the toast
    vi.advanceTimersByTime(1000);
    expect(useToastStore.getState().visible).toBe(false);
  });

  it('hideToast clears timeout and hides immediately', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');

    useToastStore.getState().showToast('Temp');
    expect(useToastStore.getState().visible).toBe(true);

    useToastStore.getState().hideToast();

    expect(clearSpy).toHaveBeenCalled();
    expect(useToastStore.getState().visible).toBe(false);
    expect(useToastStore.getState().timeoutId).toBeNull();
  });
});
