import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/UI/buttons/CloseButton', () => ({
  default: ({ onClick }: any) => (
    <button data-testid="close-button" onClick={onClick}>
      close
    </button>
  ),
}));

import { CardHeader } from '@/components/UI/CardHeader';

describe('CardHeader', () => {
  it('renders children and forwards the close action', () => {
    const onClose = vi.fn();

    render(
      <CardHeader onClose={onClose} className="gap-4" data-testid="card-header">
        Header title
      </CardHeader>,
    );

    expect(screen.getByText('Header title')).toBeTruthy();
    expect(screen.getByTestId('close-button')).toBeTruthy();
    expect(screen.getByTestId('card-header').className).toContain('gap-4');

    fireEvent.click(screen.getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
