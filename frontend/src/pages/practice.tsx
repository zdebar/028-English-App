import { useState, useEffect, useCallback } from "react";
import VolumeSlider from "@/components/UI/VolumeSlider";
import Button from "@/components/UI/buttons/Button";
import ForwardIcon from "@/components/UI/icons/ForwardIcon";
import BulbIcon from "@/components/UI/icons/BulbIcon";
import EyeIcon from "@/components/UI/icons/EyeIcon";
import MinusIcon from "@/components/UI/icons/MinusIcon";
import PlusIcon from "@/components/UI/icons/PlusIcon";
import BookIcon from "@/components/UI/icons/BookIcon";
import config from "@/config/config";
import { usePracticeDeck } from "@/features/practice/use-practice-deck";
import { useAudioManager } from "@/features/practice/use-audio-manager";
import { useAuthStore } from "@/features/auth/use-auth-store";
import { useUserStore } from "@/hooks/use-user-store";
import GrammarCard from "@/components/Layout/GrammarCard";
import Loading from "@/components/UI/Loading";
import HelpButton from "@/components/UI/buttons/HelpButton";
import Hint from "@/components/UI/Hint";
import { useOverlayStore } from "@/hooks/use-overlay-store";
import { useTourStore } from "@/features/tour/use-tour-store";

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
  const { currentId, lastId } = useTourStore();

  const isAudioDisabled =
    (direction && !revealed) || !currentItem?.audio || audioError;

  // Tour step transitions
  useEffect(() => {
    const revealTransitions = [
      [34, 33],
      [30, 31],
    ];
    const hideTransitions = [[31, 30]];

    if (
      revealTransitions.some(
        ([from, to]) => lastId === from && currentId === to
      )
    ) {
      setRevealed(true);
      setShowPlayHint(false);
      if (isPlaying) stopAudio();
    }
    if (
      hideTransitions.some(([from, to]) => lastId === from && currentId === to)
    ) {
      setRevealed(false);
      setShowPlayHint(true);
      if (isPlaying) stopAudio();
    }
  }, [currentId, lastId, isPlaying, stopAudio]);

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
    <div className="grow relative flex flex-col items-center w-full">
      {grammarVisible ? (
        <GrammarCard
          grammar_id={currentItem?.grammar_id}
          onClose={() => setGrammarVisible(false)}
        />
      ) : (
        <>
          <div className="card-width card-height relative">
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
                className="relative flex items-center justify-between w-full"
              >
                <VolumeSlider setVolume={setVolume} />
                <p className="font-light">{audioError && "bez audia"}</p>
              </div>
              <div
                id="item"
                className="flex flex-col justify-center h-full gap-1"
              >
                {showPlayHint && !direction ? (
                  <div className="text-notice text-center">
                    Stisknutím přehrajte audio
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-center">
                      {direction || revealed
                        ? currentItem?.czech
                        : audioError
                        ? currentItem?.czech
                            ?.slice(0, hintIndex)
                            .padEnd(currentItem?.czech?.length ?? 0, "\u00A0")
                        : hintIndex >= (currentItem?.english?.length ?? 0)
                        ? currentItem?.czech
                            ?.slice(
                              0,
                              hintIndex - (currentItem?.english?.length ?? 0)
                            )
                            .padEnd(currentItem?.czech?.length ?? 0, "\u00A0")
                        : "\u00A0"}
                    </p>
                    <p className="text-center">
                      {revealed || (!direction && audioError)
                        ? currentItem?.english
                        : currentItem?.english
                            .slice(0, hintIndex ?? currentItem?.english.length)
                            .padEnd(currentItem?.english.length, "\u00A0")}
                    </p>
                    <p className="text-center">
                      {revealed
                        ? currentItem?.pronunciation || "\u00A0"
                        : "\u00A0"}
                    </p>
                  </>
                )}
              </div>
              <div
                className="relative flex items-center justify-between w-full"
                id="bottom-bar"
              >
                <p className="tour-step-12 px-2 font-light">
                  {currentItem?.progress}
                </p>
                <Hint visibility={isOpen} style={{ bottom: "30px" }}>
                  pokrok
                </Hint>
                <p className="tour-step-13 px-2 font-light">
                  {(userStats?.practiceCountToday || 0) + index} /{" "}
                  {config.practice.dailyGoal}
                </p>
                <Hint
                  visibility={isOpen}
                  style={{ bottom: "30px", right: "0" }}
                  className=" flex flex-col items-end"
                >
                  <p>počet procvičení</p>
                  <p>/ denní cíl</p>
                </Hint>
              </div>
            </div>
            {/* Practice Controls */}
            <div
              id="practice-controls"
              className=" tour-step-14 relative flex flex-col gap-1"
            >
              <div className="flex gap-1">
                <Button
                  onClick={() => setGrammarVisible(true)}
                  disabled={!grammar_id}
                  className="tour-step-15"
                >
                  <BookIcon />
                </Button>
                <Hint visibility={isOpen} style={{ top: "0px", left: "14px" }}>
                  gramatika
                </Hint>
                <Button
                  onClick={() => {
                    handleNext(config.progress.skipProgress);
                  }}
                  disabled={!revealed}
                  className="tour-step-16"
                >
                  <ForwardIcon />
                </Button>
                <Hint visibility={isOpen} style={{ top: "0px", right: "14px" }}>
                  dokončit
                </Hint>
              </div>
              {!revealed ? (
                <div className="tour-step-19 relative flex gap-1">
                  <Button
                    onClick={() => setHintIndex((prevIndex) => prevIndex + 1)}
                    className="tour-step-17"
                  >
                    <BulbIcon />
                  </Button>
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", left: "14px" }}
                  >
                    nápověda
                  </Hint>
                  <Button
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
                  >
                    <EyeIcon />
                  </Button>
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", right: "14px" }}
                  >
                    odhalit
                  </Hint>
                </div>
              ) : (
                <div className="tour-step-19 relative flex gap-1">
                  <Button
                    onClick={() => handleNext(config.progress.minusProgress)}
                    className="tour-step-20"
                  >
                    <MinusIcon />
                  </Button>
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", left: "14px" }}
                  >
                    neznám
                  </Hint>
                  <Button
                    onClick={() => handleNext(config.progress.plusProgress)}
                    className="tour-step-21"
                  >
                    <PlusIcon />
                  </Button>
                  <Hint
                    visibility={isOpen}
                    style={{ top: "0px", right: "14px" }}
                  >
                    znám
                  </Hint>
                </div>
              )}
            </div>
            <HelpButton className="help-btn-pos self-end" />
          </div>
        </>
      )}
    </div>
  );
}
