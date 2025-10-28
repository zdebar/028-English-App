import Button from "../components/button";
import {
  SkipIcon,
  InfoIcon,
  HintIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
} from "../components/icons";
import { useState } from "react";

export default function PracticeCard() {
  const [revealed, setRevealed] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  return (
    <div className="card">
      {/* Card content with item details */}
      <div
        className={`color-disabled relative flex h-full flex-col items-center justify-between px-4 pt-3 pb-2  `}
        aria-label="Přehrát audio"
      >
        <div
          id="top-bar"
          className="relative flex w-full items-center justify-between"
        >
          <p className="text-sm">volume</p>
          <p className="text-sm">daily count</p>
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
          <p className="text-sm">progress</p>
          <p className="text-sm">nic</p>
        </div>
      </div>

      {/* Practice Controls */}
      <div id="practice-controls" className="flex gap-1">
        <Button>
          <InfoIcon />
        </Button>
        <Button>
          <SkipIcon />
        </Button>
      </div>
      <div className="flex gap-1">
        {!revealed ? (
          <>
            <Button onClick={() => setHintIndex((prevIndex) => prevIndex + 1)}>
              <HintIcon />
            </Button>
            <Button
              onClick={() => {
                setRevealed(true);
                setHintIndex(0);
              }}
            >
              <EyeIcon />
            </Button>
          </>
        ) : (
          <>
            <Button>
              <MinusIcon />
            </Button>
            <Button>
              <PlusIcon />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
