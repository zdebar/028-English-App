import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  groups: undefined as unknown[] | undefined,
  getOverview: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (query: () => unknown) => {
    query();
    return mocks.groups;
  },
}));

vi.mock('@/database/models/pronunciation-groups', () => ({
  default: {
    getOverview: (...args: unknown[]) => mocks.getOverview(...args),
  },
}));

vi.mock('@/routing/prefetch-navigation', () => ({
  PrefetchButton: ({ to, children, ...props }: any) => (
    <button {...props} onClick={() => mocks.navigate(to)}>
      {children}
    </button>
  ),
}));

vi.mock('@/routing/route-data', () => ({
  pronunciationGroupsDescriptor: () => ({ key: 'pronunciation-groups', load: vi.fn() }),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    pronunciationGroupsButton: 'Výslovnost – skupiny',
    pronunciationGroupsTooltip: 'Open pronunciation groups',
    noPronunciationGroups: 'No pronunciation groups',
    loadingMessage: 'Loading',
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

import PronunciationGroupsButton from '../PronunciationGroupsButton';

describe('PronunciationGroupsButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.groups = undefined;
  });

  it('is disabled while loading and when no group is available', () => {
    const { rerender } = render(<PronunciationGroupsButton userId="u1" />);
    let button = screen.getByRole('button', { name: 'Výslovnost – skupiny' });

    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('Loading');

    mocks.groups = [];
    rerender(<PronunciationGroupsButton userId="u1" />);
    button = screen.getByRole('button', { name: 'Výslovnost – skupiny' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('No pronunciation groups');
    expect(mocks.getOverview).toHaveBeenCalledWith('u1');
  });

  it('opens the pronunciation groups when data exists', () => {
    mocks.groups = [{}];
    render(<PronunciationGroupsButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Výslovnost – skupiny' });
    expect(button.title).toBe('Open pronunciation groups');
    fireEvent.click(button);

    expect(mocks.navigate).toHaveBeenCalledWith('/pronunciation');
  });
});
