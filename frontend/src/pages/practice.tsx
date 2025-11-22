import { useState, useEffect, useCallback } from "react";
import VolumeSlider from "@/components/UI/volume-slider";
import ButtonRectangular from "@/components/UI/button-rectangular";
import {
  SkipIcon,
  HintIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
  BookIcon,
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
import { useTourStore } from "@/hooks/use-tour-store";

export default function Practice() {
  const [revealed, setRevealed] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [showPlayHint, setShowPlayHint] = useState(true);
  const [grammarVisible, setGrammarVisible] = useState(false);
  const { isOpen } = useOverlayStore();
  const { userId } = useAuthStore();
  const { userStats } = useUserStore();
  const { index, array, nextItem, currentItem, direction, grammar_id } =
    usePracticeDeck(userId!);
  const {
    playAudio,
    stopAudio,
    setVolume,
    audioError,
    setAudioError,
    isPlaying,
  } = useAudioManager(array || []);
  const { current, lastTarget } = useTourStore();

  const isAudioDisabled =
    (direction && !revealed) || !currentItem?.audio || audioError;

  useEffect(() => {
    const revealTransitions = [
      [".tour-step-18", ".tour-step-19"],
      [".tour-step-30", ".tour-step-21"],
    ];
    const hideTransitions = [[".tour-step-19", ".tour-step-18"]];

    if (
      revealTransitions.some(
        ([from, to]) => lastTarget === from && current?.target === to
      )
    ) {
      setRevealed(true);
      setShowPlayHint(false);
      if (isPlaying) stopAudio();
    }
    if (
      hideTransitions.some(
        ([from, to]) => lastTarget === from && current?.target === to
      )
    ) {
      setRevealed(false);
      setShowPlayHint(true);
      if (isPlaying) stopAudio();
    }
  }, [current?.target, lastTarget, isPlaying, stopAudio]);

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

  // Auto-play audio on new item if english to czech direction
  useEffect(() => {
    if (!direction && currentItem?.audio && !showPlayHint) {
      setTimeout(() => playAudio(currentItem.audio!), 500);
    }
  }, [currentItem, direction, playAudio, showPlayHint]);

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
        <div className="card-width h-full grow">
          <div className="card-height h-full grow">
            {/* Item Card */}
            <div
              className={`tour-step-11 border border-dashed h-full relative flex grow flex-col items-center justify-between p-4 ${
                !isAudioDisabled && "color-audio"
              }`}
              onClick={() => {
                if (showPlayHint) {
                  setShowPlayHint(false);
                } else if (!isAudioDisabled) {
                  playAudio(currentItem.audio);
                }
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
                {showPlayHint && !direction && (
                  <div className="text-center text-notice">
                    Stisknutím přehrajte audio
                  </div>
                )}
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
                <p className="font-light tour-step-12 px-2">
                  {currentItem?.progress}
                </p>
                <Hint visibility={isOpen} style={{ bottom: "30px" }}>
                  pokrok
                </Hint>
                <p className="font-light  tour-step-13 px-2">
                  {(userStats?.practiceCountToday || 0) + index} /{" "}
                  {config.practice.dailyGoal}
                </p>
                <Hint
                  visibility={isOpen}
                  style={{ bottom: "30px", right: "0" }}
                  className="flex flex-col items-end "
                >
                  <p>počet procvičení</p>
                  <p>/ denní cíl</p>
                </Hint>
              </div>
            </div>

            {/* Practice Controls */}
            <div
              id="practice-controls"
              className=" relative tour-step-14 flex flex-col gap-1"
            >
              <div className="flex  gap-1">
                <ButtonRectangular
                  onClick={() => setGrammarVisible(true)}
                  disabled={!grammar_id || !revealed}
                  className="tour-step-15"
                >
                  <BookIcon />
                </ButtonRectangular>
                <Hint visibility={isOpen} style={{ top: "0px", left: "14px" }}>
                  gramatika
                </Hint>
                <ButtonRectangular
                  onClick={() => {
                    handleNext(config.progress.skipProgress);
                  }}
                  disabled={!revealed || isPlaying}
                  className="tour-step-16"
                >
                  <SkipIcon />
                </ButtonRectangular>
                <Hint visibility={isOpen} style={{ top: "0px", right: "14px" }}>
                  dokončit
                </Hint>
              </div>

              {!revealed ? (
                <div className="flex gap-1 relative tour-step-19">
                  <ButtonRectangular
                    onClick={() => setHintIndex((prevIndex) => prevIndex + 1)}
                    className="tour-step-17"
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
                      if (showPlayHint) {
                        setShowPlayHint(false);
                      }
                      setRevealed(true);
                      if (direction) {
                        playAudioForItem();
                      }
                      setHintIndex(() => 0);
                    }}
                    className="tour-step-18"
                    disabled={isPlaying}
                  >
                    <EyeIcon />
                  </ButtonRectangular>
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", right: "14px" }}
                  >
                    odhalit
                  </Hint>
                </div>
              ) : (
                <div className="flex gap-1 relative  tour-step-19 ">
                  <ButtonRectangular
                    onClick={() => handleNext(config.progress.minusProgress)}
                    className="tour-step-20"
                    disabled={isPlaying}
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
                    className="tour-step-21"
                    disabled={isPlaying}
                  >
                    <PlusIcon />
                  </ButtonRectangular>
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", right: "14px" }}
                  >
                    znám
                  </Hint>
                </div>
              )}
            </div>
          </div>
          <HelpButton
            className="self-end"
            style={{
              bottom: "5px",
              right: "5px",
            }}
          />
        </div>
      )}
    </div>
  );
}
