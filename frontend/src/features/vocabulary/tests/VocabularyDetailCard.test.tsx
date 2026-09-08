import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const formatVocabularyDateTimeMock = vi.fn();
const hasVocabularyDateMock = vi.fn();
const audioMocks = vi.hoisted(() => ({
  playAudio: vi.fn(),
  audioError: false,
  audioLoading: false,
  audioReady: true,
  showToast: vi.fn(),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    notAvailable: 'N/A',
    czech: 'Czech',
    english: 'English',
    pronunciation: 'Pronunciation',
    progress: 'Progress',
    startedAt: 'Started',
    updatedAt: 'Updated',
    completedAt: 'Completed',
    nextAt: 'Next',
    masteredAt: 'Mastered',
    notMastered: 'Not mastered',
    practiceSchedule: 'Practice schedule',
    notScheduled: 'Not scheduled',
    directionCzToEn: 'CZ to EN',
    directionEnToCz: 'EN to CZ',
    restartItemProgress: 'Restart item',
    audio: 'Audio',
    noAudio: 'No audio',
    tooltipNotes: 'Notes',
  },
  ARIA_TEXTS: {
    setVolume: 'Nastavit hlasitost',
    volumePercent: (value: number) => `Hlasitost: ${value}%`,
  },
}));

vi.mock('@/config/config', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/config/config')>();
  return {
    default: {
      ...original.default,
      srs: {
        ...original.default.srs,
        intervals: {
          czToEn: Array.from({ length: 9 }),
          enToCz: Array.from({ length: 8 }),
        },
      },
    },
  };
});

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: () => ({
    playAudio: audioMocks.playAudio,
    audioError: audioMocks.audioError,
    loading: audioMocks.audioLoading,
    isAudioReady: () => audioMocks.audioReady,
  }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof audioMocks.showToast }) => unknown) =>
    selector({ showToast: audioMocks.showToast }),
}));

vi.mock('@/features/vocabulary/vocabulary.utils', () => ({
  formatVocabularyDateTime: (...args: unknown[]) => formatVocabularyDateTimeMock(...args),
  hasVocabularyDate: (...args: unknown[]) => hasVocabularyDateMock(...args),
}));

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ buttonTitle, onClose, handleReset, children }: any) => (
    <div>
      <h1>{buttonTitle}</h1>
      <button data-testid="close" onClick={onClose}>
        close
      </button>
      <button data-testid="reset" onClick={() => handleReset?.()}>
        reset
      </button>
      {children}
    </div>
  ),
}));

vi.mock('@/components/UI/PropertyView', () => ({
  default: ({ label, children }: any) => (
    <div>
      {label}:{String(children)}
    </div>
  ),
}));

vi.mock('@/features/help/HelpButton', () => ({ default: () => <div data-testid="help" /> }));
vi.mock('@/features/notes/InfoButton', () => ({
  default: ({ onClick, title }: any) => (
    <button data-testid="info-button" aria-label="note" title={title} onClick={onClick}>
      info
    </button>
  ),
}));

import VocabularyDetailCard from '@/features/vocabulary/VocabularyDetailCard';

describe('VocabularyDetailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formatVocabularyDateTimeMock.mockImplementation((x: string | null | undefined) =>
      x ? `date:${x}` : '',
    );
    hasVocabularyDateMock.mockImplementation((x: string | null | undefined) => Boolean(x));
    audioMocks.playAudio.mockResolvedValue(true);
    audioMocks.audioError = false;
    audioMocks.audioLoading = false;
    audioMocks.audioReady = true;
  });

  it('calls onClose and onReset handlers', () => {
    const onClose = vi.fn();
    const onReset = vi.fn();
    render(
      <VocabularyDetailCard
        selectedWord={{ item_id: 1, czech: 'ahoj' } as any}
        selectedTitle="ahoj"
        onClose={onClose}
        onReset={onReset}
      />,
    );

    fireEvent.click(screen.getByTestId('close'));
    fireEvent.click(screen.getByTestId('reset'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('disables play and volume buttons when audio is not ready', () => {
    audioMocks.audioReady = false;

    render(
      <VocabularyDetailCard
        selectedWord={{ item_id: 1, czech: 'ahoj', audio: 'a.opus' } as any}
        selectedTitle="ahoj"
        onClose={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const playButton = screen.getByRole('button', { name: 'Audio' }) as HTMLButtonElement;
    const volumeButton = screen.getByRole('button', {
      name: 'Nastavit hlasitost',
    }) as HTMLButtonElement;

    expect(playButton.disabled).toBe(true);
    expect(volumeButton.disabled).toBe(true);
    expect(playButton.className).toContain('disabled:text-disabled-light');
    expect(playButton.className).toContain('dark:disabled:text-disabled-dark');
  });

  it('shows error toast when playback fails', async () => {
    audioMocks.playAudio.mockResolvedValue(false);

    render(
      <VocabularyDetailCard
        selectedWord={{ item_id: 1, czech: 'ahoj', audio: 'a.opus' } as any}
        selectedTitle="ahoj"
        onClose={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Audio' }));

    await waitFor(() => {
      expect(audioMocks.showToast).toHaveBeenCalledWith('No audio', 'error');
    });
  });
});
