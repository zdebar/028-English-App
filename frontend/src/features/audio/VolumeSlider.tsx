import { useState, useRef, useEffect } from 'react';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import VolumeIcon from '@/components/UI/icons/VolumeIcon';
import MuteIcon from '@/components/UI/icons/MuteIcon';
import HalfVolumeIcon from '@/components/UI/icons/HalfVolumeIcon';
import { ARIA_TEXTS, TEXTS } from '@/locales/cs';
import { useAudioStore } from './use-audio-store';

type VolumeSliderProps = Readonly<{
  className?: string;
  disabled?: boolean;
}>;

function getVolumeIcon(volume: number) {
  switch (true) {
    case volume === 0:
      return <MuteIcon />;
    case volume <= 0.5:
      return <HalfVolumeIcon />;
    default:
      return <VolumeIcon />;
  }
}

/**
 * A component for controlling volume with a slider.
 *
 * @param setVolume - Function to update the volume.
 * @param className - Optional additional CSS classes.
 * @returns A JSX element for the volume slider.
 */
export default function VolumeSlider({ className = '', disabled = false }: VolumeSliderProps) {
  const volume = useAudioStore((s) => s.volume);
  const setVolume = useAudioStore((s) => s.setVolume);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (sliderRef.current && target instanceof Node && !sliderRef.current.contains(target)) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setShowVolumeSlider(false);
    }
  }, [disabled]);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(event.target.value);
    setVolume(newVolume);
  };

  return (
    <div
      ref={sliderRef}
      className={`secondary-control relative flex items-center justify-start ${className}`}
    >
      <SecondaryControlButton
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          setShowVolumeSlider((prev) => !prev);
        }}
        disabled={disabled}
        title={TEXTS.volume}
        ariaLabel={ARIA_TEXTS.setVolume}
      >
        {getVolumeIcon(volume)}
      </SecondaryControlButton>
      {showVolumeSlider && (
        <div
          className="min-h-button pr-size-button absolute top-1/2 left-full z-40 flex -translate-y-1/2 items-center"
          data-testid="volume-slider-hit-area"
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => {
              event.stopPropagation();
              handleVolumeChange(event);
            }}
            className="cursor-pointer"
            autoFocus
            aria-valuenow={volume}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-label={ARIA_TEXTS.volumePercent(Math.round(volume * 100))}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
