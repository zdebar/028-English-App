import ButtonRectangular from "@/components/UI/button-rectangular";
import {
  SkipIcon,
  InfoIcon,
  HintIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
} from "@/components/UI/icons";
import { useState, useEffect, useCallback } from "react";
import { useItemArray } from "@/hooks/use-item-array";
import { useUserStore } from "@/hooks/use-user";
import { useAudioManager } from "@/hooks/use-audio-manager";
import Loading from "@/components/UI/loading";
import VolumeSlider from "@/components/UI/volume-slider";
import config from "@/config/config";
import GrammarCard from "@/components/Layout/grammar-card";
import { useAuthStore } from "@/hooks/use-auth-store";

export default function Practice() {
  const [revealed, setRevealed] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [grammarVisible, setGrammarVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuthStore();
  const { userStats } = useUserStore();
  const {
    array,
    index,
    nextIndex,
    currentItem,
    arrayLength,
    direction,
    hasGrammar,
    userProgress,
    setUserProgress,
    patchItems,
    setReload,
  } = useItemArray(userId!);
  const {
    playAudio,
    stopAudio,
    setVolume,
    audioError,
    setAudioError,
    isAudioReady,
  } = useAudioManager(array);

  const isAudioDisabled =
    (direction && !revealed) || !currentItem?.audio || audioError;

  // Update userProgress, if end of array reached, patch items
  const updateItemArray = useCallback(
    async (progressIncrement: number = 0) => {
      setRevealed(false);
      stopAudio();

      const newProgress = array[index]
        ? Math.max(array[index].progress + progressIncrement, 0)
        : 0;

      const updatedProgress = userProgress.concat(newProgress);

      if (arrayLength > 0) {
        if (index + 1 >= arrayLength) {
          await patchItems(updatedProgress);
          setUserProgress([]);
          setReload(true);
          console.log("Patched items and reloading array.");
        } else {
          setUserProgress(updatedProgress);
        }
        nextIndex();
      }
    },
    [
      array,
      index,
      arrayLength,
      userProgress,
      patchItems,
      setReload,
      setUserProgress,
      nextIndex,
      stopAudio,
    ]
  );

  // Auto-play audio on new item if not in reading direction
  useEffect(() => {
    if (!direction && currentItem && currentItem?.audio) {
      setTimeout(() => playAudio(currentItem.audio!), 100);
    }
  }, [currentItem, direction, playAudio]);

  // Reset audio error for new item
  useEffect(() => {
    setAudioError(false);
  }, [setAudioError, currentItem]);

  // Handle audio errors and retries
  useEffect(() => {
    if ((currentItem && !currentItem?.audio) || audioError) {
      setError("bez audia");
    } else {
      setError(null);
    }
  }, [audioError, currentItem, isAudioReady]);

  if (!arrayLength)
    return <Loading text="Nic k procvičování. Zkuste to znovu později." />;

  return grammarVisible ? (
    <GrammarCard
      grammar_id={currentItem?.grammar_id}
      onClose={() => setGrammarVisible(false)}
    />
  ) : (
    <div className="card-height card-width">
      {/* Card content with item details */}
      <div
        className={`border border-dashed relative flex h-full flex-col items-center justify-between p-4 ${
          !isAudioDisabled && "color-audio"
        }`}
        onClick={() => {
          if (!isAudioDisabled) playAudio(currentItem.audio);
        }}
        aria-label="Přehrát audio"
      >
        <div
          id="top-bar"
          className="relative flex w-full items-center justify-between"
        >
          <VolumeSlider setVolume={setVolume} />
          <p className="font-light">{error}</p>
        </div>
        <div id="item">
          <p className="text-center font-bold">
            {direction || revealed ? currentItem?.czech : "\u00A0"}
          </p>
          <p className="text-center">
            {" "}
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

      {/* Practice Controls */}
      <div id="practice-controls" className="flex gap-1">
        <ButtonRectangular
          onClick={() => setGrammarVisible(true)}
          disabled={!hasGrammar || !revealed}
        >
          <InfoIcon />
        </ButtonRectangular>
        <ButtonRectangular
          onClick={() => {
            updateItemArray(config.progress.skipProgress);
          }}
          disabled={!revealed}
        >
          <SkipIcon />
        </ButtonRectangular>
      </div>
      <div className="flex gap-1">
        {!revealed ? (
          <>
            <ButtonRectangular
              onClick={() => setHintIndex((prevIndex) => prevIndex + 1)}
            >
              <HintIcon />
            </ButtonRectangular>
            <ButtonRectangular
              onClick={() => {
                setRevealed(true);
                if (direction && currentItem?.audio)
                  playAudio(currentItem.audio);
                setHintIndex(0);
              }}
            >
              <EyeIcon />
            </ButtonRectangular>
          </>
        ) : (
          <>
            <ButtonRectangular
              onClick={() => updateItemArray(config.progress.minusProgress)}
            >
              <MinusIcon />
            </ButtonRectangular>
            <ButtonRectangular
              onClick={() => updateItemArray(config.progress.plusProgress)}
            >
              <PlusIcon />
            </ButtonRectangular>
          </>
        )}
      </div>
    </div>
  );
}
