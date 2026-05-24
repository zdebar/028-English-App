import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  scores: [] as Array<{
    date: string;
    item_count: number;
    updated_at: string;
    deleted_at: null;
    user_id: string;
  }>,
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/database/models/user-scores', () => ({
  default: {
    getByUserId: vi.fn(async () => mocks.scores),
  },
}));

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/StarProgress', () => ({
  STAR_SIZE: 22,
  StarRow: ({ starCount }: { starCount: number }) => (
    <span data-testid="star-row">{starCount}</span>
  ),
}));

vi.mock('@/config/config', () => ({
  default: {
    practice: {
      starChunk: 40,
      starsPerRow: 10,
    },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    practiceOverviewTitle: 'Practice Overview',
    practiceOverviewMoreDays: 'More days',
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import PracticeOverview from '@/pages/PracticeOverview';

describe('PracticeOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-24T12:00:00.000Z'));
    mocks.userId = 'u1';
    mocks.scores = [
      {
        user_id: 'u1',
        date: '2026-05-24',
        item_count: 40,
        updated_at: '2026-05-24T10:00:00.000Z',
        deleted_at: null,
      },
      {
        user_id: 'u1',
        date: '2026-05-22',
        item_count: 80,
        updated_at: '2026-05-22T10:00:00.000Z',
        deleted_at: null,
      },
    ];
  });

  it('fills missing days with item_count 0 between known scores', async () => {
    render(<PracticeOverview />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getAllByTestId('star-row')).toHaveLength(3);
    const rowCounts = screen.getAllByTestId('star-row').map((el) => el.textContent);
    expect(rowCounts).toEqual(['1', '0', '2']);
  });
});
