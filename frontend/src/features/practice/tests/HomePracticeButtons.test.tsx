import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type ReviewKind = 'grammar' | 'vocabulary';
type ReviewDirection = 'cz_to_en' | 'en_to_cz';

const mocks = vi.hoisted(() => ({
  navigationButtonRender: vi.fn(),
  pronunciationGroups: [{ isActive: true }],
  state: { userId: 'u1', status: 'ready', nowIso: '2026-01-01T00:00:00.000Z', error: null as Error | null },
  availability: {
    grammarReviewReadyAt: null as string | null,
    vocabularyReviewReadyAt: null as string | null,
    grammarReviewDueCount: 0,
    vocabularyReviewDueCount: 0,
    reviewDueCounts: {
      grammar: { cz_to_en: 0, en_to_cz: 0 },
      vocabulary: { cz_to_en: 0, en_to_cz: 0 },
    },
    nextReviewAt: null as string | null,
    initialTrainingAvailable: true,
    initialTrainingStarted: false,
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    grammarReviewButton: 'Grammar review',
    vocabularyReviewButton: 'Vocabulary review',
    directionCzToEn: 'From Czech to English',
    directionEnToCz: 'From English to Czech',
    availableItems: 'Available items',
    newButton: 'New',
    completeLesson: 'Continue lesson',
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
      reviewDueCounts: {
        grammar: { cz_to_en: 0, en_to_cz: 0 },
        vocabulary: { cz_to_en: 0, en_to_cz: 0 },
      },
      nextReviewAt: null,
      initialTrainingAvailable: true,
      initialTrainingStarted: false,
    };
  });

  it('keeps a direction disabled when no item is due, even with a stored date', () => {
    mocks.availability.grammarReviewReadyAt = new Date().toISOString();
    render(<PracticeButtons />);

    const czToEnButton = reviewButton('grammar', 'cz_to_en');
    expect(czToEnButton.disabled).toBe(true);
    expect(within(czToEnButton).getByText('0')).toBeTruthy();
  });

  it('shows the matching direction count in its own badge', () => {
    mocks.availability.reviewDueCounts.grammar.cz_to_en = 2;
    render(<PracticeButtons />);

    expect(within(reviewButton('grammar', 'cz_to_en')).getByText('2')).toBeTruthy();
    expect(within(reviewButton('grammar', 'en_to_cz')).getByText('0')).toBeTruthy();
  });

  it('enables only the review directions that have due items', () => {
    mocks.availability.grammarReviewDueCount = 1;
    mocks.availability.vocabularyReviewDueCount = 1;
    mocks.availability.reviewDueCounts.grammar.cz_to_en = 1;
    mocks.availability.reviewDueCounts.vocabulary.en_to_cz = 1;
    render(<PracticeButtons />);

    expect(reviewButton('grammar', 'cz_to_en').disabled).toBe(false);
    expect(reviewButton('grammar', 'en_to_cz').disabled).toBe(true);
    expect(reviewButton('vocabulary', 'cz_to_en').disabled).toBe(true);
    expect(reviewButton('vocabulary', 'en_to_cz').disabled).toBe(false);
    expect(button('New').disabled).toBe(false);
  });

  it('enables vocabulary review when grammar is not ready', () => {
    mocks.availability.grammarReviewReadyAt = new Date(Date.now() + 86_400_000).toISOString();
    mocks.availability.vocabularyReviewDueCount = 1;
    mocks.availability.reviewDueCounts.vocabulary.cz_to_en = 1;
    render(<PracticeButtons />);

    expect(reviewButton('grammar', 'cz_to_en').disabled).toBe(true);
    expect(reviewButton('vocabulary', 'cz_to_en').disabled).toBe(false);
    expect(button('New').disabled).toBe(false);
  });

  it('does not lock the next lesson when reviews reach their limit', () => {
    mocks.availability.grammarReviewDueCount = 20;
    mocks.availability.vocabularyReviewDueCount = 3;
    mocks.availability.reviewDueCounts.grammar.cz_to_en = 20;
    mocks.availability.reviewDueCounts.vocabulary.en_to_cz = 3;
    render(<PracticeButtons />);

    expect(reviewButton('grammar', 'cz_to_en').disabled).toBe(false);
    expect(reviewButton('vocabulary', 'en_to_cz').disabled).toBe(false);
    expect(button('New').disabled).toBe(false);
  });

  it('enables the next lesson when no reviews are due', () => {
    render(<PracticeButtons />);

    expect(reviewButton('grammar', 'cz_to_en').disabled).toBe(true);
    expect(reviewButton('vocabulary', 'cz_to_en').disabled).toBe(true);
    expect(button('New').disabled).toBe(false);
  });

  it('disables all practice actions while the central data snapshot is loading', () => {
    mocks.state.status = 'loading';
    render(<PracticeButtons />);

    expect(button('New').disabled).toBe(true);
    expect(button('Pronunciation practice').disabled).toBe(true);
    expect(reviewButton('grammar', 'cz_to_en').disabled).toBe(true);
    expect(reviewButton('grammar', 'en_to_cz').disabled).toBe(true);
    expect(reviewButton('vocabulary', 'cz_to_en').disabled).toBe(true);
    expect(reviewButton('vocabulary', 'en_to_cz').disabled).toBe(true);
  });

  it('shows the two review groups after pronunciation and next-lesson actions', () => {
    const { container } = render(<PracticeButtons />);
    const buttonGroup = container.firstElementChild;

    expect(buttonGroup?.className).toContain('flex-col');
    expect(buttonGroup?.className).toContain('gap-1');
    const buttons = screen.getAllByRole('button');

    expect(buttons).toHaveLength(6);
    expect(buttons[0]).toBe(button('Pronunciation practice'));
    expect(buttons[1]).toBe(button('New'));
    expect(buttons[2]).toBe(reviewButton('vocabulary', 'cz_to_en'));
    expect(buttons[3]).toBe(reviewButton('vocabulary', 'en_to_cz'));
    expect(buttons[4]).toBe(reviewButton('grammar', 'cz_to_en'));
    expect(buttons[5]).toBe(reviewButton('grammar', 'en_to_cz'));
  });

  it('keeps next lesson visible but disabled when no unstarted lesson exists', () => {
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

function reviewButton(reviewKind: ReviewKind, direction: ReviewDirection): HTMLButtonElement {
  const kindLabel = reviewKind === 'grammar' ? 'Grammar review' : 'Vocabulary review';
  const directionLabel = direction === 'cz_to_en' ? 'From Czech to English' : 'From English to Czech';
  const dueCount = mocks.availability.reviewDueCounts[reviewKind][direction];
  const accessibleName = `${kindLabel}: ${directionLabel}. Available items: ${dueCount}`;
  return button(accessibleName);
}
