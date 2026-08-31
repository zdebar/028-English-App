import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useStarCelebration } from '../hooks/use-star-celebration';

describe('useStarCelebration', () => {
  it('defers the visible celebration until preparation is complete', async () => {
    const { result } = renderHook(() => useStarCelebration());
    let acknowledgement!: Promise<void>;

    act(() => {
      acknowledgement = result.current.prepareAcknowledgement();
    });

    expect(result.current.preparingCelebration).toBe(true);
    expect(result.current.celebratingStar).toBe(false);

    act(() => result.current.showCelebration());

    expect(result.current.preparingCelebration).toBe(false);
    expect(result.current.celebratingStar).toBe(true);

    act(() => result.current.acknowledgeCelebration());
    await expect(acknowledgement).resolves.toBeUndefined();
  });

  it('settles a pending acknowledgement when unmounted', async () => {
    const { result, unmount } = renderHook(() => useStarCelebration());
    let acknowledgement!: Promise<void>;

    act(() => {
      acknowledgement = result.current.waitForAcknowledgement();
    });

    expect(result.current.celebratingStar).toBe(true);
    unmount();

    await expect(acknowledgement).resolves.toBeUndefined();
  });
});
