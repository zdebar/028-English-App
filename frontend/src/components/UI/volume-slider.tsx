import { useState, useRef, useEffect } from "react";
import { VolumeIcon } from "@/components/UI/icons";

/**
 * A component for controlling volume with a slider.
 *
 * @param setVolume - Function to update the volume.
 * @param className - Optional additional CSS classes.
 * @param props - Additional HTML attributes for the container.
 * @returns A JSX element for the volume slider.
 */
export default function VolumeSlider({
  setVolume,
  className = "",
  ...props
}: {
  setVolume: (volume: number) => void;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setLocalVolume] = useState(0.5);
  const sliderRef = useRef<HTMLDivElement>(null);
  const noAudio = false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sliderRef.current &&
        !sliderRef.current.contains(event.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
      className={`flex pt-1  ${className} cursor-pointer`}
      onClick={(event) => event.stopPropagation()}
      {...props}
    >
      <button
        onClick={() => setShowVolumeSlider((prev) => !prev)}
        aria-label="Nastavit hlasitost"
        className="cursor-pointer"
        disabled={noAudio}
      >
        <VolumeIcon />
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
          disabled={noAudio}
        />
      )}
    </div>
  );
}
