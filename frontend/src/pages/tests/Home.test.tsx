import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(
  (): {
    theme: 'light' | 'dark';
    userId: string | null;
    userFullName: string | null;
    userEmail: string | null;
    dailyCount: number;
    isSyncError: boolean;
    unlockNextGrammarBlock: any;
    getFirstUnlockedGrammarBlock: any;
    countReadyGrammarItems: any;
    reportError: any;
  } => ({
    theme: 'light',
    userId: 'u1',
    userFullName: 'User One',
    userEmail: 'u1@example.com',
    dailyCount: 3,
    isSyncError: false,
    unlockNextGrammarBlock: vi.fn(),
    getFirstUnlockedGrammarBlock: vi.fn(),
    countReadyGrammarItems: vi.fn(),
    reportError: vi.fn(),
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
    vocabularyPracticeButton: 'Vocabulary',
    newGrammarPracticeButton: 'New grammar',
    grammarPracticeButton: 'Grammar',
  },
}));

vi.mock('@/features/dashboard/Dashboard', () => ({
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

vi.mock('@/features/synchronization/SimulateDataButton', () => ({
  default: () => <div data-testid="simulate-data-button" />,
}));

vi.mock('@/database/models/user-blocks', () => ({
  default: {
    unlockNextGrammarBlock: (...args: unknown[]) => mocks.unlockNextGrammarBlock(...args),
    getFirstUnlockedGrammarBlock: (...args: unknown[]) =>
      mocks.getFirstUnlockedGrammarBlock(...args),
    countReadyGrammarItems: (...args: unknown[]) => mocks.countReadyGrammarItems(...args),
  },
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
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
    mocks.isSyncError = false;
    mocks.unlockNextGrammarBlock.mockResolvedValue(null);
    mocks.getFirstUnlockedGrammarBlock.mockResolvedValue(null);
    mocks.countReadyGrammarItems.mockResolvedValue(0);
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

  it('loads practice-state data when available', async () => {
    mocks.getFirstUnlockedGrammarBlock.mockResolvedValue({
      user_id: 'u1',
      block_id: 10,
      name: 'Block',
      note: '',
      lesson_id: 1,
      grammar_id: 2,
      sort_order: 1,
      progress: 0,
      is_vocabulary: false,
      started_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      next_at: '9999-12-31T23:59:59+00:00',
      mastered_at: '9999-12-31T23:59:59+00:00',
      deleted_at: '9999-12-31T23:59:59+00:00',
    });
    mocks.countReadyGrammarItems.mockResolvedValue(4);

    render(<Home />);

    await waitFor(() => {
      const newGrammarButton = screen.getByText('New grammar').closest('button') as HTMLButtonElement;
      const grammarButton = screen.getByText('Grammar').closest('button') as HTMLButtonElement;
      expect(newGrammarButton.disabled).toBe(false);
      expect(grammarButton.disabled).toBe(false);
    });
  });

  it('falls back to disabled practice controls when practice-state loading fails', async () => {
    mocks.unlockNextGrammarBlock.mockRejectedValue(new Error('Dexie failure'));

    render(<Home />);

    await waitFor(() => {
      expect(mocks.reportError).toHaveBeenCalledWith(
        'Failed to load practice button state',
        expect.any(Error),
      );
    });

    expect((screen.getByText('New grammar').closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByText('Grammar').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders auth UI when user is signed out', () => {
    mocks.userId = null;

    render(<Home />);

    expect(screen.getByText('App')).toBeTruthy();
    expect(screen.getByText('Desc')).toBeTruthy();
    expect(screen.getByTestId('google-auth-button')).toBeTruthy();
    expect(screen.queryByText('Data may be stale.')).toBeNull();
  });
});
