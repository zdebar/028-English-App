import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserItemLocal } from '@/types/user-item.types';

const mocks = vi.hoisted<{ userId: string | null } & Record<string, any>>(() => ({
  userId: 'u1',
  navigate: vi.fn(),
  grammarVisible: false,
  grammarData: null as any,
  noteVisible: false,
  noteData: null as any,
  handleGrammar: vi.fn(),
  closeGrammar: vi.fn(),
  handleNote: vi.fn(),
  closeNote: vi.fn(),
  makePracticeItem: (overrides: Partial<UserItemLocal> = {}): UserItemLocal => ({
    user_id: 'u1',
    item_id: 1,
    czech: 'ahoj',
    english: 'hello',
    pronunciation: 'həˈloʊ',
    audio: 'hello.opus',
    sort_order: 1,
    curriculum_sort_path: [1, 1, 1],
    progress_cz_to_en: 2,
    progress_en_to_cz: 2,
    note_id: null,
    lesson_id: 1,
    updated_at: '2024-01-01T00:00:00.000Z',
    is_vocabulary: 1,
    block_id: 1,
    topic_id: -1,
    grammar_chunk_id: 10,
    started_at: '2024-01-01T00:00:00.000Z',
    deleted_at: '9999-12-31T00:00:00.000Z',
    next_at_cz_to_en: '2024-01-01T00:00:00.000Z',
    next_at_en_to_cz: '2024-01-01T00:00:00.000Z',
    mastered_at_cz_to_en: '9999-12-31T00:00:00.000Z',
    mastered_at_en_to_cz: '9999-12-31T00:00:00.000Z',
    ...overrides,
  }),
  practiceDeck: {
    index: 0,
    currentItem: null as UserItemLocal | null,
    note: null,
    grammar: null,
    progressLabel: '2/20',
    sessionLoading: false,
    finishedReview: false,
    isCzToEn: true,
    revealed: false,
    setRevealed: vi.fn(),
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
      reviewMinimumSize: 20,
      audioDelay: 300,
    },
    buttons: { loadingMessageDelay: 300 },
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
    grammar: 'Grammar',
    tooltipNotes: 'Notes',
    progress: 'Progress',
    reviewProgress: 'Review progress',
    progressToday: 'Today progress',
    blockCompleted: 'Block completed',
    reviewCompleted: 'Review completed',
    today: 'Today',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
    directionCzToEn: 'CZ to EN',
    directionEnToCz: 'EN to CZ',
    directionCzToEnShort: 'cz › en',
    directionEnToCzShort: 'en › cz',
    blockTrainingProgressHelp: 'Round · completed items in this round',
    next: 'Next',
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

vi.mock('@/features/grammar/use-grammar-viewer', () => ({
  useGrammarViewer: () => ({
    isGrammarVisible: mocks.grammarVisible,
    grammarData: mocks.grammarData,
    openGrammar: mocks.handleGrammar,
    closeGrammar: mocks.closeGrammar,
  }),
}));

vi.mock('@/features/grammar/GrammarDetailCard', () => ({
  default: ({ grammar, onClose, showHelpButton }: any) => (
    <div data-testid="grammar-detail" data-help-enabled={String(showHelpButton)}>
      {grammar?.name}
      <button type="button" onClick={onClose}>
        close grammar
      </button>
    </div>
  ),
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
        note: null,
        grammar: null,
        progressLabel: '',
        sessionLoading: false,
        isCzToEn: true,
        revealed: false,
        setRevealed: vi.fn(),
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

vi.mock('@/features/practice/GrammarCard', () => ({
  default: ({ grammar }: any) => <div>GrammarCard:{grammar?.name ?? 'none'}</div>,
}));

vi.mock('@/features/audio/VolumeSlider', () => ({
  default: ({ className, disabled }: { className?: string; disabled?: boolean }) => (
    <div
      data-testid="volume-slider"
      className={className}
      data-disabled={disabled ? 'true' : 'false'}
    />
  ),
}));

vi.mock('@/features/notes/InfoButton', () => ({
  default: ({ className, disabled, onClick, title }: any) => (
    <button
      data-testid="info-button"
      aria-label="note"
      title={title}
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      <span data-testid="info-icon" />
    </button>
  ),
}));

vi.mock('@/features/practice/buttons/HintButton', () => ({
  default: ({ disabled, onClick }: any) => (
    <button data-testid="hint-btn" disabled={disabled} onClick={onClick}>
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
  default: ({ onClick, disabled }: any) => (
    <button data-testid="known-btn" disabled={disabled} onClick={onClick}>
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
    mocks.practiceDeck.index = 0;
    mocks.practiceDeck.trainingBlockId = null;
    mocks.practiceDeck.currentItem = mocks.makePracticeItem({
      item_id: 1,
      czech: 'ahoj',
      english: 'hello',
      pronunciation: 'həˈloʊ',
      audio: 'hello.opus',
      grammar_chunk_id: 10,
      progress: 2,
    });
    mocks.practiceDeck.note = null;
    mocks.practiceDeck.grammar = {
      id: 10,
      name: 'Grammar',
      note: 'Explanation',
      grammar_group_id: 1,
      sort_order: 1,
      deleted_at: null,
      items: [],
    };
    mocks.practiceDeck.progressLabel = '2/20';
    mocks.practiceDeck.sessionLoading = false;
    mocks.practiceDeck.finishedReview = false;
    mocks.practiceDeck.isCzToEn = true;
    mocks.practiceDeck.revealed = false;
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

  it('shows the resolved grammar detail after clicking its control', () => {
    mocks.practiceDeck.revealed = true;
    mocks.practiceDeck.grammar = {
      ...mocks.practiceDeck.grammar,
      id: 1,
      name: 'Articles',
    };

    render(<PracticeCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Grammar' }));

    expect(screen.getByTestId('grammar-detail').textContent).toContain('Articles');
    expect(screen.getByTestId('grammar-detail').dataset.helpEnabled).toBe('false');
  });

  it('does not show the review progress label on the card', () => {
    render(<PracticeCard />);

    expect(screen.queryByText('2/20')).toBeNull();
  });

  it('keeps the current review card while the next item loads', () => {
    mocks.practiceDeck.sessionLoading = true;
    mocks.practiceDeck.loading = true;
    mocks.practiceDeck.revealed = true;

    render(<PracticeCard />);

    expect(screen.getByText('ahoj')).toBeTruthy();
    expect(screen.queryByText('Loading')).toBeNull();

    act(() => vi.advanceTimersByTime(999));
    expect(screen.queryByText('Loading')).toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText('Loading')).toBeTruthy();
    expect((screen.getByTestId('known-btn') as HTMLButtonElement).disabled).toBe(false);
  });

  it('returns home from the empty practice state', () => {
    mocks.practiceDeck.currentItem = null;
    mocks.practiceDeck.loading = false;

    render(<PracticeCard />);

    fireEvent.click(screen.getByRole('button', { name: 'Domů' }));

    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('reveals item and plays audio on item click in CZ->EN mode', () => {
    const { container } = render(<PracticeCard />);

    const revealArea = container.querySelector('button[aria-disabled]') as HTMLElement;
    fireEvent.click(revealArea);

    expect(mocks.practiceDeck.playAudio).toHaveBeenCalledTimes(1);
    expect(mocks.practiceDeck.setRevealed).toHaveBeenCalledWith(true);
  });

  it('maps practice controls to explicit outcomes', () => {
    mocks.practiceDeck.revealed = true;
    render(<PracticeCard />);

    fireEvent.click(screen.getByTestId('repeat-btn'));
    fireEvent.click(screen.getByTestId('known-btn'));
    fireEvent.click(screen.getByTestId('master-btn'));

    expect(mocks.practiceDeck.nextItem).toHaveBeenNthCalledWith(1, 'incorrect');
    expect(mocks.practiceDeck.nextItem).toHaveBeenNthCalledWith(2, 'correct');
    expect(mocks.practiceDeck.nextItem).toHaveBeenNthCalledWith(3, 'skip');
  });

  it('keeps audio controls visible but disabled when audio is not available', () => {
    mocks.practiceDeck.audioDisabled = true;

    const { container } = render(<PracticeCard />);

    const audioButton = container.querySelector(
      '.pos-bottom-left-control button[aria-label="Audio"]',
    ) as HTMLButtonElement;
    const volumeSlider = container.querySelector(
      '.pos-bottom-left-control [data-testid="volume-slider"]',
    ) as HTMLElement;

    expect(audioButton).toBeTruthy();
    expect(audioButton.disabled).toBe(true);
    expect(volumeSlider).toBeTruthy();
    expect(volumeSlider.dataset.disabled).toBe('true');
  });

  it('keeps audio controls disabled before reveal in CZ->EN mode', () => {
    mocks.practiceDeck.isCzToEn = true;
    mocks.practiceDeck.revealed = false;
    mocks.practiceDeck.audioDisabled = false;

    const { container } = render(<PracticeCard />);

    const audioButton = container.querySelector(
      '.pos-bottom-left-control button[aria-label="Audio"]',
    ) as HTMLButtonElement;
    const volumeSlider = container.querySelector(
      '.pos-bottom-left-control [data-testid="volume-slider"]',
    ) as HTMLElement;

    expect(audioButton).toBeTruthy();
    expect(audioButton.disabled).toBe(true);
    expect(volumeSlider.dataset.disabled).toBe('true');
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

  it('opens grammar from the right secondary control group after reveal', () => {
    mocks.practiceDeck.showDirectionChange = false;
    mocks.practiceDeck.grammar = {
      ...mocks.practiceDeck.grammar,
      id: 42,
      name: 'Resolved grammar',
    };
    mocks.practiceDeck.revealed = true;

    const { container } = render(<PracticeCard />);

    const grammarButton = container.querySelector(
      '.pos-bottom-right-control button[aria-label="Grammar"]',
    ) as HTMLButtonElement;

    expect(grammarButton).toBeTruthy();
    fireEvent.click(grammarButton);

    expect(screen.getByTestId('grammar-detail').textContent).toContain('Resolved grammar');
  });

  it('keeps grammar disabled before reveal even when grammar data exists', () => {
    mocks.practiceDeck.grammar = { ...mocks.practiceDeck.grammar, id: 42 };
    mocks.practiceDeck.revealed = false;

    const { container } = render(<PracticeCard />);

    const grammarButton = container.querySelector(
      '.pos-bottom-right-control button[aria-label="Grammar"]',
    ) as HTMLButtonElement;

    expect(grammarButton).toBeTruthy();
    expect(grammarButton.disabled).toBe(true);
    fireEvent.click(grammarButton);
    expect(screen.queryByTestId('grammar-detail')).toBeNull();
    expect(screen.queryByTestId('grammar-btn')).toBeNull();
  });

  it('does not open grammar automatically while direction change is shown', () => {
    mocks.practiceDeck.showDirectionChange = true;
    mocks.practiceDeck.grammar = { ...mocks.practiceDeck.grammar, id: 42 };

    render(<PracticeCard />);

    expect(screen.queryByTestId('grammar-detail')).toBeNull();
  });

  it('keeps note button disabled until item is revealed and note exists', () => {
    mocks.practiceDeck.revealed = false;
    mocks.practiceDeck.note = { id: 88, name: 'Note', note: 'Body' };

    const { container, rerender } = render(<PracticeCard />);
    expect((screen.getByRole('button', { name: 'note' }) as HTMLButtonElement).disabled).toBe(true);

    mocks.practiceDeck.revealed = true;
    rerender(<PracticeCard />);

    expect((screen.getByRole('button', { name: 'note' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect(
      container.querySelector('.pos-bottom-right-control [data-testid="info-button"]'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'note' }).className).not.toContain(
      'note-control-emphasis',
    );
    expect(screen.getByTestId('info-icon')).toBeTruthy();
  });

  it('keeps detail controls disabled when resolved content is empty', () => {
    mocks.practiceDeck.revealed = true;
    mocks.practiceDeck.note = { id: 88, name: 'Empty note', note: '   ' };
    mocks.practiceDeck.grammar = {
      ...mocks.practiceDeck.grammar,
      note: '   ',
      items: [],
    };

    render(<PracticeCard />);

    expect((screen.getByRole('button', { name: 'note' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Grammar' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('opens note overview after clicking note button', () => {
    mocks.practiceDeck.revealed = true;
    mocks.practiceDeck.note = { id: 55, name: 'Resolved note', note: 'Body' };

    render(<PracticeCard />);

    fireEvent.click(screen.getByRole('button', { name: 'note' }));

    expect(screen.getByTestId('overview-title').textContent).toContain('Resolved note');
    expect(screen.getByTestId('overview-body').textContent).toContain('Body');
  });

  it('can disable the complete control for specialized practice sessions', () => {
    render(
      <PracticeSessionCard
        note={null}
        grammar={null}
        progressLabel="Round 1/2"
        isCzToEn
        revealed
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
        isBlockTrainingPractice
        audioError={false}
        playAudio={vi.fn()}
        audioLoading={false}
      />,
    );

    expect((screen.getByTestId('master-btn') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Round 1/2')).not.toBeNull();
  });

  it('keeps the next hint disabled until the skip pointer gesture is released', async () => {
    const plusHint = vi.fn();

    function SkipGestureHarness() {
      const [revealed, setRevealed] = React.useState(true);

      return (
        <PracticeSessionCard
          note={null}
          grammar={null}
          progressLabel="1 / 2"
          isCzToEn
          revealed={revealed}
          czech="ahoj"
          english="hello"
          pronunciation="hello"
          audioDisabled={false}
          showDirectionChange={false}
          handleReveal={vi.fn()}
          plusHint={plusHint}
          nextRepeat={vi.fn()}
          nextKnown={vi.fn()}
          completeCurrent={() => setRevealed(false)}
          audioError={false}
          playAudio={vi.fn()}
          audioLoading={false}
        />
      );
    }

    render(<SkipGestureHarness />);
    fireEvent.click(screen.getByTestId('master-btn'));

    const hintButton = screen.getByTestId('hint-btn') as HTMLButtonElement;
    expect(hintButton.disabled).toBe(true);

    fireEvent.pointerUp(window);
    fireEvent.click(hintButton);
    expect(plusHint).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(hintButton.disabled).toBe(false);

    fireEvent.click(hintButton);
    expect(plusHint).toHaveBeenCalledTimes(1);
  });

  it('can disable the repeat control for specialized practice sessions', () => {
    render(
      <PracticeSessionCard
        note={null}
        grammar={null}
        progressLabel="Round 1/2"
        isCzToEn
        revealed
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

  it('shows the review completion page with an explicit home button', () => {
    mocks.practiceDeck.currentItem = null;
    mocks.practiceDeck.finishedReview = true;

    render(<PracticeCard />);

    fireEvent.click(screen.getByRole('button', { name: 'Domů' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });
});
