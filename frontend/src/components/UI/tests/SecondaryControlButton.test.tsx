import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';

describe('SecondaryControlButton', () => {
  it('forwards interaction props', () => {
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
  });
});
