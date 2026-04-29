import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import BaseButton from '@/components/UI/buttons/BaseButton';

describe('BaseButton', () => {
  it('renders children and uses button type by default', () => {
    render(<BaseButton>Click me</BaseButton>);

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button.getAttribute('type')).toBe('button');
  });

  it('calls onClick and keeps custom classes', () => {
    const onClick = vi.fn();
    render(
      <BaseButton className="h-input" onClick={onClick}>
        Save
      </BaseButton>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.className).toContain('color-button');
    expect(button.className).toContain('h-input');
  });
});
