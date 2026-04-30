import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import StyledButton from '@/components/UI/buttons/StyledButton';

describe('BaseButton', () => {
  it('renders children and uses button type by default', () => {
    render(<StyledButton>Click me</StyledButton>);

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button.getAttribute('type')).toBe('button');
  });

  it('calls onClick and keeps custom classes', () => {
    const onClick = vi.fn();
    render(
      <StyledButton className="h-input" onClick={onClick}>
        Save
      </StyledButton>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.className).toContain('color-button');
    expect(button.className).toContain('h-input');
  });
});
