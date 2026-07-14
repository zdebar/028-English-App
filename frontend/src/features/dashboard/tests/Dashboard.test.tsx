import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  showMastered: false,
  setMasteredDashboard: vi.fn(),
  levels: [] as unknown[],
  levelsLoading: false,
  lessons: [] as Array<{
    id: number;
    name: string;
    sort_order: number;
    masteredCount?: number;
    masteredTodayCount?: number;
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
      showMasteredDashboard: boolean;
      setMasteredDashboard: typeof mocks.setMasteredDashboard;
    }) => unknown,
  ) =>
    selector({
      levels: mocks.levels,
      levelsLoading: mocks.levelsLoading,
      showMasteredDashboard: mocks.showMastered,
      setMasteredDashboard: mocks.setMasteredDashboard,
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

vi.mock('@/features/progress/MasteredToggleButton', () => ({
  default: ({
    showMastered,
    setShowMastered,
  }: {
    showMastered: boolean;
    setShowMastered: (value: boolean) => void;
  }) => (
    <button type="button" onClick={() => setShowMastered(!showMastered)}>
      toggle
    </button>
  ),
}));

vi.mock('@/locales/cs', () => ({
  ARIA_TEXTS: { dashboardRegion: 'Dashboard' },
  TEXTS: {
    noDashboardData: 'Žádná data.',
    masteredTodayHint: 'Dnes zvladnuto',
    startedTodayHint: 'Dnes zahajeno',
  },
}));

import Dashboard from '@/features/dashboard/Dashboard';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.showMastered = false;
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

  it('renders mastered hint and triggers toggle handler', () => {
    mocks.showMastered = true;
    mocks.lessons = [
      {
        id: 1,
        name: 'Lesson 1',
        sort_order: 1,
        masteredCount: 3,
        masteredTodayCount: 1,
        startedCount: 2,
        startedTodayCount: 1,
        totalCount: 10,
      },
    ];

    render(<Dashboard />);

    expect(screen.getByText('Dnes zvladnuto')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(mocks.setMasteredDashboard).toHaveBeenCalledWith(false);
  });
});
