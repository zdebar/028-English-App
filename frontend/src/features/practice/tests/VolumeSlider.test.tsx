import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/UI/icons/VolumeIcon', () => ({
  default: () => <span data-testid="volume-icon" />,
}));

vi.mock('@/components/UI/icons/MuteIcon', () => ({
  default: () => <span data-testid="mute-icon" />,
}));

import VolumeSlider from '@/features/practice/VolumeSlider';

describe('VolumeSlider', () => {
  it('opens slider on button click and updates volume via callback', () => {
    const setVolume = vi.fn();
    render(<VolumeSlider setVolume={setVolume} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nastavit hlasitost' }));

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.34' } });

    expect(setVolume).toHaveBeenCalledWith(0.34);
    expect(screen.getByLabelText('Hlasitost: 34%')).toBeTruthy();
  });

  it('shows mute icon when volume is set to 0', () => {
    render(<VolumeSlider setVolume={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nastavit hlasitost' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0' } });

    expect(screen.getByTestId('mute-icon')).toBeTruthy();
  });

  it('closes slider when clicking outside', () => {
    render(<VolumeSlider setVolume={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nastavit hlasitost' }));
    expect(screen.getByRole('slider')).toBeTruthy();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('slider')).toBeNull();
  });
});
