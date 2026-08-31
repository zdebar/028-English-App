import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  navigate: vi.fn(),
  history: [] as any[],
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/database/models/user-item-progress-history', () => ({
  default: {
    getByUserId: vi.fn(async () => mocks.history),
  },
}));

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ children, onClose }: any) => (
    <div>
      <button onClick={onClose}>Close route</button>
      {children}
    </div>
  ),
}));

vi.mock('@/config/config', () => ({
  default: {
    database: { nullReplacementDate: '9999-12-31' },
    loading: { dataStateDelayMs: 0 },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    practiceOverviewTitle: 'Practice Overview',
    practiceOverviewMoreDays: 'More days',
    practiceOverviewNone: 'No days',
    loadingError: 'Loading error',
    loadingMessage: 'Loading',
    directionCzToEnShort: 'cz > en',
    directionEnToCzShort: 'en > cz',
  },
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof vi.fn }) => unknown) =>
    selector({ showToast: vi.fn() }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({ reportError: vi.fn() }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ key: 'default' }),
  useLoaderData: () => mocks.history,
}));

import PracticeOverview from '@/pages/PracticeOverview';

describe('PracticeOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-24T12:00:00.000Z'));
    mocks.userId = 'u1';
    mocks.history = [
      historyEntry('2026-05-24', 1, 8, 10, 1),
      historyEntry('2026-05-22', 2, 4, 10, 2),
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fills missing days and shows daily progress score', async () => {
    render(<PracticeOverview />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('+1')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('+2')).toBeTruthy();
  });

  it('expands a day into item directions and progress states', async () => {
    render(<PracticeOverview />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: /24/ }));
    expect(screen.getByText('1 · cz > en')).toBeTruthy();
    expect(screen.getByText('8 / 10')).toBeTruthy();
  });

  it('uses the home fallback on direct entry', () => {
    render(<PracticeOverview />);
    fireEvent.click(screen.getByRole('button', { name: 'Close route' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });
  });
});

function historyEntry(
  date: string,
  itemId: number,
  progress: number,
  maxProgress: number,
  progressChange: number,
) {
  return {
    user_id: 'u1',
    date,
    item_id: itemId,
    direction: 'czToEn',
    progress,
    max_progress: maxProgress,
    progress_change: progressChange,
    updated_at: `${date}T10:00:00.000Z`,
    deleted_at: null,
  };
}
