import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sanitizeMock = vi.fn();

vi.mock('dompurify', () => ({
  default: {
    sanitize: (...args: unknown[]) => sanitizeMock(...args),
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    noNotesToDisplay: 'No notes',
    restartGrammarTitle: 'Restart grammar',
    restartGrammarDescription: 'Restart grammar description',
  },
}));

vi.mock('@/features/help/HelpButton', () => ({
  default: () => <div data-testid="help" />,
}));

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ buttonTitle, children }: any) => (
    <div>
      <h1>{buttonTitle}</h1>
      <div>{children}</div>
    </div>
  ),
}));

import GrammarDetailCard from '@/features/grammar/GrammarDetailCard';

describe('GrammarDetailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sanitizeMock.mockImplementation((value: string) => value);
  });

  it('renders sanitized grammar note when present', () => {
    sanitizeMock.mockReturnValue('<b>sanitized</b>');

    const { container } = render(
      <GrammarDetailCard
        grammar={{ id: 1, name: 'Articles', note: '<script>x</script>' }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Articles')).toBeTruthy();
    expect(sanitizeMock).toHaveBeenCalledWith('<script>x</script>');
    expect(container.innerHTML).toContain('<b>sanitized</b>');
  });

  it('renders fallback message when note is null', () => {
    render(
      <GrammarDetailCard grammar={{ id: 1, name: 'Articles', note: null }} onClose={vi.fn()} />,
    );

    expect(screen.getByText('No notes')).toBeTruthy();
  });

  it('renders grouped grammar chunks as ordered sections', () => {
    const { container } = render(
      <GrammarDetailCard
        grammar={{
          id: 1,
          name: 'Present simple',
          chunks: [
            { id: 11, name: 'Affirmative', note: '<p>affirmative note</p>' },
            { id: 12, name: 'Negative', note: '<p>negative note</p>' },
          ],
        }}
        onClose={vi.fn()}
      />,
    );

    const headings = container.querySelectorAll('h2');
    expect([...headings].map((heading) => heading.textContent)).toEqual([
      'Affirmative',
      'Negative',
    ]);
    expect(screen.queryByText('No notes')).toBeNull();
  });

  it('hides help by default and renders it when explicitly enabled', () => {
    const { rerender } = render(
      <GrammarDetailCard grammar={{ id: 1, name: 'Articles' }} onClose={vi.fn()} />,
    );

    expect(screen.queryByTestId('help')).toBeNull();

    rerender(
      <GrammarDetailCard
        grammar={{ id: 1, name: 'Articles' }}
        onClose={vi.fn()}
        showHelpButton
      />,
    );

    expect(screen.getByTestId('help')).toBeTruthy();
  });
});
