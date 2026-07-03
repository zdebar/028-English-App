import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';

describe('SecondaryControlButton', () => {
  it('renders shared secondary styling and forwards interaction props', () => {
    const onClick = vi.fn();

    render(
      <SecondaryControlButton
        ariaLabel="Secondary"
        title="Secondary"
        className="custom-class"
        onClick={onClick}
      >
        <span>icon</span>
      </SecondaryControlButton>,
    );

    const button = screen.getByRole('button', { name: 'Secondary' }) as HTMLButtonElement;
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.className).toContain('secondary-control');
    expect(button.className).toContain('secondary-control-button');
    expect(button.className).toContain('custom-class');
    expect(button.className).toContain('disabled:text-disabled-light');
  });
});
