import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  levels: [] as unknown[],
  levelsLoading: false,
  descriptorUserId: null as string | null,
  lessons: [] as Array<{
    id: number;
    name: string;
    sort_order: number;
    startedCount?: number;
    dailyProgressChange?: number;
  }>,
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (selector: (state: { levels: unknown[]; levelsLoading: boolean }) => unknown) =>
    selector({
      levels: mocks.levels,
      levelsLoading: mocks.levelsLoading,
    }),
}));

vi.mock('@/utils/dashboard.utils', () => ({
  getInProgressLessons: () => mocks.lessons,
}));

vi.mock('@/routing/route-data', () => ({
  levelsDescriptor: (userId: string) => {
    mocks.descriptorUserId = userId;
    return { key: `levels:${userId}`, load: vi.fn() };
  },
}));

vi.mock('@/routing/data-navigation', () => ({
  DataNavigationLink: ({ to, descriptor, children, ...props }: any) => (
    <a href={to} data-descriptor-key={descriptor?.key} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/UI/BlockBar', () => ({
  default: ({
    lessonName,
    dailyProgressChange,
  }: {
    lessonName: string;
    dailyProgressChange: number;
  }) => (
    <div data-testid="block-bar">
      {lessonName}:{dailyProgressChange}
    </div>
  ),
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

vi.mock('@/locales/cs', () => ({
  ARIA_TEXTS: { dashboardRegion: 'Dashboard' },
  TEXTS: {
    noDashboardData: 'No data.',
    progressTodayHint: 'Today progress change',
    levelsOverviewTooltip: 'Open CEFR overview',
  },
}));

import Dashboard from '@/features/dashboard/Dashboard';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.levels = [];
    mocks.levelsLoading = false;
    mocks.lessons = [];
    mocks.descriptorUserId = null;
  });

  it('does not render a no-data message while levels are loading', () => {
    mocks.levelsLoading = true;

    render(<Dashboard userId="u1" />);

    expect(screen.queryByText('No data.')).toBeNull();
    expect(screen.queryByTestId('block-bar')).toBeNull();
    expect(screen.queryByText('Today progress change')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders a non-interactive no-data message when no CEFR data exists', () => {
    render(<Dashboard userId="u1" />);

    expect(screen.getByText('No data.')).toBeTruthy();
    expect(screen.queryByTestId('block-bar')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('shows no-data state when levels have no lesson data', () => {
    mocks.levels = [{ id: 1 }];

    render(<Dashboard userId="u1" />);

    expect(screen.getByText('No data.')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('keeps the first lesson visible when lesson data exists but nothing is started', () => {
    mocks.levels = [{ id: 1 }];
    mocks.lessons = [
      {
        id: 1,
        name: 'First lesson',
        sort_order: 1,
        startedCount: 0,
        dailyProgressChange: 0,
      },
    ];

    render(<Dashboard userId="u1" />);

    expect(screen.getByText('First lesson:0')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/levels');
    expect(mocks.descriptorUserId).toBe('u1');
  });

  it('renders all changed lessons and preserves the levels overview link', () => {
    mocks.levels = [{ id: 1 }];
    mocks.lessons = [
      {
        id: 1,
        name: 'Lesson 1',
        sort_order: 1,
        startedCount: 2,
        dailyProgressChange: 3,
      },
      {
        id: 2,
        name: 'Lesson 2',
        sort_order: 2,
        startedCount: 1,
        dailyProgressChange: -2,
      },
    ];

    render(<Dashboard userId="u1" />);

    expect(screen.getByText('Today progress change')).toBeTruthy();
    expect(screen.getByText('Lesson 1:3')).toBeTruthy();
    expect(screen.getByText('Lesson 2:-2')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/levels');
  });
});
