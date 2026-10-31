import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigationButtonRender: vi.fn(),
  pronunciationGroups: [{ isActive: true }],
  pronunciationLoading: false,
  pronunciationError: null as Error | null,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    grammarReviewButton: 'Grammar review',
    vocabularyReviewButton: 'Vocabulary review',
    newButton: 'New',
    pronunciationPractice: 'Pronunciation practice',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
    noActivePronunciationGroups: 'No pronunciation comparisons unlocked',
    nothingToPractice: 'Nothing to practice',
    dailyNewLessonLimitReached: 'Daily lesson limit reached',
  },
}));
vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) => selector({ userId: 'u1' }),
}));
vi.mock('@/features/pronunciation/use-pronunciation-groups-store', () => ({
  usePronunciationGroupsStore: (
    selector: (state: {
      groups: typeof mocks.pronunciationGroups;
      loading: boolean;
      error: Error | null;
    }) => unknown,
  ) =>
    selector({
      groups: mocks.pronunciationGroups,
      loading: mocks.pronunciationLoading,
      error: mocks.pronunciationError,
    }),
}));
vi.mock('@/features/pronunciation/use-pronunciation-groups-store-sync', () => ({
  usePronunciationGroupsStoreSync: vi.fn(),
}));
vi.mock('@/routing/data-navigation', () => ({
  NavigationButton: ({ children, ...props }: any) => {
    mocks.navigationButtonRender();
    return <button {...props}>{children}</button>;
  },
}));

import PracticeButtons from '@/features/practice/PracticeButton';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';
import config from '@/config/config';

describe('Home practice buttons', () => {
  beforeEach(() => {
    mocks.navigationButtonRender.mockClear();
    mocks.pronunciationGroups = [{ isActive: true }];
    mocks.pronunciationLoading = false;
    mocks.pronunciationError = null;
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      grammarReviewDueCount: 0,
      vocabularyReviewDueCount: 0,
      nextReviewAt: null,
      initialTrainingAvailable: true,
      continuingInitialLessonToday: false,
      dailyNewLessonLimitReached: false,
      practiceLoading: false,
      practiceError: null,
    });
  });

  it('keeps review disabled when no item is due, even with a stored date', () => {
    const readyAt = new Date().toISOString();
    usePracticeAvailabilityStore.setState({ grammarReviewReadyAt: readyAt });
    const snapshot = usePracticeAvailabilityStore.getState();
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(true);
    expect(screen.queryByText('2')).toBeNull();
    expect(usePracticeAvailabilityStore.getState()).toBe(snapshot);
  });

  it('updates only the matching badge for an ordinary review count change', () => {
    usePracticeAvailabilityStore.setState({ grammarReviewDueCount: 1 });
    render(<PracticeButtons />);
    mocks.navigationButtonRender.mockClear();

    act(() => {
      usePracticeAvailabilityStore.setState({ grammarReviewDueCount: 2 });
    });

    expect(screen.getByText('2')).toBeTruthy();
    expect(mocks.navigationButtonRender).not.toHaveBeenCalled();
  });

  it('enables both reviews when each has one due item', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewDueCount: 1,
      vocabularyReviewDueCount: 1,
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(false);
  });

  it('enables vocabulary review when grammar is not ready', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: new Date(Date.now() + 86_400_000).toISOString(),
      vocabularyReviewDueCount: 1,
    });
    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(true);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(false);
  });

  it('locks new at the review limit', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      grammarReviewDueCount: config.practice.grammarReviewLimitSize,
      vocabularyReviewDueCount: 3,
    });

    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(true);
  });

  it('keeps review available when a review count exceeds its limit', () => {
    const grammarReviewCount = config.practice.grammarReviewLimitSize + 1;
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      grammarReviewDueCount: grammarReviewCount,
      vocabularyReviewDueCount: 3,
    });

    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(true);
    expect(screen.getByText(String(grammarReviewCount))).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('enables new below the review boundary', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(true);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(false);
  });

  it('disables both actions while availability is recalculated', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: new Date().toISOString(),
      vocabularyReviewReadyAt: new Date().toISOString(),
      practiceLoading: true,
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(true);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(true);
  });

  it('places pronunciation practice directly below the next-lesson button', () => {
    const { container } = render(<PracticeButtons />);
    const buttonGroup = container.firstElementChild;

    expect(buttonGroup?.className).toContain('flex-col');
    expect(buttonGroup?.className).toContain('gap-1');
    const buttons = screen.getAllByRole('button');

    expect(buttons).toHaveLength(4);
    expect(buttons[0]).toBe(button('New'));
    expect(buttons[1]).toBe(button('Pronunciation practice'));
    expect(buttons[2]).toBe(button('Grammar review'));
    expect(buttons[3]).toBe(button('Vocabulary review'));
  });

  it('keeps new visible but disabled when no unstarted lesson exists', () => {
    usePracticeAvailabilityStore.setState({ initialTrainingAvailable: false });
    render(<PracticeButtons />);
    const newButton = button('New');
    expect(newButton.disabled).toBe(true);
    expect(newButton.className).toContain('color-button');
    expect(newButton.className).not.toContain('preserve-disabled-text-color');
  });

  it('disables new when the daily lesson limit is reached', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      dailyNewLessonLimitReached: true,
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(true);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(true);
  });
});

function button(name: string): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}
