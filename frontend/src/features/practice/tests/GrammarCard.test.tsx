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
  },
}));

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ buttonTitle, children }: any) => (
    <div>
      <h1>{buttonTitle}</h1>
      <div>{children}</div>
    </div>
  ),
}));

import GrammarCard from '@/features/practice/GrammarCard';

describe('GrammarCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sanitizeMock.mockImplementation((value: string) => value);
  });

  it('renders sanitized grammar note when present', () => {
    sanitizeMock.mockReturnValue('<b>sanitized</b>');

    const { container } = render(
      <GrammarCard
        grammar={{ id: 1, name: 'Articles', note: '<script>x</script>' }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Articles')).toBeTruthy();
    expect(sanitizeMock).toHaveBeenCalledWith('<script>x</script>');
    expect(container.innerHTML).toContain('<b>sanitized</b>');
  });

  it('renders fallback message when note is missing', () => {
    render(<GrammarCard grammar={{ id: 1, name: 'Articles' }} onClose={vi.fn()} />);

    expect(screen.getByText('No notes')).toBeTruthy();
  });
});
