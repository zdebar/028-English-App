import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

const mocks = vi.hoisted(() => ({
  levelsOverview: [] as any[],
  navigate: vi.fn(),
  goalMetCalls: [] as Array<{ current: number; goal: number }>,
  showMasteredLevels: false,
  storeListeners: new Set<() => void>(),
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
  ARIA_TEXTS: {
    lessonProgressBar: 'Lesson progress bar',
    lessonTextProgressBar: 'Lesson text progress bar',
  },
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (
    selector: (state: {
      levels: any[];
      showMasteredLevels: boolean;
      setMasteredLevels: (value: boolean) => void;
    }) => unknown,
  ) => {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

    React.useEffect(() => {
      const listener = () => forceUpdate();
      mocks.storeListeners.add(listener);
      return () => {
        mocks.storeListeners.delete(listener);
      };
    }, []);

    return selector({
      levels: mocks.levelsOverview,
      showMasteredLevels: mocks.showMasteredLevels,
      setMasteredLevels: (value: boolean) => {
        mocks.showMasteredLevels = value;
        mocks.storeListeners.forEach((listener) => listener());
      },
    });
  },
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
    mocks.showMasteredLevels = false;
    mocks.storeListeners.clear();
  });

  it('renders not available state when levels are empty', () => {
    render(<LevelsOverview />);

    expect(screen.getByText('Not available')).toBeTruthy();
  });

  it('renders level list and toggles lesson unpacking on level click', () => {
    mocks.levelsOverview = [
      {
        id: 1,
        name: 'A1',
        startedCount: 3,
        masteredCount: 1,
        totalCount: 5,
        lessons: [
          {
            id: 101,
            name: 'Lesson 1',
            startedCount: 3,
            startedTodayCount: 0,
            masteredCount: 1,
            masteredTodayCount: 0,
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
        id: 1,
        name: 'A1',
        startedCount: 3,
        masteredCount: 1,
        totalCount: 5,
        lessons: [
          {
            id: 101,
            name: 'Lesson 1',
            startedCount: 3,
            startedTodayCount: 0,
            masteredCount: 1,
            masteredTodayCount: 0,
            totalCount: 5,
          },
        ],
      },
    ];

    render(<LevelsOverview />);

    fireEvent.click(screen.getByText('A1'));
    expect(mocks.goalMetCalls.some((x) => x.current === 3 && x.goal === 5)).toBe(true);
    expect(mocks.goalMetCalls.some((x) => x.current === 3 && x.goal === 5)).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Started' }));
    expect(screen.getByRole('button', { name: 'Mastered' })).toBeTruthy();
    expect(mocks.goalMetCalls.some((x) => x.current === 1 && x.goal === 5)).toBe(true);
    expect(mocks.goalMetCalls.some((x) => x.current === 1 && x.goal === 5)).toBe(true);
  });

  it('navigates to profile when close button is clicked', () => {
    mocks.levelsOverview = [
      {
        id: 1,
        name: 'A1',
        lessons: [],
      },
    ];

    render(<LevelsOverview />);
    fireEvent.click(screen.getByTestId('close-button'));

    expect(mocks.navigate).toHaveBeenCalledWith('/profile');
  });
});
