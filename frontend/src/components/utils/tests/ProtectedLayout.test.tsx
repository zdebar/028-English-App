import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: null as string | null,
  loading: false,
  navigateTo: null as string | null,
  navigateReplace: false,
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null; loading: boolean }) => unknown) =>
    selector({ userId: mocks.userId, loading: mocks.loading }),
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => {
    mocks.navigateTo = to;
    mocks.navigateReplace = Boolean(replace);
    return <div data-testid="navigate" />;
  },
  Outlet: () => <div data-testid="outlet" />,
}));

import ProtectedLayout from '@/components/utils/protected-laout';

describe('ProtectedLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = null;
    mocks.loading = false;
    mocks.navigateTo = null;
    mocks.navigateReplace = false;
  });

  it('renders nothing while auth state is loading', () => {
    mocks.loading = true;

    const { container } = render(<ProtectedLayout />);

    expect(container.firstChild).toBeNull();
  });

  it('redirects to root when user is not authenticated', () => {
    render(<ProtectedLayout />);

    expect(screen.getByTestId('navigate')).toBeTruthy();
    expect(mocks.navigateTo).toBe('/');
    expect(mocks.navigateReplace).toBe(true);
  });

  it('renders outlet when user is authenticated', () => {
    mocks.userId = 'u1';

    render(<ProtectedLayout />);

    expect(screen.getByTestId('outlet')).toBeTruthy();
  });
});
