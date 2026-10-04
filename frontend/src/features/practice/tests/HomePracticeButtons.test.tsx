import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    grammarReviewButton: 'Grammar review',
    vocabularyReviewButton: 'Vocabulary review',
    newButton: 'New',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
    nothingToPractice: 'Nothing to practice',
  },
}));
vi.mock('@/routing/data-navigation', () => ({
  NavigationButton: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

import PracticeButtons from '@/features/practice/PracticeButton';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';
import config from '@/config/config';

describe('Home practice buttons', () => {
  beforeEach(() => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      grammarReviewDueCount: 0,
      vocabularyReviewDueCount: 0,
      nextReviewAt: null,
      initialTrainingAvailable: true,
      activeSession: null,
      practiceLoading: false,
      practiceError: null,
    });
  });

  it('keeps review disabled before the stored date without rendering a time value', () => {
    const readyAt = new Date(Date.now() + 2_000).toISOString();
    usePracticeAvailabilityStore.setState({ grammarReviewReadyAt: readyAt });
    const snapshot = usePracticeAvailabilityStore.getState();
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(true);
    expect(screen.queryByText('2')).toBeNull();
    expect(usePracticeAvailabilityStore.getState()).toBe(snapshot);
  });

  it('enables both reviews independently at the configured review boundary', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: new Date().toISOString(),
      vocabularyReviewReadyAt: new Date().toISOString(),
      grammarReviewDueCount: config.practice.grammarReviewLimitSize,
      vocabularyReviewDueCount: config.practice.vocabularyReviewLimitSize,
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(false);
  });

  it('enables vocabulary review when grammar is not ready', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: new Date(Date.now() + 86_400_000).toISOString(),
      vocabularyReviewReadyAt: new Date().toISOString(),
      vocabularyReviewDueCount: config.practice.vocabularyReviewLimitSize,
    });
    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(true);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(false);
  });

  it('keeps new available at the review limit', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      grammarReviewDueCount: config.practice.grammarReviewLimitSize,
      vocabularyReviewDueCount: 3,
    });

    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(false);
  });

  it('locks new when a review count exceeds its limit', () => {
    const grammarReviewCount = config.practice.grammarReviewLimitSize + 1;
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      grammarReviewDueCount: grammarReviewCount,
      vocabularyReviewDueCount: 3,
    });

    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(true);
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

  it('stacks review before new with the shared one-unit gap', () => {
    const { container } = render(<PracticeButtons />);
    const buttonGroup = container.firstElementChild;

    expect(buttonGroup?.className).toContain('flex-col');
    expect(buttonGroup?.className).toContain('gap-1');
    expect(screen.getAllByRole('button').map((item) => item.textContent)).toEqual([
      'New',
      'Grammar review',
      'Vocabulary review',
    ]);
  });

  it('uses the shared primary disabled style when no new block exists', () => {
    usePracticeAvailabilityStore.setState({ initialTrainingAvailable: false });
    render(<PracticeButtons />);
    const newButton = button('New');
    expect(newButton.disabled).toBe(true);
    expect(newButton.className).toContain('color-button');
  });

  it('does not give a legacy active review session special availability', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      activeSession: makeSession('review'),
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(true);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(false);
  });

  it('keeps an active new session available alongside review', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: new Date().toISOString(),
      vocabularyReviewReadyAt: null,
      activeSession: makeSession('new'),
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(false);
  });
});

function button(name: string): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

function makeSession(mode: 'review' | 'new') {
  return {
    user_id: 'u1',
    mode,
    completed_count: 4,
    target_count: 20,
    block_id: null,
    phase: mode === 'new' ? (0 as const) : null,
    current_queue_item_ids: [],
    retry_queue_item_ids: [],
    completed_item_ids: [],
    started_at: '2026-08-23T08:00:00.000Z',
    updated_at: '2026-08-23T08:00:00.000Z',
  };
}
