import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(
  (): {
    theme: 'light' | 'dark';
    userId: string | null;
    userFullName: string | null;
    userEmail: string | null;
    dailyCount: number;
    isSynchronized: boolean;
  } => ({
    theme: 'light',
    userId: 'u1',
    userFullName: 'User One',
    userEmail: 'u1@example.com',
    dailyCount: 3,
    isSynchronized: true,
  }),
);

vi.mock('@/config/config', () => ({
  default: {
    practice: {
      dailyGoal: 10,
      starChunk: 50,
      starsPerRow: 10,
    },
  },
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

vi.mock('@/features/sync/use-sync-warning', () => ({
  useSyncWarningStore: (selector: (state: { isSynchronized: boolean }) => unknown) =>
    selector({ isSynchronized: mocks.isSynchronized }),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    appTitle: 'App',
    appDescription: 'Desc',
    appTestDescription: 'Test mode',
    guide: 'Guide',
    profileNameLabel: 'Jmeno',
    notAvailable: 'Nedostupne',
    userLabel: 'User',
    userStatsLabel: 'Today',
    practiceOverviewOpen: 'Open practice overview',
    starsToday: 'Stars today',
    today: 'Today',
    dailyGoal: 'Goal',
    syncWarning: 'Data may be stale.',
    signupHint: 'Signup hint',
  },
}));

vi.mock('@/components/UI/Dashboard', () => ({
  default: () => <div data-testid="dashboard" />,
}));

vi.mock('@/components/UI/Notification', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/features/pwa/InstallPwaButton', () => ({
  InstallPWAButton: () => <button type="button">Install</button>,
}));

vi.mock('@/components/PracticeOverviewButton', () => ({
  default: ({ count, ariaLabel, helpText }: any) => (
    <div data-testid="practice-overview-button">
      {count}:{ariaLabel}:{helpText}
    </div>
  ),
}));

vi.mock('@/features/auth/GoogleAuthButton', () => ({
  default: () => <div data-testid="google-auth-button" />,
}));

vi.mock('@/features/auth/SimulateDataButton', () => ({
  default: () => <div data-testid="simulate-data-button" />,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children }: any) => <div>{children}</div>,
  useNavigate: () => vi.fn(),
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
    expect(screen.getByRole('button', { name: 'Open practice overview' })).toBeTruthy();
  });

  it('renders auth UI when user is signed out', () => {
    mocks.userId = null;

    render(<Home />);

    expect(screen.getByTestId('google-auth-button')).toBeTruthy();
    expect(screen.queryByText('Data may be stale.')).toBeNull();
  });
});
