import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const shortenDateMock = vi.fn();

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    notAvailable: 'N/A',
    czech: 'Czech',
    english: 'English',
    pronunciation: 'Pronunciation',
    progress: 'Progress',
    startedAt: 'Started',
    updatedAt: 'Updated',
    nextAt: 'Next',
    masteredAt: 'Mastered',
    restartItemProgress: 'Restart item',
  },
}));

vi.mock('@/features/vocabulary/vocabulary.utils', () => ({
  shortenDate: (...args: unknown[]) => shortenDateMock(...args),
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

import VocabularyDetailCard from '@/features/vocabulary/VocabularyDetailCard';

describe('VocabularyDetailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shortenDateMock.mockImplementation((x: string) => `short:${x}`);
  });

  it('renders selected word details and formatted dates', () => {
    render(
      <VocabularyDetailCard
        selectedWord={
          {
            item_id: 1,
            czech: 'ahoj',
            english: 'hello',
            pronunciation: 'həˈloʊ',
            progress: 2,
            started_at: '2026-02-28T10:00:00.000Z',
            updated_at: '2026-02-28T11:00:00.000Z',
            next_at: '2026-03-01T00:00:00.000Z',
            mastered_at: '2026-03-02T00:00:00.000Z',
          } as any
        }
        selectedTitle="ahoj"
        onClose={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText('Czech:ahoj')).toBeTruthy();
    expect(screen.getByText('English:hello')).toBeTruthy();
    expect(screen.getByText('Progress:2')).toBeTruthy();
    expect(shortenDateMock).toHaveBeenCalled();
  });

  it('shows N/A fallback for missing base/date fields', () => {
    render(
      <VocabularyDetailCard
        selectedWord={
          {
            item_id: 2,
            czech: 'dům',
            english: 'house',
            pronunciation: '',
            progress: 0,
            started_at: null,
            updated_at: null,
            next_at: null,
            mastered_at: null,
          } as any
        }
        selectedTitle="dům"
        onClose={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText('Pronunciation:')).toBeTruthy();
    expect(screen.getByText('Started:short:null')).toBeTruthy();
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
});
