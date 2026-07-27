import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  levels: [] as unknown[],
  levelsLoading: false,
  lessons: [] as Array<{
    id: number;
    name: string;
    sort_order: number;
    startedCount?: number;
    startedTodayCount?: number;
    totalCount?: number;
  }>,
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (
    selector: (state: {
      levels: unknown[];
      levelsLoading: boolean;
    }) => unknown,
  ) =>
    selector({
      levels: mocks.levels,
      levelsLoading: mocks.levelsLoading,
    }),
}));

vi.mock('@/utils/dashboard.utils', () => ({
  getInProgressLessons: () => mocks.lessons,
}));

vi.mock('@/components/UI/BlockBar', () => ({
  default: ({ lessonName, todayCount }: { lessonName: string; todayCount: number }) => (
    <div data-testid="block-bar">
      {lessonName}:{todayCount}
    </div>
  ),
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

vi.mock('@/locales/cs', () => ({
  ARIA_TEXTS: { dashboardRegion: 'Dashboard' },
  TEXTS: {
    noDashboardData: 'Žádná data.',
    startedTodayHint: 'Dnes zahajeno',
  },
}));

import Dashboard from '@/features/dashboard/Dashboard';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.levels = [];
    mocks.levelsLoading = false;
    mocks.lessons = [];
  });

  it('does not render a no-data message while levels are loading', () => {
    mocks.levelsLoading = true;

    render(<Dashboard />);

    expect(screen.queryByText('Žádná data.')).toBeNull();
    expect(screen.queryByTestId('block-bar')).toBeNull();
    expect(screen.queryByText('Dnes zahajeno')).toBeNull();
    expect(screen.queryByRole('button', { name: 'toggle' })).toBeNull();
  });

  it('renders a no-data message without dashboard controls when no lessons are in progress', () => {
    render(<Dashboard />);

    expect(screen.getByText('Žádná data.')).toBeTruthy();
    expect(screen.queryByTestId('block-bar')).toBeNull();
    expect(screen.queryByText('Dnes zahajeno')).toBeNull();
    expect(screen.queryByRole('button', { name: 'toggle' })).toBeNull();
  });

  it('renders started progress without a mastered toggle', () => {
    mocks.lessons = [
      {
        id: 1,
        name: 'Lesson 1',
        sort_order: 1,
        startedCount: 2,
        startedTodayCount: 1,
        totalCount: 10,
      },
    ];

    render(<Dashboard />);

    expect(screen.getByText('Dnes zahajeno')).toBeTruthy();
    expect(screen.getByText('Lesson 1:1')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
