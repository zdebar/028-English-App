import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(
  (): {
    theme: 'light' | 'dark';
    userId: string | null;
    userFullName: string | null;
    userEmail: string | null;
    isAnonymousUser: boolean;
    authLoading: boolean;
    dailyStarCount: number;
    isSyncError: boolean;
  } => ({
    theme: 'light',
    userId: 'u1',
    userFullName: 'User One',
    userEmail: 'u1@example.com',
    isAnonymousUser: false,
    authLoading: false,
    dailyStarCount: 3,
    isSyncError: false,
  }),
);

vi.mock('@/config/config', () => ({
  default: {
    database: {
      dbName: 'test-db',
    },
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
      loading: boolean;
    }) => unknown,
  ) =>
    selector({
      userId: mocks.userId,
      userFullName: mocks.userFullName,
      userEmail: mocks.userEmail,
      isAnonymousUser: mocks.isAnonymousUser,
      loading: mocks.authLoading,
    }),
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (selector: (state: { dailyStarCount: number }) => unknown) =>
    selector({ dailyStarCount: mocks.dailyStarCount }),
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
    loadingMessage: 'Loading',
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

vi.mock('@/features/pwa/InstallPwaButton', () => ({
  InstallPWAButton: ({ className }: any) => (
    <button type="button" className={className}>
      Install
    </button>
  ),
}));

vi.mock('@/features/practice-overview/PracticeOverviewButton', () => ({
  default: ({ count, ariaLabel, helpText }: any) => (
    <button type="button" aria-label={ariaLabel} data-testid="practice-overview-button">
      {count}:{helpText}
    </button>
  ),
}));

vi.mock('@/routing/route-data', () => ({
  practiceOverviewDescriptor: () => ({ key: 'practice-overview', load: vi.fn() }),
}));

vi.mock('@/features/auth/GoogleAuthButton', () => ({
  default: () => <div data-testid="google-auth-button" />,
}));

vi.mock('@/features/auth/AnonymousSigninButton', () => ({
  default: () => <div data-testid="anonymous-signin-button" />,
}));

vi.mock('@/features/synchronization/SimulateDataButton', () => ({
  default: () => <div data-testid="simulate-data-button" />,
}));

vi.mock('@/features/practice/PracticeButton', () => ({
  default: ({ userId }: any) => (
    <div data-testid="home-practice-buttons" className="flex flex-col gap-1">
      <button type="button">Review {userId}</button>
      <button type="button">New</button>
    </div>
  ),
}));

vi.mock('@/features/pronunciation/PronunciationPracticeButton', () => ({
  default: () => (
    <button type="button" data-testid="pronunciation-practice-button">
      Pronunciation
    </button>
  ),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, className, to }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
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
    mocks.authLoading = false;
    mocks.dailyStarCount = 3;
    mocks.isSyncError = false;
  });

  it('shows sync warning when sync has failed', () => {
    mocks.isSyncError = true;

    render(<Home />);

    expect(screen.getByText('Data may be stale.')).toBeTruthy();
  });

  it('shows only the loading indicator while auth state is unresolved', () => {
    mocks.authLoading = true;
    mocks.userId = null;

    render(<Home />);

    expect(screen.getByLabelText('Loading')).toBeTruthy();
    expect(screen.queryByTestId('google-auth-button')).toBeNull();
    expect(screen.queryByTestId('anonymous-signin-button')).toBeNull();
    expect(screen.queryByTestId('home-practice-buttons')).toBeNull();
    expect(screen.queryByTestId('practice-overview-button')).toBeNull();
    expect(screen.queryByTestId('dashboard')).toBeNull();
  });

  it('does not show sync warning when sync is healthy', () => {
    render(<Home />);

    expect(screen.getByText('Data may be stale.').className).toContain('invisible');
    expect(screen.getByRole('button', { name: 'Open practice overview' })).toBeTruthy();
    expect(screen.queryByText('App')).toBeNull();
  });

  it('renders authenticated practice controls through the practice buttons component', () => {
    render(<Home />);

    const practiceButtons = screen.getByTestId('home-practice-buttons');
    const actions = screen.getByTestId('pronunciation-practice-button').parentElement;

    expect(practiceButtons.className).toContain('flex-col');
    expect(practiceButtons.className).toContain('gap-1');
    expect(actions?.className).toContain('flex-col');
    expect(actions?.className).toContain('gap-1');
    const actionLabels = within(actions as HTMLElement)
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(actionLabels).toEqual(['Review u1', 'New', 'Pronunciation']);
    expect(screen.queryByText('Studium')).toBeNull();
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('renders the dashboard help button in the page-owned dashboard wrapper', () => {
    render(<Home />);

    const helpButton = screen.getByRole('button', { name: 'Help' });
    expect(helpButton.closest('.pos-home-dashboard-help')).toBeTruthy();
    expect(helpButton.parentElement?.parentElement?.className).toContain('relative');
    expect(helpButton.parentElement?.parentElement?.className).toContain(
      'home-bottom-controls-clearance',
    );
  });

  it('renders install and guide links when user is signed in', () => {
    render(<Home />);

    const install = screen.getByRole('button', { name: 'Install' });
    const guide = screen.getByRole('link', { name: 'Guide' });
    const sharedClasses = [
      'color-info',
      'font-headings',
      'text-lg',
      'decoration-current',
      'underline-offset-4',
      'hover:underline',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
    ];

    sharedClasses.forEach((className) => {
      expect(install.className).toContain(className);
      expect(guide.className).toContain(className);
    });
    expect(guide.getAttribute('href')).toBe('/guide');
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

  it('renders authenticated controls for an anonymous user', () => {
    mocks.isAnonymousUser = true;

    render(<Home />);

    expect(screen.getByTestId('home-practice-buttons')).toBeTruthy();
    expect(screen.getByTestId('simulate-data-button')).toBeTruthy();
    expect(screen.queryByTestId('google-auth-button')).toBeNull();
  });
});
