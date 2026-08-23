import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  DataNavigationButton: ({ children, descriptor: _descriptor, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock('@/routing/route-data', () => ({
  practiceDeckDescriptor: () => ({ key: 'practice', load: vi.fn() }),
  blockTrainingDescriptor: () => ({ key: 'new', load: vi.fn() }),
}));

import PracticeButtons from '@/features/practice/PracticeButton';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';

describe('Home practice buttons', () => {
  beforeEach(() => {
    usePracticeAvailabilityStore.setState({
      reviewCount: 0,
      reviewSchedule: [],
      nextBlockId: 12,
      activeSession: null,
      practiceLoading: false,
      practiceError: null,
    });
  });

  it('gives review priority at the twenty-direction boundary', () => {
    usePracticeAvailabilityStore.setState({ reviewCount: 20 });
    render(<PracticeButtons userId="u1" />);
    expect(button('Review').disabled).toBe(false);
    expect(button('New').disabled).toBe(true);
  });

  it('enables new below the review boundary', () => {
    usePracticeAvailabilityStore.setState({ reviewCount: 19 });
    render(<PracticeButtons userId="u1" />);
    expect(button('Review').disabled).toBe(true);
    expect(button('New').disabled).toBe(false);
  });

  it('uses the shared primary disabled style when no new block exists', () => {
    usePracticeAvailabilityStore.setState({ nextBlockId: null });
    render(<PracticeButtons userId="u1" />);
    const newButton = button('New');
    expect(newButton.disabled).toBe(true);
    expect(newButton.className).toContain('color-button');
  });

  it('keeps only an active review session available', () => {
    usePracticeAvailabilityStore.setState({
      reviewCount: 0,
      activeSession: makeSession('review'),
    });
    render(<PracticeButtons userId="u1" />);
    expect(button('Review').disabled).toBe(false);
    expect(button('New').disabled).toBe(true);
  });

  it('keeps only an active new session available', () => {
    usePracticeAvailabilityStore.setState({
      reviewCount: 20,
      activeSession: makeSession('new'),
    });
    render(<PracticeButtons userId="u1" />);
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
    block_id: mode === 'new' ? 12 : null,
    phase: mode === 'new' ? (0 as const) : null,
    current_queue_item_ids: [],
    retry_queue_item_ids: [],
    completed_item_ids: [],
    started_at: '2026-08-23T08:00:00.000Z',
    updated_at: '2026-08-23T08:00:00.000Z',
  };
}
