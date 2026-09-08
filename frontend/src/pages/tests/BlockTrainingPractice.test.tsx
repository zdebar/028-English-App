import { fireEvent, render, screen } from '@testing-library/react';
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
    progressLabel: '0/1',
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
    blockCompleted: 'Block completed',
    continuePractice: 'Continue',
    done: 'hotovo',
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
      {`${czech}:${english}`}
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

  it('renders shared empty state when there is no training block', () => {
    render(<BlockTrainingPractice />);

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('returns home from a completed named block', () => {
    mocks.deck.block = { name: 'Block A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.isComplete = true;

    render(<BlockTrainingPractice />);

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });
});
