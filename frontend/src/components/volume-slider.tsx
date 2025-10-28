import { useState } from "react";
import { VolumeIcon } from "./icons";
import GuideHint from "./guide-hint";

type VolumeSliderProps = {
  setVolume: (volume: number) => void;
  helpVisibility?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export default function VolumeSlider({
  setVolume,
  helpVisibility = false,
  className = "",
  ...props
}: VolumeSliderProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setLocalVolume] = useState(0.5);
  const noAudio = false;

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setLocalVolume(newVolume);
    setVolume(newVolume);
  };

  return (
    <div
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
        <GuideHint
          visibility={helpVisibility}
          text="hlasitost"
          style={{ left: "-10px", bottom: "-20px" }}
        />
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
          disabled={noAudio}
        />
      )}
    </div>
  );
}
