import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/UI/Delayed', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="delayed">{children}</div>,
}));

vi.mock('@/components/UI/Notification', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) => (
    <p data-testid="notification" className={className}>
      {children}
    </p>
  ),
}));

import DelayedNotification from '@/components/UI/DelayedNotification';

describe('DelayedNotification', () => {
  it('renders default message when children are not provided', () => {
    render(<DelayedNotification message="Nacitam" className="custom" />);

    expect(screen.getByTestId('delayed')).toBeTruthy();
    expect(screen.getByTestId('notification').textContent).toContain('Nacitam');
    expect(screen.getByTestId('notification').className).toContain('custom');
  });

  it('prefers children over message', () => {
    render(<DelayedNotification message="Nacitam">Hotovo</DelayedNotification>);

    expect(screen.getByTestId('notification').textContent).toContain('Hotovo');
  });
});
