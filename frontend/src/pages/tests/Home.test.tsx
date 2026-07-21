import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(
  (): {
    theme: 'light' | 'dark';
    userId: string | null;
    userFullName: string | null;
    userEmail: string | null;
    isAnonymousUser: boolean;
    dailyCount: number;
    isSyncError: boolean;
  } => ({
    theme: 'light',
    userId: 'u1',
    userFullName: 'User One',
    userEmail: 'u1@example.com',
    isAnonymousUser: false,
    dailyCount: 3,
    isSyncError: false,
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
      isAnonymousUser: boolean;
    }) => unknown,
  ) =>
    selector({
      userId: mocks.userId,
      userFullName: mocks.userFullName,
      userEmail: mocks.userEmail,
      isAnonymousUser: mocks.isAnonymousUser,
    }),
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (selector: (state: { dailyCount: number }) => unknown) =>
    selector({ dailyCount: mocks.dailyCount }),
}));

vi.mock('@/features/synchronization/use-sync-store', () => ({
  useSyncStore: (selector: (state: { isSyncError: boolean }) => unknown) =>
    selector({ isSyncError: mocks.isSyncError }),
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
    practiceButton: 'Practice',
  },
}));

vi.mock('@/features/dashboard/Dashboard', () => ({
  default: () => <div data-testid="dashboard" />,
}));

vi.mock('@/features/help/HelpButton', () => ({
  default: () => <button type="button">Help</button>,
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

vi.mock('@/features/synchronization/SimulateDataButton', () => ({
  default: () => <div data-testid="simulate-data-button" />,
}));

vi.mock('@/features/practice/HomePracticeButtons', () => ({
  default: ({ userId }: any) => <div data-testid="home-practice-buttons">practice:{userId}</div>,
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
    mocks.isAnonymousUser = false;
    mocks.dailyCount = 3;
    mocks.isSyncError = false;
  });

  it('shows sync warning when sync has failed', () => {
    mocks.isSyncError = true;

    render(<Home />);

    expect(screen.getByText('Data may be stale.')).toBeTruthy();
  });

  it('does not show sync warning when sync is healthy', () => {
    render(<Home />);

    expect(screen.queryByText('Data may be stale.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open practice overview' })).toBeTruthy();
    expect(screen.queryByText('App')).toBeNull();
  });

  it('renders authenticated practice controls through the practice buttons component', () => {
    render(<Home />);

    expect(screen.getByTestId('home-practice-buttons').textContent).toBe('practice:u1');
  });

  it('renders the dashboard help button in the page-owned dashboard wrapper', () => {
    render(<Home />);

    const helpButton = screen.getByRole('button', { name: 'Help' });
    expect(helpButton.closest('.pos-home-dashboard-help')).toBeTruthy();
    expect(helpButton.parentElement?.parentElement?.className).toContain('relative');
    expect(helpButton.parentElement?.parentElement?.className).toContain('mb-12');
  });

  it('renders install and guide links when user is signed in', () => {
    render(<Home />);

    expect(screen.getByRole('button', { name: 'Install' })).toBeTruthy();
    expect(screen.getByText('Guide')).toBeTruthy();
  });

  it('renders auth UI when user is signed out', () => {
    mocks.userId = null;

    render(<Home />);

    expect(screen.getByText('App')).toBeTruthy();
    expect(screen.getByText('Desc')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Install' })).toBeTruthy();
    expect(screen.getByText('Guide')).toBeTruthy();
    expect(screen.getByTestId('google-auth-button')).toBeTruthy();
    expect(screen.queryByText('Data may be stale.')).toBeNull();
  });
});
