import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/routing/data-navigation', () => ({
  DataNavigationButton: ({ to, children, ...props }: any) => (
    <button {...props} onClick={() => mocks.navigate(to)}>
      {children}
    </button>
  ),
}));
vi.mock('@/routing/route-data', () => ({
  pronunciationPracticeDescriptor: () => ({ key: 'pronunciation-practice', load: vi.fn() }),
}));
vi.mock('@/locales/cs', () => ({
  TEXTS: {
    pronunciationPracticeButton: 'Pronunciation items',
    pronunciationPracticeTooltip: 'Practice selected words',
    noPronunciationPracticeSelection: 'No selected words',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
  },
}));

import PronunciationPracticeButton from '../PronunciationPracticeButton';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';

describe('PronunciationPracticeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePracticeAvailabilityStore.setState({
      pronunciationCount: 0,
      pronunciationLoading: true,
      pronunciationError: null,
    });
  });

  it('is optimistically enabled until the selection count is available', () => {
    render(<PronunciationPracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Pronunciation items' });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(button.title).toBe('Loading');
  });

  it('is disabled for a confirmed empty selection', () => {
    usePracticeAvailabilityStore.setState({ pronunciationLoading: false });
    render(<PronunciationPracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Pronunciation items' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('No selected words');
  });

  it('opens pronunciation practice when a selection exists', () => {
    usePracticeAvailabilityStore.setState({
      pronunciationCount: 2,
      pronunciationLoading: false,
    });
    render(<PronunciationPracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Pronunciation items' });
    expect(button.title).toBe('Practice selected words');
    fireEvent.click(button);
    expect(mocks.navigate).toHaveBeenCalledWith('/practice/pronunciation');
  });

  it('is disabled when selection availability fails', () => {
    usePracticeAvailabilityStore.setState({
      pronunciationLoading: false,
      pronunciationError: new Error('failed'),
    });
    render(<PronunciationPracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Pronunciation items' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('Loading error');
  });
});
