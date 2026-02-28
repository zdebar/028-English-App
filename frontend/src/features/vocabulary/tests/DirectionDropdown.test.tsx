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

import DirectionDropdown from '@/features/vocabulary/DirectionDropdown';

describe('DirectionDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders options and calls onChange with selected mapped value', () => {
    const onChange = vi.fn();
    render(
      <DirectionDropdown
        value="czech"
        options={[
          { value: 'czech', label: 'Čeština' },
          { value: 'english', label: 'Angličtina' },
        ]}
        onChange={onChange}
      />,
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'english' } });

    expect(onChange).toHaveBeenCalledWith('english');
    expect(screen.getByLabelText('Translation direction')).toBeTruthy();
  });

  it('logs error when initial value is not in options', async () => {
    render(
      <DirectionDropdown
        value={'unknown'}
        options={[{ value: 'czech', label: 'Čeština' }]}
        onChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(errorHandlerMock).toHaveBeenCalledWith(
        'Value "unknown" is not valid for DirectionDropdown.',
        expect.any(Error),
      );
    });
  });

  it('logs error and does not call onChange for invalid selected value', () => {
    const onChange = vi.fn();
    render(
      <DirectionDropdown
        value="czech"
        options={[{ value: 'czech', label: 'Čeština' }]}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'invalid' } });

    expect(onChange).not.toHaveBeenCalled();
    expect(errorHandlerMock).toHaveBeenCalledTimes(1);
    expect(errorHandlerMock.mock.calls[0][0]).toContain(
      'is not available in DirectionDropdown options.',
    );
    expect(errorHandlerMock.mock.calls[0][1]).toBeInstanceOf(Error);
  });
});
