import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  levelsOverview: [] as any[],
  blockBar: vi.fn(),
  getInProgressLessons: vi.fn(),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    startedTodayHint: 'Started today hint',
    masteredTodayHint: 'Mastered today hint',
    masteredCount: 'Mastered',
    startedCount: 'Started',
    masteredSwitchHelp: 'Switch help',
  },
}));

vi.mock('@/features/dashboard/use-user-store', () => ({
  useUserStore: (selector: (state: { userStats: { levelsOverview: any[] } | null }) => unknown) =>
    selector({ userStats: { levelsOverview: mocks.levelsOverview } }),
}));

vi.mock('@/features/help/HelpButton', () => ({
  default: () => <div data-testid="help-button" />,
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/features/dashboard/BlockBar', () => ({
  default: (props: any) => {
    mocks.blockBar(props);
    return <div data-testid="blockbar" />;
  },
}));

vi.mock('@/features/dashboard/dashboard.utils', () => ({
  getInProgressLessons: (...args: unknown[]) => mocks.getInProgressLessons(...args),
}));

import Dashboard from '@/features/dashboard/Dashboard';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.levelsOverview = [
      {
        lessons: [
          {
            lesson_id: 1,
            lesson_name: 'Lesson 1',
            level_name: 'A1',
            startedCount: 5,
            startedTodayCount: 2,
            masteredCount: 4,
            masteredTodayCount: 1,
            totalCount: 10,
          },
        ],
      },
    ];
    mocks.getInProgressLessons.mockImplementation((_levels, mode) => [
      {
        lesson_id: 1,
        lesson_name: 'Lesson 1',
        level_name: 'A1',
        startedCount: 5,
        startedTodayCount: 2,
        masteredCount: 4,
        masteredTodayCount: 1,
        totalCount: 10,
        mode,
      },
    ]);
  });

  it('renders with started mode by default and passes started counts to BlockBar', () => {
    render(<Dashboard />);

    expect(screen.getByText('Started')).toBeTruthy();
    expect(mocks.getInProgressLessons).toHaveBeenCalledWith(mocks.levelsOverview, 'started');

    const matchingCall = mocks.blockBar.mock.calls.find(
      ([props]) => props.previousCount === 3 && props.todayCount === 2,
    );
    expect(Boolean(matchingCall)).toBe(true);
  });

  it('toggles to mastered mode and updates button text and counts', () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Mastered')).toBeTruthy();
    expect(mocks.getInProgressLessons).toHaveBeenCalledWith(mocks.levelsOverview, 'mastered');

    const masteredCall = mocks.blockBar.mock.calls.find(
      ([props]) => props.previousCount === 3 && props.todayCount === 1,
    );
    expect(Boolean(masteredCall)).toBe(true);
  });
});
