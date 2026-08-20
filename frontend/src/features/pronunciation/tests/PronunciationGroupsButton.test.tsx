import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  groups: [] as unknown[],
  loading: true,
  error: null as Error | null,
  navigate: vi.fn(),
}));

vi.mock('../use-pronunciation-groups-store', () => ({
  usePronunciationGroupsStore: (selector: (state: typeof mocks) => unknown) => selector(mocks),
}));

vi.mock('@/routing/data-navigation', () => ({
  DataNavigationButton: ({ to, children, ...props }: any) => (
    <button {...props} onClick={() => mocks.navigate(to)}>
      {children}
    </button>
  ),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    pronunciationGroupsButton: 'Výslovnost – skupiny',
    pronunciationGroupsTooltip: 'Open pronunciation groups',
    noPronunciationGroups: 'No pronunciation groups',
    loadingMessage: 'Loading',
    loadingError: 'Loading error',
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

import PronunciationGroupsButton from '../PronunciationGroupsButton';

describe('PronunciationGroupsButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.groups = [];
    mocks.loading = true;
    mocks.error = null;
  });

  it('is enabled while loading and disabled when no group is confirmed', () => {
    const { rerender } = render(<PronunciationGroupsButton />);
    let button = screen.getByRole('button', { name: 'Výslovnost – skupiny' });

    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(button.title).toBe('Loading');

    mocks.groups = [];
    mocks.loading = false;
    rerender(<PronunciationGroupsButton />);
    button = screen.getByRole('button', { name: 'Výslovnost – skupiny' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('No pronunciation groups');
  });

  it('is disabled when group availability fails', () => {
    mocks.loading = false;
    mocks.error = new Error('failed');
    render(<PronunciationGroupsButton />);

    const button = screen.getByRole('button', { name: /skupiny/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('Loading error');
  });

  it('opens the pronunciation groups when data exists', () => {
    mocks.groups = [{}];
    mocks.loading = false;
    render(<PronunciationGroupsButton />);

    const button = screen.getByRole('button', { name: 'Výslovnost – skupiny' });
    expect(button.title).toBe('Open pronunciation groups');
    fireEvent.click(button);

    expect(mocks.navigate).toHaveBeenCalledWith('/pronunciation');
  });
});
