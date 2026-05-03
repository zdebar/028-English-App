import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  navigate: vi.fn(),
  resetItemById: vi.fn(),
  reload: vi.fn(),
  showToast: vi.fn(),
  vocab: {
    loading: false,
    visibleCount: 2,
    setVisibleCount: vi.fn(),
    searchTerm: '',
    setSearchTerm: vi.fn(),
    displayField: 'english' as 'czech' | 'english',
    setDisplayField: vi.fn(),
    selectedWord: null as any,
    setSelectedWord: vi.fn(),
    filteredWords: [] as any[],
  },
}));

vi.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: mocks.userId }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getStartedVocabulary: vi.fn(),
    resetItemById: (...args: unknown[]) => mocks.resetItemById(...args),
  },
}));

vi.mock('@/features/vocabulary/use-vocabulary', () => ({
  useVocabulary: () => ({
    loading: mocks.vocab.loading,
    reload: mocks.reload,
    visibleCount: mocks.vocab.visibleCount,
    setVisibleCount: mocks.vocab.setVisibleCount,
    searchTerm: mocks.vocab.searchTerm,
    setSearchTerm: mocks.vocab.setSearchTerm,
    displayField: mocks.vocab.displayField,
    setDisplayField: mocks.vocab.setDisplayField,
    selectedWord: mocks.vocab.selectedWord,
    setSelectedWord: mocks.vocab.setSelectedWord,
    filteredWords: mocks.vocab.filteredWords,
  }),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ children }: any) => <div>{children ?? 'Loading'}</div>,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    loadingMessage: 'Loading',
    resetProgressSuccessToast: 'Reset success',
    resetProgressErrorToast: 'Reset error',
  },
}));

vi.mock('@/features/vocabulary/VocabularyList', () => ({
  default: ({ filteredWords, onSelect, onClose }: any) => (
    <div>
      <div data-testid="list-size">{filteredWords.length}</div>
      <button data-testid="select-first" onClick={() => onSelect(0)}>
        select
      </button>
      <button data-testid="list-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

vi.mock('@/features/vocabulary/VocabularyDetailCard', () => ({
  default: ({ selectedWord, onClose, onReset }: any) => (
    <div>
      <div data-testid="detail-word">{selectedWord?.czech ?? 'none'}</div>
      <button data-testid="detail-close" onClick={onClose}>
        close
      </button>
      <button data-testid="detail-reset" onClick={() => onReset()}>
        reset
      </button>
    </div>
  ),
}));

import VocabularyOverview from '@/features/vocabulary/VocabularOverview';

describe('VocabularyOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId = 'u1';
    mocks.vocab.loading = false;
    mocks.vocab.visibleCount = 2;
    mocks.vocab.searchTerm = '';
    mocks.vocab.displayField = 'english';
    mocks.vocab.selectedWord = null;
    mocks.vocab.filteredWords = [];
    mocks.reload.mockResolvedValue(undefined);
    mocks.resetItemById.mockResolvedValue(undefined);
  });

  it('renders loading view when hook is loading', () => {
    mocks.vocab.loading = true;
    render(<VocabularyOverview />);

    expect(screen.getByText('Loading')).toBeTruthy();
  });

  it('renders list view and wires select/close actions', () => {
    mocks.vocab.filteredWords = [
      { item_id: 1, czech: 'ahoj' },
      { item_id: 2, czech: 'auto' },
    ] as any;

    render(<VocabularyOverview />);
    expect(screen.getByTestId('list-size').textContent).toBe('2');

    fireEvent.click(screen.getByTestId('list-close'));
    expect(mocks.navigate).toHaveBeenCalledWith('/profile');

    fireEvent.click(screen.getByTestId('select-first'));
    expect(mocks.vocab.setSelectedWord).toHaveBeenCalledWith(mocks.vocab.filteredWords[0]);
  });

  it('renders detail view and resets selected item', async () => {
    mocks.vocab.selectedWord = { item_id: 3, czech: 'dům', english: 'house' } as any;

    render(<VocabularyOverview />);

    expect(screen.getByTestId('detail-word').textContent).toBe('dům');

    fireEvent.click(screen.getByTestId('detail-reset'));
    await waitFor(() => {
      expect(mocks.resetItemById).toHaveBeenCalledWith('u1', 3);
      expect(mocks.reload).toHaveBeenCalledTimes(1);
      expect(mocks.vocab.setSelectedWord).toHaveBeenCalledWith(null);
      expect(mocks.showToast).toHaveBeenCalledWith('Reset success', 'success');
    });
  });

  it('closes detail view when close button is clicked', () => {
    mocks.vocab.selectedWord = { item_id: 9, czech: 'vlak' } as any;

    render(<VocabularyOverview />);

    fireEvent.click(screen.getByTestId('detail-close'));
    expect(mocks.vocab.setSelectedWord).toHaveBeenCalledWith(null);
  });
});
