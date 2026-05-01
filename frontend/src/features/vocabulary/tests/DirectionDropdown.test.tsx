import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const errorHandlerMock = vi.fn();

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    translationDirection: 'Translation direction',
  },
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => errorHandlerMock(...args),
}));

import DirectionTogggle from '@/features/vocabulary/DirectionToggle';

describe('DirectionDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders options and calls onChange with selected mapped value', () => {
    const onChange = vi.fn();
    render(
      <DirectionTogggle
        value="czech"
        options={[
          { value: 'czech', label: 'Čeština' },
          { value: 'english', label: 'Angličtina' },
        ]}
        onChange={onChange}
      />,
    );

    const toggleButton = screen.getByRole('button', { name: 'Translation direction' });
    fireEvent.click(toggleButton);

    expect(onChange).toHaveBeenCalledWith('english');
    expect(screen.getByLabelText('Translation direction')).toBeTruthy();
  });

  it('logs error when initial value is not in options', async () => {
    render(
      <DirectionTogggle
        value={'unknown'}
        options={[
          { value: 'czech', label: 'Čeština' },
          { value: 'english', label: 'Angličtina' },
        ]}
        onChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(errorHandlerMock).toHaveBeenCalledWith(
        'Value "unknown" is not valid for DirectionToggle.',
        expect.any(Error),
      );
    });
  });

  it('logs error and does not call onChange for invalid selected value', () => {
    const onChange = vi.fn();
    render(<DirectionTogggle value="czech" options={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Translation direction' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(errorHandlerMock).toHaveBeenCalledWith(
      'DirectionToggle expects at least 1 option, received 0.',
      expect.any(Error),
    );
    expect(errorHandlerMock).toHaveBeenCalledWith(
      'Cannot toggle DirectionToggle: options are not valid.',
      expect.any(Error),
    );
  });
});
