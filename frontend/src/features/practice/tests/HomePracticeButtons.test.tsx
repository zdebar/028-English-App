import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('Home practice buttons', () => {
  afterEach(() => vi.useRealTimers());

  beforeEach(() => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      initialTrainingAvailable: true,
      activeSession: null,
      practiceLoading: false,
      practiceError: null,
    });
  });

  it('enables review at the stored date without changing the availability snapshot', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T10:00:00Z'));
    const readyAt = '2026-09-23T10:00:02Z';
    usePracticeAvailabilityStore.setState({ grammarReviewReadyAt: readyAt });
    const snapshot = usePracticeAvailabilityStore.getState();
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(true);
    expect(screen.getByText('2')).toBeTruthy();
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(button('Grammar review').disabled).toBe(false);
    expect(screen.queryByText('2')).toBeNull();
    expect(usePracticeAvailabilityStore.getState()).toBe(snapshot);
  });

  it.each([
    {
      description: 'formats the disabled review countdown by remaining duration',
      readyAt: '2026-09-25T13:04:05Z',
      expected: '2 dny + 3:04:05',
    },
    {
      description: 'does not pad countdown components and uses the singular Czech day form',
      readyAt: '2026-09-24T22:25:37Z',
      expected: '1 den + 12:25:37',
    },
    {
      description: 'uses the plural Czech day form for five or more days',
      readyAt: '2026-09-28T10:00:01Z',
      expected: '5 dní + 0:00:01',
    },
    {
      description: 'does not pad minute countdowns',
      readyAt: '2026-09-23T10:07:30Z',
      expected: '7:30',
    },
    {
      description: 'keeps leading zeroes on the following clock components',
      readyAt: '2026-09-23T11:02:03Z',
      expected: '1:02:03',
    },
    {
      description: 'shows only seconds near the review boundary',
      readyAt: '2026-09-23T10:00:05Z',
      expected: '5',
    },
  ])('$description', ({ readyAt, expected }) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T10:00:00Z'));
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: readyAt,
    });

    render(<PracticeButtons />);
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it('shows the vocabulary countdown independently', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T10:00:00Z'));
    usePracticeAvailabilityStore.setState({
      vocabularyReviewReadyAt: '2026-09-23T10:07:30Z',
    });

    render(<PracticeButtons />);

    expect(button('Vocabulary review').disabled).toBe(true);
    expect(screen.getByText('7:30')).toBeTruthy();
  });

  it('gives review priority at the configured review boundary', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: new Date().toISOString(),
      vocabularyReviewReadyAt: new Date().toISOString(),
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(true);
  });

  it('enables vocabulary review when grammar is not ready', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: new Date(Date.now() + 86_400_000).toISOString(),
      vocabularyReviewReadyAt: new Date().toISOString(),
    });
    render(<PracticeButtons />);

    expect(button('Grammar review').disabled).toBe(true);
    expect(button('Vocabulary review').disabled).toBe(false);
    expect(button('New').disabled).toBe(true);
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

  it('keeps only an active review session available', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      activeSession: makeSession('review'),
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(true);
  });

  it('gives review priority over an active new session', () => {
    usePracticeAvailabilityStore.setState({
      grammarReviewReadyAt: new Date().toISOString(),
      vocabularyReviewReadyAt: null,
      activeSession: makeSession('new'),
    });
    render(<PracticeButtons />);
    expect(button('Grammar review').disabled).toBe(false);
    expect(button('Vocabulary review').disabled).toBe(true);
    expect(button('New').disabled).toBe(true);
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
