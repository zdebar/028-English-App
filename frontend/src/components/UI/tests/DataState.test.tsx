import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="delayed-notification">{children}</div>
  ),
}));

import { DataState } from '@/components/UI/DataState';

describe('DataState', () => {
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

    expect(screen.getByTestId('delayed-notification').textContent).toContain('Nic tu neni');
  });

  it('renders nothing when loading and no data yet', () => {
    const { container } = render(
      <DataState loading hasData={false}>
        <div>DATA</div>
      </DataState>,
    );

    expect(container.firstChild).toBeNull();
  });
});
