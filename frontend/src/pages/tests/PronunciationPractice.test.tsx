import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  deck: {} as any,
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string }) => unknown) => selector({ userId: 'u1' }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ showToast: vi.fn() }),
}));

vi.mock('@/features/pronunciation/use-pronunciation-practice-deck', () => ({
  usePronunciationPracticeDeck: () => mocks.deck,
}));

vi.mock('@/features/practice/PracticeSessionCard', () => ({
  default: (props: any) => (
    <div data-testid="session">
      {String(props.isCzToEn)}:{String(props.isPronunciationPractice)}:{String(props.revealed)}:
      {props.progressLabel}:{props.pronunciationItem?.english}
    </div>
  ),
}));

vi.mock('@/features/practice/PracticeEmptyState', () => ({
  default: () => <div>empty</div>,
}));

vi.mock('@/components/UI/DelayedLoadingCircle', () => ({
  default: () => <div>loading</div>,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    loadingError: 'Loading error',
  },
}));

import PronunciationPractice from '@/pages/PronunciationPractice';

describe('PronunciationPractice', () => {
  beforeEach(() => {
    mocks.deck = {
      loading: false,
      error: null,
      currentItem: {
        item_id: 1,
        english: 'man',
        note_id: null,
        grammar_chunk_id: 0,
      },
      progressLabel: '1 / 2',
      czech: 'muž',
      english: 'man',
      pronunciation: 'mæn',
      audioDisabled: false,
      next: vi.fn(),
      audioError: false,
      playAudio: vi.fn(),
      audioLoading: false,
    };
  });

  it('renders the dedicated EN to CZ session mode', () => {
    render(<PronunciationPractice />);

    expect(screen.getByTestId('session').textContent).toContain('false:true:true:1 / 2:man');
  });
});
