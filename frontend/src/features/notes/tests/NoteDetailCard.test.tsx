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

import NoteDetailCard from '@/features/notes/NoteDetailCard';

describe('NoteDetailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sanitizeMock.mockImplementation((value: string) => value);
  });

  it('renders sanitized note content when present', () => {
    sanitizeMock.mockReturnValue('<b>safe note</b>');

    const { container } = render(
      <NoteDetailCard
        note={{ id: 1, name: 'Usage note', note: '<script>x</script>' }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Usage note')).toBeTruthy();
    expect(sanitizeMock).toHaveBeenCalledWith('<script>x</script>');
    expect(container.innerHTML).toContain('<b>safe note</b>');
  });

  it('renders fallback message when note content is missing', () => {
    render(<NoteDetailCard note={{ id: 1, name: 'Empty note' }} onClose={vi.fn()} />);

    expect(screen.getByText('No notes')).toBeTruthy();
  });
});
