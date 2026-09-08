import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/UI/buttons/StyledButton', () => ({
  default: ({ children, disabled, title, onClick }: any) => (
    <button data-testid="styled-button" disabled={disabled} title={title} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children, className }: any) => (
    <span data-testid="help-text" data-classname={className}>
      {children}
    </span>
  ),
}));

import ControlButton from '@/features/practice/buttons/ControlButton';

describe('PracticeButton', () => {
  it('passes disabled state to StyledButton', () => {
    render(<ControlButton icon={<span />} label="Audio" onClick={vi.fn()} disabled={true} />);

    const button = screen.getByTestId('styled-button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('calls onClick when button is clicked', () => {
    const handleClick = vi.fn();
    render(
      <ControlButton
        icon={<span />}
        label="Play"
        className="pos-help-bottom-right"
        onClick={handleClick}
        disabled={false}
      />,
    );

    fireEvent.click(screen.getByTestId('styled-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
