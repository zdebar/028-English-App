import ButtonRectangular from "@/components/UI/button-rectangular";
import {
  SkipIcon,
  InfoIcon,
  HintIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
} from "@/components/UI/icons";

interface PracticeControlsProps {
  revealed: boolean;
  hasGrammar: boolean;
  direction: boolean;
  handleNext: (progressIncrement: number) => void;
  setRevealed: (revealed: boolean) => void;
  setHintIndex: (updateFn: (prevIndex: number) => number) => void;
  setGrammarVisible: (visible: boolean) => void;
  playAudioForItem: () => void; // Abstracted audio playback logic
  config: {
    progress: {
      skipProgress: number;
      minusProgress: number;
      plusProgress: number;
    };
  };
}

export function PracticeControls({
  revealed,
  hasGrammar,
  direction,
  handleNext,
  setRevealed,
  setHintIndex,
  setGrammarVisible,
  playAudioForItem,
  config,
}: PracticeControlsProps) {
  return (
    <>
      <div id="practice-controls" className="flex gap-1">
        <ButtonRectangular
          onClick={() => setGrammarVisible(true)}
          disabled={!hasGrammar || !revealed}
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
    </>
  );
}
