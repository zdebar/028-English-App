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
    lesson: null as { name: string } | null,
    grammar: null as { id: number; name: string } | null,
    grammarGroup: null as { note: string | null } | null,
    isComplete: false,
    hasProgress: false,
    currentItem: null as { item_id: number; progress_cz_to_en: number } | null,
    note: null,
    practiceGrammar: null,
    progressLabel: '0/1',
    revealed: false,
    czech: 'ahoj',
    english: 'hello',
    pronunciation: '\u00A0',
    audioDisabled: false,
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
    database: { nullReplacementDate: '9999-12-31T23:59:59+00:00' },
    loading: { dataStateDelayMs: 1000 },
    srs: { intervals: Array.from({ length: 8 }) },
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
  useBlocker: () => ({ state: 'unblocked' }),
  useLoaderData: () => ({
    lesson: { id: 1, name: 'Lesson 1', note: null, level_id: 1, sort_order: 1, grammar_chunk_id: null, updated_at: '', deleted_at: null },
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

vi.mock('@/features/practice/hooks/use-initial-training-deck', () => ({
  useInitialTrainingDeck: () => mocks.deck,
}));

vi.mock('@/features/practice/LessonTrainingOverviewCard', () => ({
  default: ({ lesson, grammar, grammarGroup, onContinue }: any) => {
    mocks.overviewRender();
    return (
      <div>
        <div data-testid="lesson-training-overview">
          {lesson?.name}:{grammar?.name}:{grammarGroup?.note}
        </div>
        <button type="button" onClick={onContinue}>
          Continue
        </button>
      </div>
    );
  },
}));

vi.mock('@/features/practice/PracticeSessionCard', () => ({
  default: ({ czech, english, itemProgressLabel }: any) => (
    <div data-testid="practice-session">
      {`${czech}:${english}:${itemProgressLabel}`}
    </div>
  ),
}));

import InitialTrainingPractice from '@/pages/InitialTrainingPractice';

describe('InitialTrainingPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mocks.userId = 'u1';
    mocks.deck.loading = false;
    mocks.deck.error = null;
    mocks.deck.lesson = null;
    mocks.deck.grammar = null;
    mocks.deck.grammarGroup = null;
    mocks.deck.isComplete = false;
    mocks.deck.hasProgress = false;
    mocks.deck.currentItem = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders shared empty state when there is no training lesson', () => {
    render(<InitialTrainingPractice />);

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('does not render a completion page after a lesson is completed', () => {
    mocks.deck.lesson = { name: 'Lesson A' };
    mocks.deck.grammar = { id: 1, name: 'Articles' };
    mocks.deck.isComplete = true;

    render(<InitialTrainingPractice />);

    expect(screen.queryByTestId('lesson-training-overview')).toBeNull();
  });

  it('passes current item progress to the practice card', () => {
    mocks.deck.currentItem = { item_id: 1, progress_cz_to_en: 3 };

    render(<InitialTrainingPractice />);

    expect(screen.getByTestId('practice-session').textContent).toBe('ahoj:hello:3 / 8');
  });
});
