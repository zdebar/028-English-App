import { useState, useRef, useEffect } from 'react';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import VolumeIcon from '@/components/UI/icons/VolumeIcon';
import MuteIcon from '@/components/UI/icons/MuteIcon';
import HalfVolumeIcon from '@/components/UI/icons/HalfVolumeIcon';
import { ARIA_TEXTS, TEXTS } from '@/locales/cs';
import { useAudioStore } from './use-audio-store';

type VolumeSliderProps = Readonly<{
  className?: string;
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
export default function VolumeSlider({ className = '' }: VolumeSliderProps) {
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
          setShowVolumeSlider((prev) => !prev);
        }}
        title={TEXTS.volume}
        ariaLabel={ARIA_TEXTS.setVolume}
      >
        {getVolumeIcon(volume)}
      </SecondaryControlButton>
      {showVolumeSlider && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            handleVolumeChange(event);
          }}
          className="absolute left-full z-10 cursor-pointer"
          autoFocus
          aria-valuenow={volume}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-label={ARIA_TEXTS.volumePercent(Math.round(volume * 100))}
          disabled={false}
        />
      )}
    </div>
  );
}
