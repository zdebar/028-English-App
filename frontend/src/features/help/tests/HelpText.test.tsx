import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isHelpOpened: false,
}));

vi.mock('@/features/help/use-help-store', () => ({
  useHelpStore: (selector: (state: { isHelpOpened: boolean }) => unknown) =>
    selector({ isHelpOpened: mocks.isHelpOpened }),
}));

import HelpText from '@/features/help/HelpText';

describe('HelpText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isHelpOpened = false;
  });

  it('renders nothing when help is closed', () => {
    const { container } = render(<HelpText>Hint</HelpText>);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Hint')).toBeNull();
  });

  it('renders content and className when help is open', () => {
    mocks.isHelpOpened = true;

    render(<HelpText className="pos-class">Hint</HelpText>);

    const text = screen.getByText('Hint');
    expect(text).toBeTruthy();
    expect(text.className.includes('pos-class')).toBe(true);
  });
});
