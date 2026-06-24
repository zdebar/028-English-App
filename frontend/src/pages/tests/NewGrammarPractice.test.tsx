import { render, waitFor, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'user-1' as string | null,
  isComplete: true,
  navigate: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/features/practice/hooks/use-new-grammar-practice-deck', () => ({
  useNewGrammarPracticeDeck: () => ({
    block: {
      block_id: 10,
    },
    grammar: null,
    isComplete: mocks.isComplete,
    currentItem: null,
    noteId: null,
    grammarId: null,
    progressLabel: 'Round 4/4',
    isCzToEn: true,
    revealed: false,
    showNewGrammarIndicator: false,
    czech: undefined,
    english: undefined,
    pronunciation: undefined,
    audioDisabled: true,
    showDirectionChange: false,
    handleReveal: vi.fn(),
    plusHint: vi.fn(),
    repeatDisabled: true,
    nextRepeat: vi.fn(),
    nextKnown: vi.fn(),
    audioError: false,
    playAudio: vi.fn(),
    audioLoading: false,
  }),
}));

vi.mock('@/features/grammar/GrammarDetailCard', () => ({
  default: () => <div data-testid="grammar-detail-card" />,
}));

vi.mock('@/features/practice/PracticeSessionCard', () => ({
  default: () => <div data-testid="practice-session-card" />,
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    notAvailable: 'Not available',
    nothingToPractice: 'Nothing to practice',
    newGrammarComplete: 'New grammar complete',
    tooltipHome: 'Go home',
  },
}));

import NewGrammarPractice from '@/pages/NewGrammarPractice';

describe('NewGrammarPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'user-1';
    mocks.isComplete = true;
  });

  it('shows a success toast and redirects home when the deck is complete', async () => {
    render(<NewGrammarPractice />);

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('New grammar complete', 'success');
      expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(screen.queryByRole('button', { name: 'Go home' })).toBeNull();
  });
});
