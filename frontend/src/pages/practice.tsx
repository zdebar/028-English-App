import { useState, useEffect, useCallback } from "react";
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
import HelpButton from "@/components/UI/help-button";
import Hint from "@/components/UI/hint";
import { useOverlayStore } from "@/hooks/use-overlay-store";

export default function Practice() {
  // State and logic for practice
  const [revealed, setRevealed] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [grammarVisible, setGrammarVisible] = useState(false);
  const { isOpen } = useOverlayStore();

  const { userId } = useAuthStore();
  const { userStats } = useUserStore();
  const { index, array, nextItem, currentItem, direction, grammar_id } =
    usePracticeDeck(userId!);
  const { playAudio, stopAudio, setVolume, audioError, setAudioError } =
    useAudioManager(array || []);

  const isAudioDisabled =
    (direction && !revealed) || !currentItem?.audio || audioError;

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
    if (currentItem?.audio) {
      playAudio(currentItem.audio);
    }
  }, [currentItem, playAudio]);

  // Auto-play audio on new item if not in reading direction
  useEffect(() => {
    if (!direction && currentItem?.audio) {
      setTimeout(() => playAudio(currentItem.audio!), 500);
    }
  }, [currentItem, direction, playAudio]);

  // Handle audio errors and retries
  useEffect(() => {
    setAudioError((currentItem && !currentItem?.audio) || audioError);
  }, [audioError, currentItem, setAudioError]);

  if (!array || !currentItem) {
    return <Loading text="Načítání ..." />;
  }

  return (
    <div className="relative flex flex-col w-full grow items-center justify-start">
      {grammarVisible ? (
        <GrammarCard
          grammar_id={currentItem?.grammar_id}
          onClose={() => setGrammarVisible(false)}
        />
      ) : (
        <div className="card-height card-width">
          {/* Item Card */}
          <div
            className={`border border-dashed relative flex grow flex-col items-center justify-between p-4 ${
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
              <Hint visibility={isOpen} style={{ top: "30px" }}>
                hlasitost
              </Hint>
              <p className="font-light">{audioError && "bez audia"}</p>
              <Hint visibility={isOpen} style={{ top: "30px", right: "0" }}>
                chybová hlášení
              </Hint>
            </div>

            <div id="item">
              <p className="text-center font-bold">
                {direction || revealed ? currentItem?.czech : "\u00A0"}
              </p>
              <p className="text-center">
                {revealed || (!direction && audioError)
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
              <Hint visibility={isOpen} style={{ bottom: "30px" }}>
                pokrok
              </Hint>
              <p className="font-light">
                {(userStats?.practiceCountToday || 0) + index} /{" "}
                {config.practice.dailyGoal}
              </p>
              <Hint
                visibility={isOpen}
                style={{ bottom: "30px", right: "0" }}
                className="flex flex-col items-end"
              >
                <p>počet procvičení</p>
                <p>/ denní cíl</p>
              </Hint>
            </div>
          </div>

          {/* Practice Controls */}
          <div id="practice-controls" className="flex relative flex-col gap-1">
            <div className="flex gap-1">
              <ButtonRectangular
                onClick={() => setGrammarVisible(true)}
                disabled={!grammar_id || !revealed}
              >
                <InfoIcon />
              </ButtonRectangular>
              <Hint visibility={isOpen} style={{ top: "0px", left: "14px" }}>
                gramatika
              </Hint>
              <ButtonRectangular
                onClick={() => {
                  handleNext(config.progress.skipProgress);
                }}
                disabled={!revealed}
              >
                <SkipIcon />
              </ButtonRectangular>
              <Hint visibility={isOpen} style={{ top: "0px", right: "14px" }}>
                dokončit
              </Hint>
            </div>
            <div className="flex gap-1 relative">
              {!revealed ? (
                <>
                  <ButtonRectangular
                    onClick={() => setHintIndex((prevIndex) => prevIndex + 1)}
                  >
                    <HintIcon />
                  </ButtonRectangular>
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", left: "14px" }}
                  >
                    nápověda
                  </Hint>
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
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", right: "14px" }}
                  >
                    odhalit
                  </Hint>
                </>
              ) : (
                <>
                  <ButtonRectangular
                    onClick={() => handleNext(config.progress.minusProgress)}
                  >
                    <MinusIcon />
                  </ButtonRectangular>
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", left: "14px" }}
                  >
                    neznám
                  </Hint>
                  <ButtonRectangular
                    onClick={() => handleNext(config.progress.plusProgress)}
                  >
                    <PlusIcon />
                  </ButtonRectangular>
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", right: "14px" }}
                  >
                    znám
                  </Hint>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <HelpButton className="self-end" />
    </div>
  );
}
