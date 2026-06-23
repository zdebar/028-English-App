import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    audio: 'Audio',
  },
}));

vi.mock('@/components/UI/icons/PlayIcon', () => ({
  default: () => <span data-testid="play-icon" />,
}));

import PlayButton from '@/features/audio/PlayButton';

describe('PlayButton', () => {
  it('renders the shared secondary shell and triggers click handler', () => {
    const onClick = vi.fn();

    render(<PlayButton onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Audio' }) as HTMLButtonElement;
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.className).toContain('secondary-control');
    expect(screen.getByTestId('play-icon')).toBeTruthy();
  });

  it('disables the button when requested', () => {
    render(<PlayButton onClick={vi.fn()} disabled />);

    expect((screen.getByRole('button', { name: 'Audio' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
