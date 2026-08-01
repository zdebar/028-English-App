import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  count: 0,
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
  TEXTS: { pronunciationPracticeButton: 'Výslovnost' },
}));

import PronunciationPracticeButton from '../PronunciationPracticeButton';

describe('PronunciationPracticeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.count = 0;
  });

  it('is disabled for an empty selection', () => {
    render(<PronunciationPracticeButton userId="u1" />);

    expect((screen.getByRole('button', { name: 'Výslovnost' }) as HTMLButtonElement).disabled)
      .toBe(true);
    expect(mocks.getCount).toHaveBeenCalledWith('u1');
  });

  it('opens pronunciation practice when selection exists', () => {
    mocks.count = 2;
    render(<PronunciationPracticeButton userId="u1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Výslovnost' }));

    expect(mocks.navigate).toHaveBeenCalledWith('/practice/pronunciation');
  });
});
