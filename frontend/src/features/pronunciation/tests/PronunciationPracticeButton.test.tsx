import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  count: 0 as number | undefined,
  navigate: vi.fn(),
  getCount: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (query: () => unknown) => {
    query();
    return mocks.count;
  },
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getPronunciationPracticeCount: (...args: unknown[]) => mocks.getCount(...args),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/routing/prefetch-navigation', () => ({
  PrefetchButton: ({ to, children, ...props }: any) => (
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
    pronunciationPracticeButton: 'Výslovnost – položky',
    pronunciationPracticeTooltip: 'Practice selected words',
    noPronunciationPracticeSelection: 'No selected words',
    loadingMessage: 'Loading',
  },
}));

import PronunciationPracticeButton from '../PronunciationPracticeButton';

describe('PronunciationPracticeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.count = 0;
  });

  it('is disabled for an empty selection', () => {
    render(<PronunciationPracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Výslovnost – položky' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('No selected words');
    expect(mocks.getCount).toHaveBeenCalledWith('u1');
  });

  it('opens pronunciation practice when selection exists', () => {
    mocks.count = 2;
    render(<PronunciationPracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Výslovnost – položky' });
    expect(button.title).toBe('Practice selected words');
    fireEvent.click(button);

    expect(mocks.navigate).toHaveBeenCalledWith('/practice/pronunciation');
  });

  it('uses a loading tooltip until the selection count is available', () => {
    mocks.count = undefined;

    render(<PronunciationPracticeButton userId="u1" />);

    const button = screen.getByRole('button', { name: 'Výslovnost – položky' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.title).toBe('Loading');
  });
});
