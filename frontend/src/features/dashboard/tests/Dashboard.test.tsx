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
    levelsOverview: 'Přehled CEFR úrovní',
    levelsOverviewTooltip: 'Otevřít přehled CEFR úrovní',
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

    expect(screen.queryByText('Žádná data.')).toBeNull();
    expect(screen.queryByTestId('block-bar')).toBeNull();
    expect(screen.queryByText('Dnes zahajeno')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button', { name: 'toggle' })).toBeNull();
  });

  it('renders a non-interactive no-data message when no CEFR data exists', () => {
    render(<Dashboard userId="u1" />);

    expect(screen.getByText('Žádná data.')).toBeTruthy();
    expect(screen.queryByTestId('block-bar')).toBeNull();
    expect(screen.queryByText('Dnes zahajeno')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button', { name: 'toggle' })).toBeNull();
  });

  it('links to the levels overview when CEFR data exists without started lessons', () => {
    mocks.levels = [{ id: 1 }];

    render(<Dashboard userId="u1" />);

    const link = screen.getByRole('link', { name: /CEFR/ });
    expect(link.getAttribute('href')).toBe('/levels');
    expect(link.getAttribute('data-descriptor-key')).toBe('levels:u1');
    expect(screen.getByText(/CEFR/).className).toContain('color-info');
    expect(mocks.descriptorUserId).toBe('u1');
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

    mocks.levels = [{ id: 1 }];

    render(<Dashboard userId="u1" />);

    expect(screen.getByText('Dnes zahajeno')).toBeTruthy();
    expect(screen.getByText('Lesson 1:1')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/levels');
  });
});
