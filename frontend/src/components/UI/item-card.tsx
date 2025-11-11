import VolumeSlider from "@/components/UI/volume-slider";
import type { UserItemLocal, UserStatsLocal } from "@/types/local.types";

interface CardComponentProps {
  currentItem: UserItemLocal;
  direction: boolean;
  revealed: boolean;
  hintIndex: number;
  isAudioDisabled: boolean;
  audioError: boolean;
  userStats: UserStatsLocal | null;
  index: number;
  playAudio: (audio: string) => void;
  setVolume: (volume: number) => void;
}

export function ItemCard({
  currentItem,
  direction,
  revealed,
  hintIndex,
  isAudioDisabled,
  audioError,
  userStats,
  index,
  playAudio,
  setVolume,
}: CardComponentProps) {
  return (
    <div
      className={`border border-dashed relative flex h-full flex-col items-center justify-between p-4 ${
        !isAudioDisabled && "color-audio"
      }`}
      onClick={() => {
        if (!isAudioDisabled && currentItem.audio) playAudio(currentItem.audio);
      }}
      aria-label="Přehrát audio"
    >
      <div
        id="top-bar"
        className="relative flex w-full items-center justify-between"
      >
        <VolumeSlider setVolume={setVolume} />
        <p className="font-light">{audioError && "bez audia"}</p>
      </div>
      <div id="item">
        <p className="text-center font-bold">
          {direction || revealed ? currentItem?.czech : "\u00A0"}
        </p>
        <p className="text-center">
          {revealed || (audioError && !direction)
            ? currentItem?.english
            : currentItem?.english
                .slice(0, hintIndex ?? currentItem?.english.length)
                .padEnd(currentItem?.english.length, "\u00A0")}
        </p>
        <p className="text-center">
          {revealed ? currentItem?.pronunciation || "\u00A0" : "\u00A0"}
        </p>
      </div>
      <div
        className="relative flex w-full items-center justify-between"
        id="bottom-bar"
      >
        <p className="font-light">{currentItem?.progress}</p>
        <p className="font-light">
          {(userStats?.practiceCountToday || 0) + index}
        </p>
      </div>
    </div>
  );
}
