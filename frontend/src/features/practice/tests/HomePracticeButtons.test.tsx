import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    practiceButton: 'Practice',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
    nothingToPractice: 'Nothing to practice',
  },
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/routing/prefetch-navigation', () => ({
  PrefetchButton: ({ to, children, ...props }: any) => (
    <button {...props} onClick={() => mocks.navigate(to)}>
      {children}
    </button>
  ),
}));
vi.mock('@/routing/route-data', () => ({
  practiceDeckDescriptor: () => ({ key: 'practice', load: vi.fn() }),
}));

import PracticeButton from '@/features/practice/PracticeButton';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';

describe('HomePracticeButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePracticeAvailabilityStore.setState({
      readyCount: 0,
      readySchedule: [],
      readyLoading: true,
      readyError: null,
    });
  });

  it('keeps practice optimistically enabled while availability is loading', () => {
    render(<PracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Practice' });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(button.title).toBe('Loading');
  });

  it('disables practice after an empty result is confirmed', () => {
    usePracticeAvailabilityStore.setState({ readyLoading: false });
    render(<PracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Practice' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('Nothing to practice');
  });

  it('shows the ready badge and navigates when practice is available', () => {
    usePracticeAvailabilityStore.setState({ readyCount: 4, readyLoading: false });
    render(<PracticeButton userId="u1" />);

    fireEvent.click(screen.getByRole('button', { name: /Practice/ }));
    expect(screen.getByText('4')).toBeTruthy();
    expect(mocks.navigate).toHaveBeenCalledWith('/practice');
  });

  it.each([1, 39])('shows a ready badge below the cap for count %i', (readyCount) => {
    usePracticeAvailabilityStore.setState({ readyCount, readyLoading: false });
    render(<PracticeButton userId="u1" />);

    expect(screen.getByText(String(readyCount))).toBeTruthy();
  });

  it.each([0, 40])('hides the ready badge for boundary count %i', (readyCount) => {
    usePracticeAvailabilityStore.setState({ readyCount, readyLoading: false });
    render(<PracticeButton userId="u1" />);

    expect(screen.queryByText(String(readyCount))).toBeNull();
  });

  it('disables practice when availability loading fails', () => {
    usePracticeAvailabilityStore.setState({
      readyLoading: false,
      readyError: new Error('failed'),
    });
    render(<PracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Practice' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('Loading error');
  });

  it('retains the Zustand snapshot when the button remounts', () => {
    usePracticeAvailabilityStore.setState({ readyCount: 3, readyLoading: false });
    const { unmount } = render(<PracticeButton userId="u1" />);
    unmount();
    render(<PracticeButton userId="u1" />);

    expect(screen.getByText('3')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Practice/ }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
});
