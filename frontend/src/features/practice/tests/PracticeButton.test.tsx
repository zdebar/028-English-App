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

import PracticeButton from '@/features/practice/buttons/PracticeButton';

describe('PracticeButton', () => {
  it('renders icon, label as title, and children inside the button', () => {
    render(
      <PracticeButton
        icon={<span data-testid="icon" />}
        label="Grammar"
        helpSide="left"
        onClick={vi.fn()}
        disabled={false}
      >
        <span data-testid="child" />
      </PracticeButton>,
    );

    expect(screen.getByTestId('icon')).toBeTruthy();
    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.getByTestId('styled-button').getAttribute('title')).toBe('Grammar');
    expect(screen.getByTestId('help-text').textContent).toBe('Grammar');
  });

  it('passes disabled state to StyledButton and clears title when disabled', () => {
    render(
      <PracticeButton
        icon={<span />}
        label="Audio"
        helpSide="right"
        onClick={vi.fn()}
        disabled={true}
      />,
    );

    const button = screen.getByTestId('styled-button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('title')).toBeNull();
  });

  it('positions HelpText on the left when helpSide is left', () => {
    render(
      <PracticeButton
        icon={<span />}
        label="Hint"
        helpSide="left"
        onClick={vi.fn()}
        disabled={false}
      />,
    );

    expect(screen.getByTestId('help-text').dataset['classname']).toContain('left-4');
  });

  it('positions HelpText on the right when helpSide is right', () => {
    render(
      <PracticeButton
        icon={<span />}
        label="Known"
        helpSide="right"
        onClick={vi.fn()}
        disabled={false}
      />,
    );

    expect(screen.getByTestId('help-text').dataset['classname']).toContain('right-4');
  });

  it('calls onClick when button is clicked', () => {
    const handleClick = vi.fn();
    render(
      <PracticeButton
        icon={<span />}
        label="Play"
        helpSide="right"
        onClick={handleClick}
        disabled={false}
      />,
    );

    fireEvent.click(screen.getByTestId('styled-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
