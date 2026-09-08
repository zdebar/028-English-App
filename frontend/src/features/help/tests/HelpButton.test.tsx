import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  openHelp: vi.fn(),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    tooltipHelp: 'Help tooltip',
  },
}));

vi.mock('@/components/UI/icons/QuestionMarkIcon', () => ({
  default: () => <span data-testid="question-icon">?</span>,
}));

vi.mock('@/features/help/use-help-store', () => ({
  useHelpStore: (selector: (state: { openHelp: typeof mocks.openHelp }) => unknown) =>
    selector({ openHelp: mocks.openHelp }),
}));

import HelpButton from '@/features/help/HelpButton';

describe('HelpButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls openHelp on click', () => {
    render(<HelpButton className="custom-class" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mocks.openHelp).toHaveBeenCalledTimes(1);
  });
});
