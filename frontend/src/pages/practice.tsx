import { useState, useEffect, useCallback, useMemo } from "react";
import VolumeSlider from "@/components/UI/volume-slider";
import ButtonRectangular from "@/components/UI/button-rectangular";
import {
  SkipIcon,
  InfoIcon,
  HintIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
} from "@/components/UI/icons";
import config from "@/config/config";
import { usePracticeDeck } from "@/hooks/use-practice-deck";
import { useAudioManager } from "@/hooks/use-audio-manager";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useUserStore } from "@/hooks/use-user";
import GrammarCard from "@/components/Layout/grammar-card";
import Loading from "@/components/UI/loading";

export default function Practice() {
  // State and logic for practice
  const [revealed, setRevealed] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [grammarVisible, setGrammarVisible] = useState(false);

  const { userId } = useAuthStore();
  const { userStats } = useUserStore();
  const { index, array, nextItem, currentItem, direction, grammar_id } =
    usePracticeDeck(userId!);
  const { playAudio, stopAudio, setVolume, audioError, setAudioError } =
    useAudioManager(array);

  // Handle advancing to next item
  const handleNext = useCallback(
    async (progressIncrement: number = 0) => {
      setRevealed(false);
      stopAudio();
      nextItem(progressIncrement);
      setHintIndex(0);
    },
    [nextItem, stopAudio]
  );

  // Play audio for the current item
  const playAudioForItem = useCallback(() => {
    // TODO ISNT THIS OVERKILL
    if (currentItem?.audio) {
      playAudio(currentItem.audio);
    }
  }, [currentItem, playAudio]);

  // Derived state for audio
  const isAudioDisabled = useMemo(
    () => (direction && !revealed) || !currentItem?.audio || audioError,
    [direction, revealed, currentItem, audioError]
  );

  // Auto-play audio on new item if not in reading direction
  useEffect(() => {
    if (!direction && currentItem && currentItem?.audio) {
      setTimeout(() => playAudio(currentItem.audio!), 500);
    }
  }, [currentItem, direction, playAudio]);

  // Handle audio errors and retries
  useEffect(() => {
    if ((currentItem && !currentItem?.audio) || audioError) {
      setAudioError(true);
    } else {
      setAudioError(false);
    }
  }, [audioError, currentItem, setAudioError]);

  if (!array || !currentItem) {
    return <Loading text="Načítání ..." />;
  }

  return grammarVisible ? (
    <GrammarCard
      grammar_id={currentItem?.grammar_id}
      onClose={() => setGrammarVisible(false)}
    />
  ) : (
    <div className="card-height card-width">
      {/* Item Card */}
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
          <p className="font-light">{audioError && "bez audia"}</p>
        </div>
        <div id="item">
          <p className="text-center font-bold">
            {direction || revealed ? currentItem?.czech : "\u00A0"}
          </p>
          <p className="text-center">
            {revealed || direction || audioError
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
      <div id="practice-controls" className="flex flex-col gap-2">
        <div className="flex gap-1">
          <ButtonRectangular
            onClick={() => setGrammarVisible(true)}
            disabled={!!grammar_id || !revealed}
          >
            <InfoIcon />
          </ButtonRectangular>
          <ButtonRectangular
            onClick={() => {
              handleNext(config.progress.skipProgress);
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
                  if (direction) {
                    playAudioForItem();
                  }
                  setHintIndex(() => 0);
                }}
              >
                <EyeIcon />
              </ButtonRectangular>
            </>
          ) : (
            <>
              <ButtonRectangular
                onClick={() => handleNext(config.progress.minusProgress)}
              >
                <MinusIcon />
              </ButtonRectangular>
              <ButtonRectangular
                onClick={() => handleNext(config.progress.plusProgress)}
              >
                <PlusIcon />
              </ButtonRectangular>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
