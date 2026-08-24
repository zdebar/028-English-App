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
    progress_history: [],
    note_id: null,
    lesson_id: 1,
    updated_at: '2024-01-01T00:00:00.000Z',
    is_vocabulary: 1,
    has_pronunciation_practice: 0,
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
    celebratingStar: false,
    celebrationStarTier: 'bronze',
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
      reviewStarSize: 20,
      starsPerRow: 10,
      starFlashDuration: 300,
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
    reviewStarProgress: 'Progress to next star',
    starEarned: 'Earned',
    currentPracticeStar: 'Current practice star',
    today: 'Today',
    dailyGoal: 'Daily goal',
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
vi.mock('@/features/pronunciation/PronunciationToggleButton', () => ({
  default: ({ showHelpText, onSelectionChange }: any) => (
    <button
      data-testid="pronunciation-toggle"
      data-show-help-text={String(showHelpText)}
      onClick={() => onSelectionChange?.(false)}
    />
  ),
}));
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
  FullStar: ({ className }: { className?: string }) => (
    <span data-testid="earned-star" className={className}>
      star
    </span>
  ),
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
    mocks.practiceDeck.celebratingStar = false;
    mocks.practiceDeck.celebrationStarTier = 'bronze';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows sync loading message when userId is missing', () => {
    mocks.userId = null;
    render(<PracticeCard />);

    expect(screen.getByText('Nic k procvičování.')).toBeTruthy();
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

  it('does not show persistent daily star progress', () => {
    render(<PracticeCard />);

    expect(screen.queryByTestId('practice-stars-row')).toBeNull();
    expect(screen.queryByText('Next star progress')).toBeNull();
  });

  it('shows completed review answers toward the next star at the bottom left', () => {
    const { container } = render(<PracticeCard />);
    const bottomBar = container.querySelector('#bottom-bar') as HTMLElement;

    expect(bottomBar.firstElementChild?.textContent).toBe('2/20');
    expect(screen.getByText('Progress to next star')).toBeTruthy();
    expect(bottomBar.textContent).not.toContain('2 / 9');
  });

  it('waits for the persisted review session before rendering its counter', () => {
    mocks.practiceDeck.sessionLoading = true;
    const { container } = render(<PracticeCard />);

    expect(container.querySelector('#bottom-bar')).toBeNull();
    expect(container.firstChild).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('keeps the one-time earned-star celebration', () => {
    mocks.practiceDeck.celebratingStar = true;
    mocks.practiceDeck.celebrationStarTier = 'silver';

    const { container } = render(<PracticeCard />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByTestId('earned-star').className).toContain('star-fill-silver');
    expect(screen.getByText('Earned')).toBeTruthy();
    const celebration = container.querySelector('.star-celebration') as HTMLElement;
    expect(celebration.className).toContain('-translate-y-2');
    expect(celebration.className).toContain('flex-col');
    expect(celebration.className).toContain('gap-2');
  });

  it('keeps the short direction label in the first top-bar row across card states', () => {
    const { container, rerender } = render(<PracticeCard />);
    const topBar = container.querySelector('#top-bar') as HTMLElement;
    const czToEnLabel = screen.getByText('cz › en');

    expect(topBar.children[0]?.textContent).toBe('cz › en');
    expect(czToEnLabel.className).toContain('text-sm');
    expect(czToEnLabel.className).toContain('font-light');

    mocks.practiceDeck.revealed = true;
    rerender(<PracticeCard />);
    expect(screen.getByText('cz › en')).toBeTruthy();

    mocks.practiceDeck.showDirectionChange = true;
    rerender(<PracticeCard />);
    expect(screen.getByText('cz › en')).toBeTruthy();
    expect(container.querySelector('#practice-main-content')?.textContent).toContain('CZ to EN');

    mocks.practiceDeck.isCzToEn = false;
    mocks.practiceDeck.showDirectionChange = false;
    rerender(<PracticeCard />);
    expect(screen.getByText('en › cz')).toBeTruthy();
  });

  it('shows audio status in the bottom-right area instead of the top bar', () => {
    mocks.practiceDeck.audioError = true;
    const { container } = render(<PracticeCard />);
    const topBar = container.querySelector('#top-bar') as HTMLElement;
    const bottomBar = container.querySelector('#bottom-bar') as HTMLElement;

    expect(topBar.textContent).toBe('cz › en');
    expect(topBar.textContent).not.toContain('No audio');
    expect(bottomBar.lastElementChild?.textContent).toBe('No audio');
  });

  it('keeps vocabulary and direction changes centered while audio status changes', () => {
    const { container, rerender } = render(<PracticeCard />);

    const cardButton = container.querySelector('button[aria-disabled]') as HTMLButtonElement;
    const topBar = container.querySelector('#top-bar') as HTMLElement;
    const mainContent = container.querySelector('#practice-main-content') as HTMLElement;
    const bottomBar = container.querySelector('#bottom-bar') as HTMLElement;

    expect(cardButton.className).toContain('grid-rows-[2rem_minmax(0,1fr)_3.5rem]');
    expect(topBar.className).toContain('h-8');
    expect(mainContent.className).toContain('items-center');
    expect(mainContent.querySelector('#item')).toBeTruthy();
    expect(bottomBar.className).toContain('self-end');

    mocks.practiceDeck.audioLoading = true;
    rerender(<PracticeCard />);

    expect(container.querySelector('#practice-main-content')).toBe(mainContent);

    mocks.practiceDeck.audioLoading = false;
    mocks.practiceDeck.audioError = true;
    rerender(<PracticeCard />);

    expect(container.querySelector('#practice-main-content')).toBe(mainContent);
    expect(screen.getByText('No audio')).toBeTruthy();

    mocks.practiceDeck.audioError = false;
    mocks.practiceDeck.showDirectionChange = true;
    rerender(<PracticeCard />);

    expect(container.querySelector('#practice-main-content')).toBe(mainContent);
    expect(mainContent.querySelector('#item')).toBeNull();
    expect(mainContent.textContent).toContain('CZ to EN');
  });

  it('shows only hint in the primary row before reveal', () => {
    const { container } = render(<PracticeCard />);

    const controls = container.querySelector('#practice-controls');

    expect(controls?.querySelector('[data-testid="hint-btn"]')).toBeTruthy();
    expect(controls?.querySelector('[data-testid="master-btn"]')).toBeNull();
    expect(controls?.querySelector('[data-testid="repeat-btn"]')).toBeNull();
    expect(controls?.querySelector('[data-testid="known-btn"]')).toBeNull();
    expect(controls?.querySelector('[data-testid="grammar-btn"]')).toBeNull();
    expect(controls?.querySelector('[data-testid="info-button"]')).toBeNull();
  });

  it('shows skip, repeat, and know in the primary row after reveal', () => {
    mocks.practiceDeck.revealed = true;

    const { container } = render(<PracticeCard />);

    const controls = container.querySelector('#practice-controls');

    expect(controls?.querySelector('[data-testid="master-btn"]')).toBeTruthy();
    expect(controls?.querySelector('[data-testid="repeat-btn"]')).toBeTruthy();
    expect(controls?.querySelector('[data-testid="known-btn"]')).toBeTruthy();
    expect(controls?.querySelector('[data-testid="hint-btn"]')).toBeNull();
    expect(controls?.querySelector('[aria-label="Grammar"]')).toBeNull();
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

  it('renders audio and pronunciation controls in the left secondary control group', () => {
    mocks.practiceDeck.revealed = true;
    mocks.practiceDeck.audioDisabled = false;

    const { container } = render(<PracticeCard />);

    expect(container.querySelector('#top-bar [data-testid="volume-slider"]')).toBeNull();
    expect(
      container.querySelector('.pos-bottom-left-control [data-testid="volume-slider"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('.pos-bottom-left-control button[aria-label="Audio"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('.pos-bottom-left-control [data-testid="pronunciation-toggle"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('.pos-bottom-right-control [data-testid="pronunciation-toggle"]'),
    ).toBeNull();
    expect(
      container
        .querySelector('.pos-bottom-left-control')
        ?.lastElementChild?.getAttribute('data-testid'),
    ).toBe('pronunciation-toggle');
    expect(screen.getByTestId('pronunciation-toggle').dataset.showHelpText).toBe('true');
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

  it('keeps help in the right secondary control group', () => {
    const { container } = render(<PracticeCard />);

    expect(container.firstElementChild?.className).toContain('bottom-controls-clearance');
    expect(container.firstElementChild?.className).toContain('min-h-0');
    expect(
      container.querySelector('.pos-bottom-right-control [data-testid="help-button"]'),
    ).toBeTruthy();
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
        progressLabel="Round 1/4"
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
        audioError={false}
        playAudio={vi.fn()}
        audioLoading={false}
      />,
    );

    expect((screen.getByTestId('master-btn') as HTMLButtonElement).disabled).toBe(true);
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

  it('shows only Next and keeps audio status at bottom right in pronunciation practice', () => {
    const next = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <PracticeSessionCard
        note={null}
        grammar={null}
        progressLabel="1 / 4"
        isCzToEn={false}
        revealed
        czech="muž"
        english="man"
        pronunciation="mæn"
        audioDisabled={false}
        showDirectionChange={false}
        handleReveal={vi.fn()}
        plusHint={vi.fn()}
        nextRepeat={vi.fn()}
        nextKnown={vi.fn()}
        audioError={false}
        playAudio={vi.fn()}
        audioLoading
        isPronunciationPractice
        nextPronunciation={next}
        onPronunciationSelectionChange={onSelectionChange}
      />,
    );

    expect(screen.getByTitle('Next')).toBeTruthy();
    expect(screen.queryByTestId('master-btn')).toBeNull();
    expect(screen.queryByTestId('repeat-btn')).toBeNull();
    expect(screen.queryByTestId('known-btn')).toBeNull();
    expect(screen.queryByTestId('practice-stars-row')).toBeNull();
    expect(screen.queryByText('en › cz')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const bottomBar = document.querySelector('#bottom-bar') as HTMLElement;
    expect(bottomBar.lastElementChild?.textContent).toBe('Loading audio');
    fireEvent.click(screen.getByTestId('pronunciation-toggle'));
    expect(onSelectionChange).toHaveBeenCalledWith(false);
  });

  it('preserves the language order and prevents translation of learning content', () => {
    const { container } = render(
      <PracticeSessionCard
        note={null}
        grammar={null}
        progressLabel="1 / 1"
        isCzToEn={false}
        revealed
        czech="muž"
        english="man"
        pronunciation="mæn"
        audioDisabled={false}
        showDirectionChange={false}
        handleReveal={vi.fn()}
        plusHint={vi.fn()}
        nextRepeat={vi.fn()}
        nextKnown={vi.fn()}
        audioError={false}
        playAudio={vi.fn()}
        audioLoading={false}
        isPronunciationPractice
      />,
    );

    const languageRows = container.querySelectorAll('#item > p');

    expect([...languageRows].map((row) => row.textContent)).toEqual(['muž', 'man', 'mæn']);
    expect(languageRows[0]?.getAttribute('lang')).toBe('cs');
    expect(languageRows[1]?.getAttribute('lang')).toBe('en');
    expect(languageRows[1]?.getAttribute('translate')).toBe('no');
    expect(languageRows[2]?.getAttribute('translate')).toBe('no');
  });

  it('disables Next when pronunciation practice has no advance handler', () => {
    const { container } = render(
      <PracticeSessionCard
        note={null}
        grammar={null}
        progressLabel="1 / 1"
        isCzToEn={false}
        revealed
        czech="muž"
        english="man"
        pronunciation="mæn"
        audioDisabled={false}
        showDirectionChange={false}
        handleReveal={vi.fn()}
        plusHint={vi.fn()}
        nextRepeat={vi.fn()}
        nextKnown={vi.fn()}
        audioError={false}
        playAudio={vi.fn()}
        audioLoading={false}
        isPronunciationPractice
      />,
    );

    const nextButton = container.querySelector('#practice-controls button');
    expect((nextButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('can disable the repeat control for specialized practice sessions', () => {
    render(
      <PracticeSessionCard
        note={null}
        grammar={null}
        progressLabel="Round 1/4"
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

  it('shows the direction in block training and keeps round progress at the bottom left', () => {
    const { container } = render(
      <PracticeSessionCard
        note={null}
        grammar={null}
        progressLabel="1/2 · 7/8"
        isCzToEn
        revealed={false}
        czech="ahoj"
        english="hello"
        pronunciation="\u00A0"
        audioDisabled={false}
        showDirectionChange={false}
        handleReveal={vi.fn()}
        plusHint={vi.fn()}
        nextRepeat={vi.fn()}
        nextKnown={vi.fn()}
        audioError={false}
        playAudio={vi.fn()}
        audioLoading={false}
        isBlockTrainingPractice
      />,
    );

    expect(container.querySelector('#top-bar')?.textContent).toBe('cz › en');
    expect(screen.getByText('Round · completed items in this round')).toBeTruthy();

    const cardButton = container.querySelector('button[aria-disabled]') as HTMLButtonElement;
    const bottomBar = container.querySelector('#bottom-bar') as HTMLElement;
    expect(cardButton.className).toContain('grid-rows-[2rem_minmax(0,1fr)_3.5rem]');
    expect(bottomBar.firstElementChild?.textContent).toContain('1/2 · 7/8');
  });

  it('shows a block training audio error at the bottom right', () => {
    const { container } = render(
      <PracticeSessionCard
        note={null}
        grammar={null}
        progressLabel="1/2 · 7/8"
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
        audioError
        playAudio={vi.fn()}
        audioLoading={false}
        isBlockTrainingPractice
      />,
    );

    expect(screen.getByText('No audio')).toBeTruthy();

    const bottomBar = container.querySelector('#bottom-bar') as HTMLElement;
    expect(container.querySelector('#top-bar')?.textContent).toBe('cz › en');
    expect(bottomBar.lastElementChild?.textContent).toContain('No audio');
  });
});
