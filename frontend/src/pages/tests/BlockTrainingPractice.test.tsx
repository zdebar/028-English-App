import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  navigate: vi.fn(),
  showToast: vi.fn(),
  reportError: vi.fn(),
  overviewRender: vi.fn(),
  deck: {
    loading: false,
    error: null as Error | null,
    block: null as { name: string } | null,
    grammar: null as { id: number; name: string } | null,
    grammarGroup: null as { note: string | null } | null,
    isComplete: false,
    hasProgress: false,
    currentItem: null as { item_id: number } | null,
    note: null,
    practiceGrammar: null,
    progressLabel: '1/2 · 0/1',
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
    blockTrainingComplete: 'Complete',
    continuePractice: 'Continue',
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLoaderData: () => ({
    block: { block_id: 10 },
    items: [],
    entries: [],
    grammar: null,
    grammarGroup: null,
  }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('@/features/practice/hooks/use-block-training-deck', () => ({
  useInitialTrainingDeck: () => mocks.deck,
}));

vi.mock('@/features/practice/BlockTrainingOverviewCard', () => ({
  default: ({ block, grammar, grammarGroup, onContinue }: any) => {
    mocks.overviewRender();
    return (
      <div>
        <div data-testid="block-training-overview">
          {block?.name}:{grammar?.name}:{grammarGroup?.note}
        </div>
        <button type="button" onClick={onContinue}>
          Continue
        </button>
      </div>
    );
  },
}));

vi.mock('@/features/practice/PracticeSessionCard', () => ({
  default: ({ czech, english }: any) => (
    <div data-testid="practice-session">
      {czech}:{english}
    </div>
  ),
}));

import BlockTrainingPractice from '@/pages/BlockTrainingPractice';

describe('BlockTrainingPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mocks.userId = 'u1';
    mocks.deck.loading = false;
    mocks.deck.error = null;
    mocks.deck.block = null;
    mocks.deck.grammar = null;
    mocks.deck.grammarGroup = null;
    mocks.deck.isComplete = false;
    mocks.deck.hasProgress = false;
    mocks.deck.currentItem = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows delayed loading circle instead of empty state while deck is loading', () => {
    mocks.deck.loading = true;

    const { container } = render(<BlockTrainingPractice />);

    expect(screen.queryByText('Nothing to practice')).toBeNull();
    expect(screen.queryByText('Try again later')).toBeNull();
    expect(container.firstChild).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('renders shared empty state when there is no training block', () => {
    render(<BlockTrainingPractice />);

    expect(screen.getByText('Nothing to practice')).toBeTruthy();
    expect(screen.getByText('Try again later')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('renders shared empty state when a block has no current item', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.grammarGroup = { note: 'Group note' };

    render(<BlockTrainingPractice />);

    expect(screen.getByText('Nothing to practice')).toBeTruthy();
    expect(screen.getByText('Try again later')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
    expect(screen.queryByTestId('block-training-overview')).toBeNull();
  });

  it('shows the combined block and grammar overview before practice', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.grammarGroup = { note: 'Group note' };
    mocks.deck.currentItem = { item_id: 1 };

    render(<BlockTrainingPractice />);

    expect(screen.getByTestId('block-training-overview').textContent).toBe(
      'Block A:Articles:Group note',
    );
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
    expect(screen.queryByTestId('practice-session')).toBeNull();
  });

  it('continues from the combined overview to the practice session', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.currentItem = { item_id: 1 };

    render(<BlockTrainingPractice />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByTestId('practice-session').textContent).toBe('ahoj:hello');
  });

  it('resumes a started block without rendering the overview first', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.currentItem = { item_id: 1 };
    mocks.deck.hasProgress = true;

    render(<BlockTrainingPractice />);

    expect(screen.getByTestId('practice-session').textContent).toBe('ahoj:hello');
    expect(screen.queryByTestId('block-training-overview')).toBeNull();
    expect(mocks.overviewRender).not.toHaveBeenCalled();
  });

  it('starts an automatic batch without rendering an overview', () => {
    mocks.deck.block = null;
    mocks.deck.currentItem = { item_id: 1 };

    render(<BlockTrainingPractice />);

    expect(screen.getByTestId('practice-session').textContent).toBe('ahoj:hello');
    expect(screen.queryByTestId('block-training-overview')).toBeNull();
  });

  it('shows the block overview when the training block has no grammar', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = null;
    mocks.deck.currentItem = { item_id: 1 };

    render(<BlockTrainingPractice />);

    expect(screen.getByTestId('block-training-overview').textContent).toBe('Block A::');
    expect(screen.queryByTestId('practice-session')).toBeNull();
  });

  it('does not offer a close action on the mandatory overview', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.currentItem = { item_id: 1 };

    render(<BlockTrainingPractice />);

    expect(screen.queryByRole('button', { name: 'close overview' })).toBeNull();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('returns Home after the completed-star animation', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.isComplete = true;

    render(<BlockTrainingPractice />);

    expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });
    expect(screen.queryByTestId('block-training-overview')).toBeNull();
  });
});
