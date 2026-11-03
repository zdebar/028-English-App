import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigationButtonRender: vi.fn(),
  pronunciationGroups: [{ isActive: true }],
  state: { userId: 'u1', status: 'ready', nowIso: '2026-01-01T00:00:00.000Z', error: null as Error | null },
  availability: {
    grammarReviewReadyAt: null as string | null,
    vocabularyReviewReadyAt: null as string | null,
    grammarReviewDueCount: 0,
    vocabularyReviewDueCount: 0,
    nextReviewAt: null as string | null,
    initialTrainingAvailable: true,
    continuingInitialLessonToday: false,
  },
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
  },
}));
vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) => selector({ userId: 'u1' }),
}));
vi.mock('@/database/state/data-store', () => ({
  useDataPackage: () => ({
    userId: mocks.state.userId,
    status: mocks.state.status,
    error: mocks.state.error ?? null,
    data: {
      practiceAvailability: mocks.availability,
      hasActivePronunciationGroups: mocks.pronunciationGroups.some((group) => group.isActive),
      levels: [],
      soundGroups: [],
    },
  }),
}));
vi.mock('@/routing/data-navigation', () => ({
  NavigationButton: ({ children, ...props }: any) => {
    mocks.navigationButtonRender();
    return <button {...props}>{children}</button>;
  },
}));

import PracticeButtons from '@/features/practice/PracticeButton';
import config from '@/config/config';

describe('Home practice buttons', () => {
  beforeEach(() => {
    mocks.navigationButtonRender.mockClear();
    mocks.pronunciationGroups = [{ isActive: true }];
    mocks.state = { userId: 'u1', status: 'ready', nowIso: new Date().toISOString(), error: null };
    mocks.availability = {
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      grammarReviewDueCount: 0,
      vocabularyReviewDueCount: 0,
      nextReviewAt: null,
      initialTrainingAvailable: true,
      continuingInitialLessonToday: false,
    };
  });

  it('keeps review disabled when no item is due, even with a stored date', () => {
    const readyAt = new Date().toISOString();
    mocks.availability.grammarReviewReadyAt = readyAt;
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(true);
    expect(screen.queryByText('2')).toBeNull();
  });

  it('shows the current due count in the matching badge', () => {
    mocks.availability.grammarReviewDueCount = 2;
    render(<PracticeButtons />);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('enables both reviews when each has one due item', () => {
    mocks.availability.grammarReviewDueCount = 1;
    mocks.availability.vocabularyReviewDueCount = 1;
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(false);
  });

  it('enables vocabulary review when grammar is not ready', () => {
    mocks.availability.grammarReviewReadyAt = new Date(Date.now() + 86_400_000).toISOString();
    mocks.availability.vocabularyReviewDueCount = 1;
    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(true);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(false);
  });

  it('locks new at the review limit', () => {
    mocks.availability.grammarReviewDueCount = config.practice.grammarReviewLimitSize;
    mocks.availability.vocabularyReviewDueCount = 3;

    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(true);
  });

  it('keeps review available when a review count exceeds its limit', () => {
    const grammarReviewCount = config.practice.grammarReviewLimitSize + 1;
    mocks.availability.grammarReviewDueCount = grammarReviewCount;
    mocks.availability.vocabularyReviewDueCount = 3;

    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(true);
    expect(screen.getByText(String(grammarReviewCount))).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('enables new below the review boundary', () => {
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(true);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(false);
  });

  it('disables practice actions while the central data snapshot is loading', () => {
    mocks.state.status = 'loading';
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
    mocks.availability.initialTrainingAvailable = false;
    render(<PracticeButtons />);
    const newButton = button('New');
    expect(newButton.disabled).toBe(true);
    expect(newButton.className).toContain('color-button');
    expect(newButton.className).not.toContain('preserve-disabled-text-color');
  });

});

function button(name: string): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}
