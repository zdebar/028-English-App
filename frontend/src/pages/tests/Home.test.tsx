import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  theme: 'light' as 'light' | 'dark',
  userId: 'u1' as string | null,
  userFullName: 'User One' as string | null,
  userEmail: 'u1@example.com' as string | null,
  dailyCount: 3,
  isSynchronized: true,
}));

vi.mock('@/config/config', () => ({
  default: {
    practice: {
      dailyGoal: 10,
    },
  },
}));

vi.mock('@/features/theme/use-theme-store', () => ({
  useThemeStore: (selector: (state: { theme: 'light' | 'dark' }) => unknown) =>
    selector({ theme: mocks.theme }),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (
    selector: (state: {
      userId: string | null;
      userFullName: string | null;
      userEmail: string | null;
    }) => unknown,
  ) =>
    selector({
      userId: mocks.userId,
      userFullName: mocks.userFullName,
      userEmail: mocks.userEmail,
    }),
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (selector: (state: { dailyCount: number }) => unknown) =>
    selector({ dailyCount: mocks.dailyCount }),
}));

vi.mock('@/features/sync-warning/use-sync-warning', () => ({
  useSyncWarningStore: (selector: (state: { isSynchronized: boolean }) => unknown) =>
    selector({ isSynchronized: mocks.isSynchronized }),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    appTitle: 'App',
    appDescription: 'Desc',
    appTestDescription: 'Test mode',
    guide: 'Guide',
    userLabel: 'User',
    userStatsLabel: 'Today',
    today: 'Today',
    dailyGoal: 'Goal',
    syncWarning: 'Data may be stale.',
    signupHint: 'Signup hint',
  },
}));

vi.mock('@/components/UI/PropertyView', () => ({
  default: ({ label, children }: any) => (
    <div>
      <span>{label}</span>
      <span>{children}</span>
    </div>
  ),
}));

vi.mock('@/components/UI/Dashboard', () => ({
  default: () => <div data-testid="dashboard" />,
}));

vi.mock('@/components/UI/Notification', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/GoalMetView', () => ({
  default: ({ current, goal }: { current: number; goal: number }) => (
    <span>
      {current}/{goal}
    </span>
  ),
}));

vi.mock('@/features/pwa/InstallPwaButton', () => ({
  InstallPWAButton: () => <button type="button">Install</button>,
}));

vi.mock('@supabase/auth-ui-react', () => ({
  Auth: () => <div data-testid="auth" />,
}));

vi.mock('@supabase/auth-ui-shared', () => ({
  ThemeSupa: {},
}));

vi.mock('@/config/supabase.config', () => ({
  supabaseInstance: {},
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children }: any) => <div>{children}</div>,
}));

import Home from '@/pages/Home';

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.userFullName = 'User One';
    mocks.userEmail = 'u1@example.com';
    mocks.dailyCount = 3;
    mocks.isSynchronized = true;
  });

  it('shows sync warning when user is signed in and data is not synchronized', () => {
    mocks.isSynchronized = false;

    render(<Home />);

    expect(screen.getByText('Data may be stale.')).toBeTruthy();
  });

  it('does not show sync warning when user is synchronized', () => {
    render(<Home />);

    expect(screen.queryByText('Data may be stale.')).toBeNull();
  });

  it('renders auth UI when user is signed out', () => {
    mocks.userId = null;

    render(<Home />);

    expect(screen.getByTestId('auth')).toBeTruthy();
    expect(screen.queryByText('Data may be stale.')).toBeNull();
  });
});
