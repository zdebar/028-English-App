import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  userStats: { practiceCountToday: 5 } as any,
  grammarVisible: false,
  grammarData: null as any,
  handleGrammar: vi.fn(),
  closeGrammar: vi.fn(),
  practiceDeck: {
    index: 0,
    currentItem: {
      item_id: 1,
      czech: 'ahoj',
      english: 'hello',
      pronunciation: 'həˈloʊ',
      audio: 'hello.opus',
      grammar_id: 10,
      progress: 2,
      show_new_grammar_indicator: false,
    },
    grammar_id: 10,
    progress: 2,
    isCzToEn: true,
    revealed: false,
    setRevealed: vi.fn(),
    showNewGrammarIndicator: false,
    czech: 'ahoj',
    english: 'hello-hint',
    pronunciation: '\u00A0',
    audioDisabled: false,
    showDirectionChange: false,
    hideDirectionChange: vi.fn(),
    plusHint: vi.fn(),
    nextItem: vi.fn(),
    error: null,
    audioError: false,
    setVolume: vi.fn(),
    playAudio: vi.fn(),
    audioLoading: false,
    isPlaying: false,
  } as any,
}));

vi.mock('@/config/config', () => ({
  default: {
    practice: { dailyGoal: 20 },
    progress: { skipProgress: 10, minusProgress: -1, plusProgress: 1 },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    syncLoadingText: 'Sync loading',
    reveal: 'Reveal',
    noAudio: 'No audio',
    loadingAudio: 'Loading audio',
    progress: 'Progress',
    today: 'Today',
    dailyGoal: 'Daily goal',
    directionCzToEn: 'CZ to EN',
    directionEnToCz: 'EN to CZ',
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('@/features/dashboard/use-user-store', () => ({
  useUserStore: (selector: (state: { userStats: any }) => unknown) =>
    selector({ userStats: mocks.userStats }),
}));

vi.mock('@/features/practice/hooks/use-grammar', () => ({
  useGrammar: () => ({
    grammarVisible: mocks.grammarVisible,
    grammarData: mocks.grammarData,
    handleGrammar: mocks.handleGrammar,
    closeGrammar: mocks.closeGrammar,
  }),
}));

vi.mock('@/features/practice/hooks/use-practice-deck', () => ({
  usePracticeDeck: () => mocks.practiceDeck,
}));

vi.mock('@/components/UI/DelayedMessage', () => ({
  default: ({ text }: any) => <div>{text}</div>,
}));

vi.mock('@/features/help/HelpButton', () => ({ default: () => <div data-testid="help-button" /> }));
vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: any) => <span>{children}</span>,
}));
vi.mock('@/components/UI/Indicator', () => ({ default: () => <span data-testid="indicator" /> }));
vi.mock('@/components/UI/icons/NotRevealedIcon', () => ({
  default: () => <span data-testid="not-revealed" />,
}));

vi.mock('@/features/practice/GrammarCard', () => ({
  default: ({ grammar }: any) => <div>GrammarCard:{grammar?.name ?? 'none'}</div>,
}));

vi.mock('@/features/practice/VolumeSlider', () => ({
  default: () => <div data-testid="volume-slider" />,
}));

vi.mock('@/features/practice/buttons/HintButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="hint-btn" onClick={onClick}>
      hint
    </button>
  ),
}));

vi.mock('@/features/practice/buttons/GrammarButton', () => ({
  default: ({ onClick, children }: any) => (
    <button data-testid="grammar-btn" onClick={onClick}>
      {children ?? 'grammar'}
    </button>
  ),
}));

vi.mock('@/features/practice/buttons/KnownButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="known-btn" onClick={onClick}>
      known
    </button>
  ),
}));

vi.mock('@/features/practice/buttons/UnknownButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="unknown-btn" onClick={onClick}>
      unknown
    </button>
  ),
}));

vi.mock('@/features/practice/buttons/MasterItemButton', () => ({
  default: ({ onConfirm }: any) => (
    <button data-testid="master-btn" onClick={() => void onConfirm()}>
      master
    </button>
  ),
}));

vi.mock('@/features/practice/buttons/PlayAudioButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="play-audio-btn" onClick={onClick}>
      play
    </button>
  ),
}));

import PracticeCard from '@/features/practice/PracticeCard';

describe('PracticeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mocks.userId = 'u1';
    mocks.grammarVisible = false;
    mocks.grammarData = null;
    mocks.userStats = { practiceCountToday: 5 };
    mocks.practiceDeck.index = 0;
    mocks.practiceDeck.currentItem = {
      item_id: 1,
      czech: 'ahoj',
      english: 'hello',
      pronunciation: 'həˈloʊ',
      audio: 'hello.opus',
      grammar_id: 10,
      progress: 2,
      show_new_grammar_indicator: false,
    };
    mocks.practiceDeck.grammar_id = 10;
    mocks.practiceDeck.progress = 2;
    mocks.practiceDeck.isCzToEn = true;
    mocks.practiceDeck.revealed = false;
    mocks.practiceDeck.showNewGrammarIndicator = false;
    mocks.practiceDeck.czech = 'ahoj';
    mocks.practiceDeck.english = 'hello-hint';
    mocks.practiceDeck.pronunciation = '\u00A0';
    mocks.practiceDeck.audioDisabled = false;
    mocks.practiceDeck.showDirectionChange = false;
    mocks.practiceDeck.audioError = false;
    mocks.practiceDeck.audioLoading = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows sync loading message when userId is missing', () => {
    mocks.userId = null;
    render(<PracticeCard />);

    expect(screen.getByText('Sync loading')).toBeTruthy();
  });

  it('shows grammar card when grammar overlay is visible', () => {
    mocks.grammarVisible = true;
    mocks.grammarData = { id: 1, name: 'Articles' };

    render(<PracticeCard />);

    expect(screen.getByText('GrammarCard:Articles')).toBeTruthy();
  });

  it('shows empty message when current item is missing', () => {
    mocks.practiceDeck.currentItem = null;

    render(<PracticeCard />);

    expect(screen.getByText('Žádné položky k procvičování')).toBeTruthy();
  });

  it('reveals item and plays audio on item click in CZ->EN mode', () => {
    const { container } = render(<PracticeCard />);

    const revealArea = container.querySelector('div[role="button"][tabindex="0"]') as HTMLElement;
    fireEvent.click(revealArea);

    expect(mocks.practiceDeck.playAudio).toHaveBeenCalledTimes(1);
    expect(mocks.practiceDeck.setRevealed).toHaveBeenCalledWith(true);
  });

  it('autoplays audio after delay in EN->CZ mode when allowed', async () => {
    mocks.practiceDeck.isCzToEn = false;
    mocks.practiceDeck.audioDisabled = false;
    mocks.practiceDeck.audioLoading = false;
    mocks.practiceDeck.showDirectionChange = false;

    render(<PracticeCard />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(mocks.practiceDeck.playAudio).toHaveBeenCalledTimes(1);
  });
});
