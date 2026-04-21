import { useState, useRef, useEffect } from 'react';
import VolumeIcon from '@/components/UI/icons/VolumeIcon';
import MuteIcon from '@/components/UI/icons/MuteIcon';
import { ARIA_TEXTS, TEXTS } from '@/locales/cs';

type VolumeSliderProps = Readonly<{
  setVolume: (volume: number) => void;
  className?: string;
}>;

/**
 * A component for controlling volume with a slider.
 *
 * @param setVolume - Function to update the volume.
 * @param className - Optional additional CSS classes.
 * @returns A JSX element for the volume slider.
 */
export default function VolumeSlider({ setVolume, className = '' }: VolumeSliderProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [localVolume, setLocalVolume] = useState(1);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sliderRef.current && !sliderRef.current.contains(event.target as Node)) {
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
    setLocalVolume(newVolume);
    setVolume(newVolume);
  };

  return (
    <div ref={sliderRef} className={`flex h-10 min-w-10 items-center pl-2 ${className}`}>
      <button
        onClick={(event) => {
          event.stopPropagation();
          setShowVolumeSlider((prev) => !prev);
        }}
        aria-label={ARIA_TEXTS.setVolume}
        className="cursor-pointer"
        disabled={false}
        title={TEXTS.volume}
      >
        {localVolume === 0 ? <MuteIcon /> : <VolumeIcon />}
      </button>
      {showVolumeSlider && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={localVolume}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            handleVolumeChange(event);
          }}
          className="ml-2 w-24 cursor-pointer"
          autoFocus
          aria-valuenow={localVolume}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-label={ARIA_TEXTS.volumePercent(Math.round(localVolume * 100))}
          disabled={false}
        />
      )}
    </div>
  );
}
