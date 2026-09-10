import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DelayedMessage from '@/components/UI/DelayedMessage';

vi.mock('@/config/config', () => ({
  default: {
    loading: { dataStateDelayMs: 1000 },
  },
}));

describe('DelayedMessage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing before the configured delay', () => {
    vi.useFakeTimers();

    const { container } = render(<DelayedMessage />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the loading message after the configured delay', () => {
    vi.useFakeTimers();

    render(<DelayedMessage />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Načítání ...')).toBeTruthy();
  });
});
