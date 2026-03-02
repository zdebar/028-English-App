import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  levelsOverview: [] as any[],
  navigate: vi.fn(),
  goalMetCalls: [] as Array<{ current: number; goal: number }>,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    notAvailable: 'Not available',
    levelsOverview: 'Levels overview',
    levelsMasteredHelp: 'Mastered help',
    levelsStartedHelp: 'Started help',
    masteredCount: 'Mastered',
    startedCount: 'Started',
    masteredSwitchHelp: 'Switch help',
  },
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (selector: (state: { userStats: { levelsOverview: any[] } | null }) => unknown) =>
    selector({ userStats: { levelsOverview: mocks.levelsOverview } }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/components/UI/DelayedMessage', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/buttons/CloseButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="close-button" onClick={onClick}>
      close
    </button>
  ),
}));

vi.mock('@/components/UI/buttons/BaseButton', () => ({
  default: ({ onClick, children, disabled }: any) => (
    <button data-testid="rect-button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/UI/GoalMetView', () => ({
  default: ({ current, goal }: { current: number; goal: number }) => {
    mocks.goalMetCalls.push({ current, goal });
    return (
      <div data-testid="goal-view">
        {current}/{goal}
      </div>
    );
  },
}));

vi.mock('@/features/help/HelpButton', () => ({
  default: () => <div data-testid="help-button" />,
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

import LevelsOverview from '@/features/levels/LevelsOverview';

describe('LevelsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.goalMetCalls = [];
    mocks.levelsOverview = [];
  });

  it('renders not available state when levels are empty', () => {
    render(<LevelsOverview />);

    expect(screen.getByText('Not available')).toBeTruthy();
  });

  it('renders level list and toggles lesson unpacking on level click', () => {
    mocks.levelsOverview = [
      {
        level_id: 1,
        level_name: 'A1',
        startedCount: 4,
        masteredCount: 2,
        totalCount: 10,
        lessons: [
          {
            lesson_id: 101,
            lesson_name: 'Lesson 1',
            startedCount: 3,
            masteredCount: 1,
            totalCount: 5,
          },
        ],
      },
    ];

    render(<LevelsOverview />);

    expect(screen.getByText('Levels overview')).toBeTruthy();
    expect(screen.queryByText('Lesson 1')).toBeNull();

    fireEvent.click(screen.getByText('A1'));
    expect(screen.getByText('Lesson 1')).toBeTruthy();

    fireEvent.click(screen.getByText('A1'));
    expect(screen.queryByText('Lesson 1')).toBeNull();
  });

  it('toggles started/mastered mode and updates GoalMetView current values', () => {
    mocks.levelsOverview = [
      {
        level_id: 1,
        level_name: 'A1',
        startedCount: 4,
        masteredCount: 2,
        totalCount: 10,
        lessons: [
          {
            lesson_id: 101,
            lesson_name: 'Lesson 1',
            startedCount: 3,
            masteredCount: 1,
            totalCount: 5,
          },
        ],
      },
    ];

    render(<LevelsOverview />);

    fireEvent.click(screen.getByText('A1'));
    expect(mocks.goalMetCalls.some((x) => x.current === 4 && x.goal === 10)).toBe(true);
    expect(mocks.goalMetCalls.some((x) => x.current === 3 && x.goal === 5)).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Started' }));
    expect(screen.getByRole('button', { name: 'Mastered' })).toBeTruthy();
    expect(mocks.goalMetCalls.some((x) => x.current === 2 && x.goal === 10)).toBe(true);
    expect(mocks.goalMetCalls.some((x) => x.current === 1 && x.goal === 5)).toBe(true);
  });

  it('navigates to profile when close button is clicked', () => {
    mocks.levelsOverview = [
      {
        level_id: 1,
        level_name: 'A1',
        startedCount: 1,
        masteredCount: 1,
        totalCount: 1,
        lessons: [],
      },
    ];

    render(<LevelsOverview />);
    fireEvent.click(screen.getByTestId('close-button'));

    expect(mocks.navigate).toHaveBeenCalledWith('/profile');
  });
});
