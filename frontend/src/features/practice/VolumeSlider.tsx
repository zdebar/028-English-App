import { useState, useRef, useEffect } from 'react';
import VolumeIcon from '@/components/UI/icons/VolumeIcon';
import MuteIcon from '@/components/UI/icons/MuteIcon';

type VolumeSliderProps = {
  setVolume: (volume: number) => void;
  className?: string;
};

/**
 * A component for controlling volume with a slider.
 *
 * @param setVolume - Function to update the volume.
 * @param className - Optional additional CSS classes.
 * @returns A JSX element for the volume slider.
 */
export default function VolumeSlider({ setVolume, className = '' }: VolumeSliderProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setLocalVolume] = useState(0.5);
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
    const newVolume = parseFloat(event.target.value);
    setLocalVolume(newVolume);
    setVolume(newVolume);
  };

  return (
    <div
      ref={sliderRef}
      className={`flex cursor-pointer pt-1 ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        onClick={() => setShowVolumeSlider((prev) => !prev)}
        aria-label="Nastavit hlasitost"
        className="cursor-pointer"
        disabled={false}
      >
        {volume === 0 ? <MuteIcon /> : <VolumeIcon />}
      </button>
      {showVolumeSlider && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="ml-2 w-24 cursor-pointer"
          autoFocus
          aria-valuenow={volume}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-label={`Hlasitost: ${Math.round(volume * 100)}%`}
          disabled={false}
        />
      )}
    </div>
  );
}
