import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useStarCelebration } from '../hooks/use-star-celebration';

describe('useStarCelebration', () => {
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
