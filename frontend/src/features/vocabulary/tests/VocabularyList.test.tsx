import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/config', () => ({
  default: {
    vocabulary: {
      itemsPerPage: 2,
    },
    buttons: {
      loadingMessageDelay: 0,
    },
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    enterPrompt: 'Search',
    noStartedVocabulary: 'No started vocabulary',
    more: 'and more words',
  },
}));

vi.mock('@/components/UI/buttons/ListButton', () => ({
  ListButton: ({ onClick, children, disabled }: any) => (
    <button data-testid="rect-btn" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/UI/buttons/CloseButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="close-btn" onClick={onClick}>
      close
    </button>
  ),
}));

vi.mock('@/features/vocabulary/DirectionToggle', () => ({
  default: ({ onChange }: any) => (
    <button data-testid="direction-dd" onClick={() => onChange('english')}>
      direction
    </button>
  ),
}));

vi.mock('@/components/UI/DelayedNotification', () => ({
  default: ({ children }: any) => <>{children}</>,
}));

import VocabularyList from '@/features/vocabulary/VocabularyList';

describe('VocabularyList', () => {
  const setSearchTerm = vi.fn();
  const setDisplayField = vi.fn();
  const setVisibleCount = vi.fn();
  const onSelect = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.restoreAllMocks();
  });
  it('loads searchTerm from localStorage on mount', () => {
    localStorage.setItem('vocabulary_search_term', 'persisted');
    render(
      <VocabularyList
        filteredWords={[]}
        visibleCount={1}
        displayField="czech"
        searchTerm=""
        setSearchTerm={setSearchTerm}
        setDisplayField={setDisplayField}
        setVisibleCount={setVisibleCount}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );
    expect(setSearchTerm).toHaveBeenCalledWith('persisted');
  });

  it('saves searchTerm to localStorage on change', () => {
    render(
      <VocabularyList
        filteredWords={[]}
        visibleCount={1}
        displayField="czech"
        searchTerm=""
        setSearchTerm={setSearchTerm}
        setDisplayField={setDisplayField}
        setVisibleCount={setVisibleCount}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'abc' } });
    // The component calls setSearchTerm, but localStorage is updated by useEffect in the next render
    // Simulate the effect by updating props
    render(
      <VocabularyList
        filteredWords={[]}
        visibleCount={1}
        displayField="czech"
        searchTerm="abc"
        setSearchTerm={setSearchTerm}
        setDisplayField={setDisplayField}
        setVisibleCount={setVisibleCount}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );
    expect(localStorage.getItem('vocabulary_search_term')).toBe('abc');
  });

  it('renders words and calls onSelect with visible index', () => {
    render(
      <VocabularyList
        filteredWords={[
          { item_id: 1, czech: 'ahoj', english: 'hello' } as any,
          { item_id: 2, czech: 'auto', english: 'car' } as any,
        ]}
        visibleCount={2}
        displayField="czech"
        searchTerm=""
        setSearchTerm={setSearchTerm}
        setDisplayField={setDisplayField}
        setVisibleCount={setVisibleCount}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getAllByTestId('rect-btn')[0]);
    expect(onSelect).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByTestId('close-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows load more button and increases visible count', () => {
    render(
      <VocabularyList
        filteredWords={[
          { item_id: 1, czech: 'ahoj', english: 'hello' } as any,
          { item_id: 2, czech: 'auto', english: 'car' } as any,
          { item_id: 3, czech: 'dům', english: 'house' } as any,
        ]}
        visibleCount={1}
        displayField="czech"
        searchTerm=""
        setSearchTerm={setSearchTerm}
        setDisplayField={setDisplayField}
        setVisibleCount={setVisibleCount}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText(/and more words/i));
    expect(setVisibleCount).toHaveBeenCalledWith(3);
  });

  it('renders empty state message when no words', () => {
    render(
      <VocabularyList
        filteredWords={[]}
        visibleCount={1}
        displayField="czech"
        searchTerm=""
        setSearchTerm={setSearchTerm}
        setDisplayField={setDisplayField}
        setVisibleCount={setVisibleCount}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId('direction-dd')).toBeTruthy();
    expect(screen.getByText('No started vocabulary')).toBeTruthy();
  });

  it('updates search and display field', () => {
    render(
      <VocabularyList
        filteredWords={[]}
        visibleCount={1}
        displayField="czech"
        searchTerm=""
        setSearchTerm={setSearchTerm}
        setDisplayField={setDisplayField}
        setVisibleCount={setVisibleCount}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'abc' } });
    expect(setSearchTerm).toHaveBeenCalledWith('abc');

    fireEvent.click(screen.getByTestId('direction-dd'));
    expect(setDisplayField).toHaveBeenCalledWith('english');
  });
});
