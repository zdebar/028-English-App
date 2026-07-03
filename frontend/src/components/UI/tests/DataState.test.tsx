import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DataState } from '@/components/UI/DataState';

describe('DataState', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children when data exists', () => {
    render(
      <DataState loading={false} hasData>
        <div>DATA</div>
      </DataState>,
    );

    expect(screen.getByText('DATA')).toBeTruthy();
  });

  it('renders no data message when not loading and no data', () => {
    render(
      <DataState loading={false} hasData={false} noDataMessage="Nic tu neni">
        <div>DATA</div>
      </DataState>,
    );

    expect(screen.getByText('Nic tu neni')).toBeTruthy();
  });

  it('renders loading circle after the configured delay when loading and no data yet', () => {
    vi.useFakeTimers();

    const { container } = render(
      <DataState loading hasData={false}>
        <div>DATA</div>
      </DataState>,
    );

    expect(container.firstChild).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText('Načítání ...')).toBeTruthy();
  });
});
