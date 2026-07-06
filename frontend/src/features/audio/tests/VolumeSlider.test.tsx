import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

let currentVolume = 1;
const setVolumeMock = vi.fn((v: number) => {
  currentVolume = v;
});

vi.mock('@/features/audio/use-audio-store', () => ({
  useAudioStore: (
    selector: (state: { volume: number; setVolume: (v: number) => void }) => unknown,
  ) => selector({ volume: currentVolume, setVolume: setVolumeMock }),
}));

beforeEach(() => {
  currentVolume = 1;
  setVolumeMock.mockClear();
});

vi.mock('@/components/UI/icons/VolumeIcon', () => ({
  default: () => <span data-testid="volume-icon" />,
}));

vi.mock('@/components/UI/icons/MuteIcon', () => ({
  default: () => <span data-testid="mute-icon" />,
}));

import VolumeSlider from '@/features/audio/VolumeSlider';

describe('VolumeSlider', () => {
  it('opens slider on button click and updates volume via callback', () => {
    const { rerender } = render(<VolumeSlider />);

    fireEvent.click(screen.getByRole('button', { name: 'Nastavit hlasitost' }));

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.34' } });

    expect(setVolumeMock).toHaveBeenCalledWith(0.34);

    // update mocked store return and rerender so component reads new volume
    rerender(<VolumeSlider />);
    expect(screen.getByLabelText('Hlasitost: 34%')).toBeTruthy();
  });

  it('shows mute icon when volume is set to 0', () => {
    const { rerender } = render(<VolumeSlider />);

    fireEvent.click(screen.getByRole('button', { name: 'Nastavit hlasitost' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0' } });

    // update mocked store return and rerender so component reads new volume
    rerender(<VolumeSlider />);
    expect(screen.getByTestId('mute-icon')).toBeTruthy();
  });

  it('closes slider when clicking outside', () => {
    render(<VolumeSlider />);

    fireEvent.click(screen.getByRole('button', { name: 'Nastavit hlasitost' }));
    expect(screen.getByRole('slider')).toBeTruthy();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('keeps slider open when clicking inside the expanded hit area', () => {
    render(<VolumeSlider />);

    fireEvent.click(screen.getByRole('button', { name: 'Nastavit hlasitost' }));

    const hitArea = screen.getByTestId('volume-slider-hit-area');
    fireEvent.mouseDown(hitArea);
    fireEvent.click(hitArea);

    expect(screen.getByRole('slider')).toBeTruthy();
  });
});
