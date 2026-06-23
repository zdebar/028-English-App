import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onClick: vi.fn(),
}));

vi.mock('@/components/UI/icons/InfoIcon', () => ({
  default: () => <span data-testid="info-icon" />,
}));

vi.mock('@/locales/cs', () => ({
  ARIA_TEXTS: {
    note: 'Poznámka',
  },
}));

import InfoButton from '@/features/notes/InfoButton';

describe('InfoButton', () => {
  it('renders shared secondary styling and uses note aria label', () => {
    render(<InfoButton onClick={mocks.onClick} title="Notes" />);

    const button = screen.getByRole('button', { name: 'Poznámka' }) as HTMLButtonElement;
    fireEvent.click(button);

    expect(mocks.onClick).toHaveBeenCalledTimes(1);
    expect(button.getAttribute('title')).toBe('Notes');
    expect(button.className).toContain('secondary-control');
    expect(screen.getByTestId('info-icon')).toBeTruthy();
  });
});
