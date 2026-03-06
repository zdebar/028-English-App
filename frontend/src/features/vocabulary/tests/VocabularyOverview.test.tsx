import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  navigate: vi.fn(),
  resetItemById: vi.fn(),
  setCurrentIndex: vi.fn(),
  reload: vi.fn(),
  state: {
    words: [] as any[],
    currentIndex: null as number | null,
    error: null as string | null,
    loading: false,
  },
}));

vi.mock('@/config/config', () => ({
  default: {
    vocabulary: {
      itemsPerPage: 2,
    },
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

vi.mock('@/hooks/use-array', () => ({
  useArray: () => ({
    data: mocks.state.words,
    currentIndex: mocks.state.currentIndex,
    currentItem:
      mocks.state.currentIndex == null
        ? null
        : (mocks.state.words[mocks.state.currentIndex] ?? null),
    setCurrentIndex: mocks.setCurrentIndex,
    error: mocks.state.error,
    loading: mocks.state.loading,
    reload: mocks.reload,
  }),
}));

vi.mock('@/features/vocabulary/vocabulary.utils', async () => {
  const actual = await vi.importActual<any>('@/features/vocabulary/vocabulary.utils');
  return {
    ...actual,
    filterSortedWords: vi.fn((words: any[]) => words),
  };
});

vi.mock('@/components/UI/DelayedMessage', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    loadingMessage: 'Loading',
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
      <button data-testid="detail-reset" onClick={() => void onReset()}>
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
    mocks.state.words = [];
    mocks.state.currentIndex = null;
    mocks.state.error = null;
    mocks.state.loading = false;
    mocks.reload.mockResolvedValue(undefined);
    mocks.resetItemById.mockResolvedValue(true);
  });

  it('renders loading view when hook is loading', () => {
    mocks.state.loading = true;
    render(<VocabularyOverview />);

    expect(screen.getByText('Loading')).toBeTruthy();
  });

  it('renders list view and wires select/close actions', () => {
    mocks.state.words = [
      { item_id: 1, czech: 'ahoj' },
      { item_id: 2, czech: 'auto' },
    ] as any;

    render(<VocabularyOverview />);
    expect(screen.getByTestId('list-size').textContent).toBe('2');

    fireEvent.click(screen.getByTestId('select-first'));
    expect(mocks.setCurrentIndex).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByTestId('list-close'));
    expect(mocks.navigate).toHaveBeenCalledWith('/profile');
  });

  it('renders detail view and resets selected item', async () => {
    mocks.state.words = [{ item_id: 3, czech: 'dům' }] as any;
    mocks.state.currentIndex = 0;

    render(<VocabularyOverview />);

    expect(screen.getByTestId('detail-word').textContent).toBe('dům');

    fireEvent.click(screen.getByTestId('detail-reset'));
    await waitFor(() => {
      expect(mocks.resetItemById).toHaveBeenCalledWith('u1', 3);
      expect(mocks.reload).toHaveBeenCalledTimes(1);
      expect(mocks.setCurrentIndex).toHaveBeenCalledWith(null);
    });

    fireEvent.click(screen.getByTestId('detail-close'));
    expect(mocks.setCurrentIndex).toHaveBeenCalledWith(null);
  });

  it('closes detail view if selected index is invalid after filtering', () => {
    mocks.state.words = [];
    mocks.state.currentIndex = 0;

    render(<VocabularyOverview />);

    expect(screen.getByTestId('list-size').textContent).toBe('0');
    expect(screen.queryByTestId('detail-word')).toBeNull();
  });
});
