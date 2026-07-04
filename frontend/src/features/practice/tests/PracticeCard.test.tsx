import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserItemPractice } from '@/types/user-item.types';

const mocks = vi.hoisted<{ userId: string | null } & Record<string, any>>(() => ({
  userId: 'u1',
  navigate: vi.fn(),
  dailyCount: 5,
  grammarVisible: false,
  grammarData: null as any,
  noteVisible: false,
  noteData: null as any,
  handleGrammar: vi.fn(),
  closeGrammar: vi.fn(),
  handleNote: vi.fn(),
  closeNote: vi.fn(),
  makePracticeItem: (overrides: Partial<UserItemPractice> = {}): UserItemPractice => ({
    user_id: 'u1',
    item_id: 1,
    czech: 'ahoj',
    english: 'hello',
    pronunciation: 'həˈloʊ',
    audio: 'hello.opus',
    sort_order: 1,
    progress: 2,
    progress_history: [],
    note_id: null,
    lesson_id: 1,
    updated_at: '2024-01-01T00:00:00.000Z',
    is_vocabulary: 1,
    is_practice_item: 1,
    block_id: 1,
    grammar_id: 10,
    started_at: '2024-01-01T00:00:00.000Z',
    deleted_at: '9999-12-31T00:00:00.000Z',
    next_at: '2024-01-01T00:00:00.000Z',
    mastered_at: '9999-12-31T00:00:00.000Z',
    show_new_grammar_indicator: false,
    ...overrides,
  }),
  practiceDeck: {
    index: 0,
    currentItem: null as UserItemPractice | null,
    noteId: null,
    grammarId: 10,
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
    loading: false,
    error: null,
    audioError: false,
    setVolume: vi.fn(),
    playAudio: vi.fn(),
    audioLoading: false,
    isPlaying: false,
    handleReveal: vi.fn(() => {
      if (
        mocks.practiceDeck.isCzToEn &&
        !mocks.practiceDeck.audioError &&
        !mocks.practiceDeck.revealed
      ) {
        mocks.practiceDeck.playAudio();
      }
      mocks.practiceDeck.setRevealed(true);
    }),
  } as any,
}));

mocks.practiceDeck.currentItem = mocks.makePracticeItem();

vi.mock('@/config/config', () => ({
  default: {
    practice: {
      dailyGoal: 20,
      starChunk: 50,
      starsPerRow: 10,
      starFlashDuration: 300,
      audioDelay: 300,
    },
    progress: { skipProgress: 10, minusProgress: -1, plusProgress: 1 },
    loading: { dataStateDelayMs: 1000 },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    syncLoadingText: 'Sync loading',
    notAvailable: 'Není k dispozici',
    nothingToPractice: 'Nic k procvičování.',
    tryAgainLater: 'Zkuste to znovu později.',
    tooltipHome: 'Domů',
    reveal: 'Reveal',
    noAudio: 'No audio',
    loadingAudio: 'Loading audio',
    audio: 'Audio',
    tooltipNotes: 'Notes',
    progress: 'Progress',
    nextStarProgress: 'Next star progress',
    currentPracticeStar: 'Current practice star',
    today: 'Today',
    dailyGoal: 'Daily goal',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
    directionCzToEn: 'CZ to EN',
    directionEnToCz: 'EN to CZ',
  },
  ARIA_TEXTS: {
    setVolume: 'Nastavit hlasitost',
    volumePercent: (value: number) => `Hlasitost: ${value}%`,
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/features/user-stats/use-user-store', () => ({
  useUserStore: (selector: (state: { dailyCount: number }) => unknown) =>
    selector({ dailyCount: mocks.dailyCount }),
}));

vi.mock('@/features/grammar/use-grammar-viewer', () => ({
  useGrammarViewer: () => ({
    isGrammarVisible: mocks.grammarVisible,
    grammarData: mocks.grammarData,
    openGrammar: mocks.handleGrammar,
    closeGrammar: mocks.closeGrammar,
  }),
}));

vi.mock('@/features/notes/use-note-viewer', () => ({
  useNoteViewer: () => ({
    isNoteVisible: mocks.noteVisible,
    noteData: mocks.noteData,
    openNote: mocks.handleNote,
    closeNote: mocks.closeNote,
  }),
}));

vi.mock('@/features/practice/hooks/use-practice-deck', () => ({
  usePracticeDeck: (userId: string | null) => {
    React.useEffect(() => {
      if (
        !userId ||
        !mocks.practiceDeck.currentItem ||
        mocks.practiceDeck.isCzToEn ||
        mocks.practiceDeck.audioDisabled ||
        mocks.practiceDeck.audioLoading ||
        mocks.practiceDeck.showDirectionChange
      ) {
        return;
      }

      const timer = globalThis.setTimeout(() => {
        mocks.practiceDeck.playAudio();
      }, 300);

      return () => globalThis.clearTimeout(timer);
    }, [
      userId,
      mocks.practiceDeck.audioDisabled,
      mocks.practiceDeck.audioLoading,
      mocks.practiceDeck.currentItem,
      mocks.practiceDeck.isCzToEn,
      mocks.practiceDeck.showDirectionChange,
    ]);

    if (!userId) {
      return {
        currentItem: null,
        grammarId: null,
        progress: 0,
        isCzToEn: true,
        revealed: false,
        setRevealed: vi.fn(),
        showNewGrammarIndicator: false,
        czech: '',
        english: '',
        pronunciation: '\u00A0',
        audioDisabled: true,
        showDirectionChange: false,
        hideDirectionChange: vi.fn(),
        handleReveal: vi.fn(),
        plusHint: vi.fn(),
        nextItem: vi.fn(),
        loading: false,
        error: null,
        audioError: false,
        setVolume: vi.fn(),
        playAudio: vi.fn(),
        audioLoading: false,
        isPlaying: false,
      };
    }

    return mocks.practiceDeck;
  },
}));

vi.mock('@/features/help/HelpButton', () => ({ default: () => <div data-testid="help-button" /> }));
vi.mock('@/features/help/HelpText', () => ({
  default: ({ children }: any) => <span>{children}</span>,
}));
vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ children, buttonTitle }: any) => (
    <div>
      <div data-testid="overview-title">{buttonTitle}</div>
      <div data-testid="overview-body">{children}</div>
    </div>
  ),
}));
vi.mock('@/components/UI/icons/InfoIcon', () => ({
  default: () => <span data-testid="info-icon">i</span>,
}));
vi.mock('@/components/UI/Indicator', () => ({ default: () => <span data-testid="indicator" /> }));
vi.mock('@/components/UI/icons/NotRevealedIcon', () => ({
  default: () => <span data-testid="not-revealed" />,
}));

vi.mock('@/components/UI/StarProgress', () => ({
  STAR_SIZE: 22,
}));

vi.mock('@/features/practice/components/PracticeStarsRow', () => ({
  default: ({ starCount, displayedChunkCount, starChunk }: any) => (
    <span data-testid="practice-stars-row">
      {starCount}:{displayedChunkCount}:{starChunk}
    </span>
  ),
}));

vi.mock('@/features/practice/GrammarCard', () => ({
  default: ({ grammar }: any) => <div>GrammarCard:{grammar?.name ?? 'none'}</div>,
}));

vi.mock('@/features/audio/VolumeSlider', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="volume-slider" className={className} />
  ),
}));

vi.mock('@/features/notes/InfoButton', () => ({
  default: ({ onClick, title }: any) => (
    <button data-testid="info-button" aria-label="note" title={title} onClick={onClick}>
      <span data-testid="info-icon" />
    </button>
  ),
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

vi.mock('@/features/practice/buttons/RepeatButton', () => ({
  default: ({ onClick, disabled }: any) => (
    <button data-testid="repeat-btn" disabled={disabled} onClick={onClick}>
      repeat
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
  default: ({ onConfirm, disabled }: any) => (
    <button data-testid="master-btn" disabled={disabled} onClick={() => onConfirm()}>
      master
    </button>
  ),
}));

import PracticeCard from '@/features/practice/PracticeCard';
import PracticeSessionCard from '@/features/practice/PracticeSessionCard';

describe('PracticeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mocks.userId = 'u1';
    mocks.grammarVisible = false;
    mocks.grammarData = null;
    mocks.noteVisible = false;
    mocks.noteData = null;
    mocks.dailyCount = 5;
    mocks.practiceDeck.index = 0;
    mocks.practiceDeck.currentItem = mocks.makePracticeItem({
      item_id: 1,
      czech: 'ahoj',
      english: 'hello',
      pronunciation: 'həˈloʊ',
      audio: 'hello.opus',
      grammar_id: 10,
      progress: 2,
      show_new_grammar_indicator: false,
    });
    mocks.practiceDeck.noteId = null;
    mocks.practiceDeck.grammarId = 10;
    mocks.practiceDeck.progress = 2;
    mocks.practiceDeck.isCzToEn = true;
    mocks.practiceDeck.revealed = false;
    mocks.practiceDeck.showNewGrammarIndicator = false;
    mocks.practiceDeck.czech = 'ahoj';
    mocks.practiceDeck.english = 'hello-hint';
    mocks.practiceDeck.pronunciation = '\u00A0';
    mocks.practiceDeck.audioDisabled = false;
    mocks.practiceDeck.showDirectionChange = false;
    mocks.practiceDeck.loading = false;
    mocks.practiceDeck.error = null;
    mocks.practiceDeck.audioError = false;
    mocks.practiceDeck.audioLoading = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows sync loading message when userId is missing', () => {
    mocks.userId = null;
    render(<PracticeCard />);

    expect(screen.getByText('Nic k procvičování.')).toBeTruthy();
  });

  it('shows grammar card when grammar overlay is visible', () => {
    mocks.grammarVisible = true;
    mocks.grammarData = { id: 1, name: 'Articles' };

    render(<PracticeCard />);

    expect(screen.getByTestId('overview-title').textContent).toContain('Articles');
  });

  it('shows empty message when current item is missing', () => {
    mocks.practiceDeck.currentItem = null;
    mocks.practiceDeck.loading = false;

    render(<PracticeCard />);

    expect(screen.getByText('Nic k procvičování.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Domů' })).toBeTruthy();
    expect(screen.getByText('Zkuste to znovu později.')).toBeTruthy();
  });

  it('returns home from the empty practice state', () => {
    mocks.practiceDeck.currentItem = null;
    mocks.practiceDeck.loading = false;

    render(<PracticeCard />);

    fireEvent.click(screen.getByRole('button', { name: 'Domů' }));

    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('shows loading circle after configured delay instead of empty state while deck is loading', () => {
    mocks.practiceDeck.currentItem = null;
    mocks.practiceDeck.loading = true;

    const { container } = render(<PracticeCard />);

    expect(screen.queryByText('Nic k procviÄovÃ¡nÃ­.')).toBeNull();
    expect(screen.queryByText('Zkuste to znovu pozdÄ›ji.')).toBeNull();
    expect(container.firstChild).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('reveals item and plays audio on item click in CZ->EN mode', () => {
    const { container } = render(<PracticeCard />);

    const revealArea = container.querySelector('button[aria-disabled]') as HTMLElement;
    fireEvent.click(revealArea);

    expect(mocks.practiceDeck.playAudio).toHaveBeenCalledTimes(1);
    expect(mocks.practiceDeck.setRevealed).toHaveBeenCalledWith(true);
  });

  it('shows current star chunk progress instead of daily goal progress', () => {
    render(<PracticeCard />);

    expect(screen.getByTestId('practice-stars-row').textContent).toBe('0:5:50');
  });

  it('renders audio controls in the left secondary control group', () => {
    const { container } = render(<PracticeCard />);

    expect(container.querySelector('#top-bar [data-testid="volume-slider"]')).toBeNull();
    expect(
      container.querySelector('.pos-bottom-left-control [data-testid="volume-slider"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('.pos-bottom-left-control button[aria-label="Audio"]'),
    ).toBeTruthy();
  });

  it('uses disabled header text colors for disabled secondary audio button', () => {
    mocks.practiceDeck.audioDisabled = true;
    const { container } = render(<PracticeCard />);

    const audioButton = container.querySelector(
      '.pos-bottom-left-control button[aria-label="Audio"]',
    ) as HTMLButtonElement;

    expect(audioButton.disabled).toBe(true);
    expect(audioButton.className).toContain('disabled:text-disabled-light');
    expect(audioButton.className).toContain('dark:disabled:text-disabled-dark');
  });

  it('shows the next empty bronze star when mounted exactly on a completed chunk', () => {
    mocks.dailyCount = 50;

    render(<PracticeCard />);

    expect(screen.getByTestId('practice-stars-row').textContent).toBe('1:0:50');
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

  it('opens grammar when grammar button is clicked', () => {
    mocks.practiceDeck.showNewGrammarIndicator = true;
    mocks.practiceDeck.showDirectionChange = false;
    mocks.practiceDeck.grammarId = 42;

    render(<PracticeCard />);

    fireEvent.click(screen.getByTestId('grammar-btn'));

    expect(mocks.handleGrammar).toHaveBeenCalledTimes(1);
    expect(mocks.handleGrammar).toHaveBeenCalledWith(42);
  });

  it('does not open grammar automatically while direction change is shown', () => {
    mocks.practiceDeck.showNewGrammarIndicator = true;
    mocks.practiceDeck.showDirectionChange = true;
    mocks.practiceDeck.grammarId = 42;

    render(<PracticeCard />);

    expect(mocks.handleGrammar).not.toHaveBeenCalled();
  });

  it('shows note button only when item is revealed and note exists', () => {
    mocks.practiceDeck.revealed = false;
    mocks.practiceDeck.noteId = 88;

    const { rerender } = render(<PracticeCard />);
    expect(screen.queryByRole('button', { name: 'note' })).toBeNull();

    mocks.practiceDeck.revealed = true;
    rerender(<PracticeCard />);

    expect(screen.getByRole('button', { name: 'note' })).toBeTruthy();
    expect(screen.getByTestId('info-icon')).toBeTruthy();
  });

  it('opens note overview after clicking note button', () => {
    mocks.practiceDeck.revealed = true;
    mocks.practiceDeck.noteId = 55;

    render(<PracticeCard />);

    fireEvent.click(screen.getByRole('button', { name: 'note' }));

    expect(mocks.handleNote).toHaveBeenCalledWith(55);
  });

  it('shows note overview when note overlay is visible', () => {
    mocks.noteVisible = true;
    mocks.noteData = { id: 2, name: 'My note', note: 'Body' };

    render(<PracticeCard />);

    expect(screen.getByTestId('overview-title').textContent).toContain('My note');
    expect(screen.getByTestId('overview-body').textContent).toContain('Body');
  });

  it('can disable the complete control for specialized practice sessions', () => {
    render(
      <PracticeSessionCard
        noteId={null}
        grammarId={10}
        progressLabel="Round 1/4"
        isCzToEn
        revealed
        showNewGrammarIndicator={false}
        czech="ahoj"
        english="hello"
        pronunciation="hello"
        audioDisabled={false}
        showDirectionChange={false}
        handleReveal={vi.fn()}
        plusHint={vi.fn()}
        nextRepeat={vi.fn()}
        nextKnown={vi.fn()}
        completeDisabled
        audioError={false}
        playAudio={vi.fn()}
        audioLoading={false}
      />,
    );

    expect((screen.getByTestId('master-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  it('can disable the repeat control for specialized practice sessions', () => {
    render(
      <PracticeSessionCard
        noteId={null}
        grammarId={10}
        progressLabel="Round 1/4"
        isCzToEn
        revealed
        showNewGrammarIndicator={false}
        czech="ahoj"
        english="hello"
        pronunciation="hello"
        audioDisabled={false}
        showDirectionChange={false}
        handleReveal={vi.fn()}
        plusHint={vi.fn()}
        nextRepeat={vi.fn()}
        repeatDisabled
        nextKnown={vi.fn()}
        audioError={false}
        playAudio={vi.fn()}
        audioLoading={false}
      />,
    );

    expect((screen.getByTestId('repeat-btn') as HTMLButtonElement).disabled).toBe(true);
  });
});
