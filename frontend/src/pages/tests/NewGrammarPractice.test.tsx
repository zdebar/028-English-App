import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  navigate: vi.fn(),
  showToast: vi.fn(),
  reportError: vi.fn(),
  deck: {
    loading: false,
    error: null as Error | null,
    block: null as { name: string } | null,
    grammar: null as { id: number; name: string } | null,
    isComplete: false,
    currentItem: null as { item_id: number } | null,
    noteId: null,
    grammarId: null,
    progressLabel: 'Round 1/2',
    isCzToEn: true,
    revealed: false,
    czech: 'ahoj',
    english: 'hello',
    pronunciation: '\u00A0',
    audioDisabled: false,
    showDirectionChange: false,
    handleReveal: vi.fn(),
    plusHint: vi.fn(),
    nextRepeat: vi.fn(),
    nextKnown: vi.fn(),
    completeCurrent: vi.fn(),
    audioError: false,
    playAudio: vi.fn(),
    audioLoading: false,
  },
}));

vi.mock('@/config/config', () => ({
  default: {
    loading: { dataStateDelayMs: 1000 },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    notAvailable: 'Not available',
    nothingToPractice: 'Nothing to practice',
    tryAgainLater: 'Try again later',
    tooltipHome: 'Home',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
    newGrammarComplete: 'Complete',
    continuePractice: 'Continue',
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('@/features/practice/hooks/use-new-grammar-practice-deck', () => ({
  useNewGrammarPracticeDeck: () => mocks.deck,
}));

vi.mock('@/features/practice/NewGrammarOverviewCard', () => ({
  default: ({ block, grammar, onClose, onContinue }: any) => (
    <div>
      <div data-testid="new-grammar-overview">
        {block?.name}:{grammar?.name}
      </div>
      <button type="button" onClick={onContinue}>
        Continue
      </button>
      <button type="button" onClick={onClose}>
        close overview
      </button>
    </div>
  ),
}));

vi.mock('@/features/practice/PracticeSessionCard', () => ({
  default: ({ czech, english }: any) => (
    <div data-testid="practice-session">
      {czech}:{english}
    </div>
  ),
}));

import NewGrammarPractice from '@/pages/NewGrammarPractice';

describe('NewGrammarPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mocks.userId = 'u1';
    mocks.deck.loading = false;
    mocks.deck.error = null;
    mocks.deck.block = null;
    mocks.deck.grammar = null;
    mocks.deck.isComplete = false;
    mocks.deck.currentItem = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows delayed loading circle instead of empty state while deck is loading', () => {
    mocks.deck.loading = true;

    const { container } = render(<NewGrammarPractice />);

    expect(screen.queryByText('Nothing to practice')).toBeNull();
    expect(screen.queryByText('Try again later')).toBeNull();
    expect(container.firstChild).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('renders shared empty state when there is no new grammar block', () => {
    render(<NewGrammarPractice />);

    expect(screen.getByText('Nothing to practice')).toBeTruthy();
    expect(screen.getByText('Try again later')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('renders shared empty state when a block has no current item', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };

    render(<NewGrammarPractice />);

    expect(screen.getByText('Nothing to practice')).toBeTruthy();
    expect(screen.getByText('Try again later')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
    expect(screen.queryByTestId('new-grammar-overview')).toBeNull();
  });

  it('shows the combined block and grammar overview before practice', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.currentItem = { item_id: 1 };

    render(<NewGrammarPractice />);

    expect(screen.getByTestId('new-grammar-overview').textContent).toBe('Block A:Articles');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
    expect(screen.queryByTestId('practice-session')).toBeNull();
  });

  it('continues from the combined overview to the practice session', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.currentItem = { item_id: 1 };

    render(<NewGrammarPractice />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByTestId('practice-session').textContent).toBe('ahoj:hello');
  });

  it('closes the combined overview back to home', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.currentItem = { item_id: 1 };

    render(<NewGrammarPractice />);

    fireEvent.click(screen.getByRole('button', { name: 'close overview' }));

    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('keeps completion behavior unchanged', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.isComplete = true;

    render(<NewGrammarPractice />);

    expect(screen.getByText('Complete')).toBeTruthy();
    expect(screen.getByText('Block A')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
    expect(screen.queryByTestId('new-grammar-overview')).toBeNull();
  });
});
