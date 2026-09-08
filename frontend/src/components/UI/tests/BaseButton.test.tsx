import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import StyledButton from '@/components/UI/buttons/StyledButton';

describe('BaseButton', () => {
  it('calls onClick', () => {
    const onClick = vi.fn();
    render(
      <StyledButton className="h-input" onClick={onClick}>
        Save
      </StyledButton>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when requested', () => {
    render(<StyledButton disabled>Disabled</StyledButton>);

    const button = screen.getByRole('button', { name: 'Disabled' }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });
});
