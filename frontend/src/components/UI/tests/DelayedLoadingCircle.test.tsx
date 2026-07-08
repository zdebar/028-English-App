import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DelayedLoadingCircle from '@/components/UI/DelayedLoadingCircle';

vi.mock('@/config/config', () => ({
  default: {
    loading: { dataStateDelayMs: 1000 },
  },
}));

describe('DelayedLoadingCircle', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing before the configured delay', () => {
    vi.useFakeTimers();

    const { container } = render(<DelayedLoadingCircle />);

    expect(container.firstChild).toBeNull();
  });

  it('renders loading circle after the configured delay', () => {
    vi.useFakeTimers();

    render(<DelayedLoadingCircle />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText('Načítání ...')).toBeTruthy();
  });

  it('passes custom label and className to the loading circle', () => {
    vi.useFakeTimers();

    const { container } = render(<DelayedLoadingCircle label="Loading custom" className="custom" />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText('Loading custom')).toBeTruthy();
    expect(container.querySelector('.custom')).toBeTruthy();
  });
});
