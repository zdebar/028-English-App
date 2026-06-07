import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Delayed from '@/components/UI/Delayed';

describe('Delayed', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children after delay', async () => {
    vi.useFakeTimers();
    render(<Delayed timeDelay={200}>Ready</Delayed>);

    expect(screen.queryByText('Ready')).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('Ready')).toBeTruthy();
  });
});
