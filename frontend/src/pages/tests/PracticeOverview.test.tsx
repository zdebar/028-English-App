import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  navigate: vi.fn(),
  items: [] as any[],
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getByUserId: vi.fn(async () => mocks.items),
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
    database: { nullReplacementDate: '9999-12-31T23:59:59+00:00' },
    practice: { dailyStartedGoal: 24 },
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
  useLoaderData: () => mocks.items,
}));

import PracticeOverview from '@/pages/PracticeOverview';

describe('PracticeOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-24T12:00:00.000Z'));
    mocks.userId = 'u1';
    mocks.items = [
      startedItem(1, '2026-05-24T10:00:00.000Z'),
      startedItem(2, '2026-05-24T11:00:00.000Z'),
      startedItem(3, '2026-05-22T10:00:00.000Z'),
      startedItem(4, '9999-12-31T23:59:59+00:00'),
      startedItem(5, '2026-05-21T10:00:00.000Z', '2026-05-22T10:00:00.000Z'),
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fills missing days and shows daily started counts', async () => {
    render(<PracticeOverview />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByText('+ 2')).toBeTruthy();
    expect(screen.getByText('+ 2').className).toContain('text-error-light');
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('+ 1')).toBeTruthy();
  });

  it('colors each daily count against the configured started goal', async () => {
    mocks.items = [
      ...Array.from({ length: 24 }, (_, index) =>
        startedItem(index + 1, '2026-05-24T12:00:00.000Z'),
      ),
      ...Array.from({ length: 23 }, (_, index) =>
        startedItem(index + 25, '2026-05-23T12:00:00.000Z'),
      ),
      startedItem(48, '2026-05-22T10:00:00.000Z'),
    ];

    render(<PracticeOverview />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('+ 24').className).toContain('text-success-light');
    expect(screen.getByText('+ 23').className).toContain('text-error-light');
    expect(screen.getByText('+ 1').className).toContain('text-error-light');
    expect(screen.queryByText(/cz > en/)).toBeNull();
  });

  it('uses the home fallback on direct entry', () => {
    render(<PracticeOverview />);
    fireEvent.click(screen.getByRole('button', { name: 'Close route' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });
  });
});

function startedItem(itemId: number, startedAt: string, deletedAt = '9999-12-31T23:59:59+00:00') {
  return {
    user_id: 'u1',
    item_id: itemId,
    started_at: startedAt,
    deleted_at: deletedAt,
  };
}
