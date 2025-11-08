import { useState, useRef, useEffect } from "react";
import { VolumeIcon } from "@/components/icons";

type VolumeSliderProps = {
  setVolume: (volume: number) => void;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export default function VolumeSlider({
  setVolume,
  className = "",
  ...props
}: VolumeSliderProps) {
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
      className={`flex pt-1 ${className}`}
      onClick={(event) => event.stopPropagation()}
      {...props}
    >
      <button
        onClick={() => setShowVolumeSlider((prev) => !prev)}
        aria-label="Nastavit hlasitost"
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
          className="ml-2 w-24"
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
