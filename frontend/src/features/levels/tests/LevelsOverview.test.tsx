import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

const mocks = vi.hoisted(() => ({
  levelsOverview: [] as any[],
  userId: 'u1',
  navigate: vi.fn(),
  goalMetCalls: [] as Array<{ current: number; goal: number }>,
  showMasteredLevels: false,
  unpackedLevelId: null as number | null,
  storeListeners: new Set<() => void>(),
  setShowMasteredLevels: vi.fn((value: boolean) => {
    mocks.showMasteredLevels = value;
    mocks.storeListeners.forEach((listener) => listener());
  }),
  hydrateUnpackedLevelId: vi.fn((userId: string | null) => {
    const storedValue = userId ? localStorage.getItem(`levels_unpacked_level_id_${userId}`) : null;
    mocks.unpackedLevelId = storedValue === null ? null : Number(storedValue);
    mocks.storeListeners.forEach((listener) => listener());
  }),
  setUnpackedLevelId: vi.fn((userId: string | null, value: number | null) => {
    mocks.unpackedLevelId = value;
    if (userId && value === null) localStorage.removeItem(`levels_unpacked_level_id_${userId}`);
    if (userId && value !== null) {
      localStorage.setItem(`levels_unpacked_level_id_${userId}`, String(value));
    }
    mocks.storeListeners.forEach((listener) => listener());
  }),
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
  useUserStore: (selector: (state: { levels: any[] }) => unknown) => {
    return selector({ levels: mocks.levelsOverview });
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) => {
    return selector({ userId: mocks.userId });
  },
}));

vi.mock('@/features/levels/use-levels-store', () => ({
  useLevelsStore: (
    selector: (state: {
      showMastered: boolean;
      setShowMastered: (value: boolean) => void;
      unpackedLevelId: number | null;
      hydrateUnpackedLevelId: (userId: string | null) => void;
      setUnpackedLevelId: (userId: string | null, value: number | null) => void;
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
      showMastered: mocks.showMasteredLevels,
      setShowMastered: mocks.setShowMasteredLevels,
      unpackedLevelId: mocks.unpackedLevelId,
      hydrateUnpackedLevelId: mocks.hydrateUnpackedLevelId,
      setUnpackedLevelId: mocks.setUnpackedLevelId,
    });
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/UI/buttons/CloseButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="close-button" onClick={onClick}>
      close
    </button>
  ),
}));

vi.mock('@/components/UI/buttons/StyledButton', () => ({
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
        {current}&gt;{goal}
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
    mocks.userId = 'u1';
    mocks.showMasteredLevels = false;
    mocks.storeListeners.clear();
    mocks.unpackedLevelId = null;
    localStorage.clear();
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
    expect(localStorage.getItem('levels_unpacked_level_id_u1')).toBe('1');

    fireEvent.click(screen.getByText('A1'));
    expect(screen.queryByText('Lesson 1')).toBeNull();
    expect(localStorage.getItem('levels_unpacked_level_id_u1')).toBeNull();
  });

  it('restores unpacked lesson list by user and level id', () => {
    localStorage.setItem('levels_unpacked_level_id_u1', '2');
    localStorage.setItem('levels_unpacked_level_id_u2', '1');
    mocks.levelsOverview = [
      {
        id: 1,
        name: 'A1',
        startedCount: 1,
        masteredCount: 0,
        totalCount: 1,
        lessons: [{ id: 101, name: 'Lesson A1', sort_order: 1, totalCount: 1 }],
      },
      {
        id: 2,
        name: 'A2',
        startedCount: 1,
        masteredCount: 0,
        totalCount: 1,
        lessons: [{ id: 201, name: 'Lesson A2', sort_order: 1, totalCount: 1 }],
      },
    ];

    render(<LevelsOverview />);

    expect(screen.queryByText('Lesson A1')).toBeNull();
    expect(screen.getByText('Lesson A2')).toBeTruthy();
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

    const toggleButton = screen.getByRole('button', { name: 'Started' });
    expect(toggleButton.className).toContain('mastered-toggle-button');
    expect(toggleButton.className).toContain('h-button');
    expect(toggleButton.className).toContain('rounded-full');
    expect(toggleButton.className).toContain('px-4');

    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: 'Mastered' })).toBeTruthy();
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
