import ButtonRectangular from "@/components/button-rectangular";
import {
  SkipIcon,
  InfoIcon,
  HintIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
} from "@/components/icons";
import { useState } from "react";

export default function PracticeCard() {
  const [revealed, setRevealed] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  console.log("Hint index:", hintIndex);

  return (
    <div className="card-height card-width ">
      {/* Card content with item details */}
      <div
        className="border border-dashed relative flex h-full flex-col items-center justify-between p-4"
        aria-label="Přehrát audio"
      >
        <div
          id="top-bar"
          className="relative flex w-full items-center justify-between"
        >
          <p className="font-light">volume</p>
          <p className="font-light">error</p>
        </div>
        <div id="item">
          <p className="text-center font-bold">czech</p>
          <p className="text-center">english</p>
          <p className="text-center">pronunciation</p>
        </div>
        <div
          className="relative flex w-full items-center justify-between"
          id="bottom-bar"
        >
          <p className="font-light">progress</p>
          <p className="font-light">daily count</p>
        </div>
      </div>

      {/* Practice Controls */}
      <div id="practice-controls" className="flex gap-1">
        <ButtonRectangular disabled>
          <InfoIcon />
        </ButtonRectangular>
        <ButtonRectangular>
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
                setHintIndex(0);
              }}
            >
              <EyeIcon />
            </ButtonRectangular>
          </>
        ) : (
          <>
            <ButtonRectangular>
              <MinusIcon />
            </ButtonRectangular>
            <ButtonRectangular>
              <PlusIcon />
            </ButtonRectangular>
          </>
        )}
      </div>
    </div>
  );
}
