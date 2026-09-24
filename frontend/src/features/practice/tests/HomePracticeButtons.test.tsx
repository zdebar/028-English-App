import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    reviewButton: 'Review',
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
      reviewReadyAt: null,
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
    usePracticeAvailabilityStore.setState({ reviewReadyAt: readyAt });
    const snapshot = usePracticeAvailabilityStore.getState();
    render(<PracticeButtons />);
    expect(button('Review').disabled).toBe(true);
    expect(screen.getByText('2')).toBeTruthy();
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(button('Review').disabled).toBe(false);
    expect(screen.queryByText('2')).toBeNull();
    expect(usePracticeAvailabilityStore.getState()).toBe(snapshot);
  });

  it('formats the disabled review countdown by remaining duration', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T10:00:00Z'));
    usePracticeAvailabilityStore.setState({
      reviewReadyAt: '2026-09-25T13:04:05Z',
    });

    render(<PracticeButtons />);
    expect(screen.getByText('2d 03:04:05')).toBeTruthy();
  });

  it('shows only seconds near the review boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T10:00:00Z'));
    usePracticeAvailabilityStore.setState({
      reviewReadyAt: '2026-09-23T10:00:05Z',
    });

    render(<PracticeButtons />);
    expect(screen.getByText('5')).toBeTruthy();
  });
  it('gives review priority at the configured review boundary', () => {
    usePracticeAvailabilityStore.setState({ reviewReadyAt: new Date().toISOString() });
    render(<PracticeButtons />);
    expect(button('Review').disabled).toBe(false);
    expect(button('New').disabled).toBe(true);
  });

  it('enables new below the review boundary', () => {
    usePracticeAvailabilityStore.setState({ reviewReadyAt: null });
    render(<PracticeButtons />);
    expect(button('Review').disabled).toBe(true);
    expect(button('New').disabled).toBe(false);
  });

  it('disables both actions while availability is recalculated', () => {
    usePracticeAvailabilityStore.setState({
      reviewReadyAt: new Date().toISOString(),
      practiceLoading: true,
    });
    render(<PracticeButtons />);
    expect(button('Review').disabled).toBe(true);
    expect(button('New').disabled).toBe(true);
  });

  it('stacks review before new with the shared one-unit gap', () => {
    const { container } = render(<PracticeButtons />);
    const buttonGroup = container.firstElementChild;

    expect(buttonGroup?.className).toContain('flex-col');
    expect(buttonGroup?.className).toContain('gap-1');
    expect(screen.getAllByRole('button').map((item) => item.textContent)).toEqual([
      'New',
      'Review',
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
      reviewReadyAt: null,
      activeSession: makeSession('review'),
    });
    render(<PracticeButtons />);
    expect(button('Review').disabled).toBe(false);
    expect(button('New').disabled).toBe(true);
  });

  it('keeps only an active new session available', () => {
    usePracticeAvailabilityStore.setState({
      reviewReadyAt: new Date().toISOString(),
      activeSession: makeSession('new'),
    });
    render(<PracticeButtons />);
    expect(button('Review').disabled).toBe(true);
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
