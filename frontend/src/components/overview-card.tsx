import { useState } from "react";
import ButtonRectangular from "@/components/button-rectangular";
import UserItem from "@/database/models/user-items";
import type { GrammarLocal } from "@/types/local.types";
import { CloseIcon } from "@/components/icons";
import { Modal } from "@/components/modal";
import { PreviousIcon, NextIcon } from "@/components/icons";

interface OverviewCardArrayProps {
  inputGrammar: GrammarLocal;
  onNext: () => void;
  nextDisabled: boolean;
  onPrevious: () => void;
  previousDisabled: boolean;
  onClose: () => void;
  onClearProgress: (id: number) => void;
  singleItem: boolean;
}

export default function OverviewCardArray({
  inputGrammar,
  onNext,
  nextDisabled,
  onPrevious,
  previousDisabled,
  onClearProgress,
  onClose,
  singleItem,
}: OverviewCardArrayProps) {
  const [grammar] = useState<GrammarLocal>(inputGrammar);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClearGrammarUserItems = () => {
    const id = grammar?.id;
    if (typeof id === "number") {
      UserItem.clearGrammarUserItems(id);
      onClearProgress(id);
    }
  };

  return (
    <>
      <div className="card-height card-width flex flex-col gap-1 justify-start">
        <div className="h-button flex items-center justify-between gap-1">
          <ButtonRectangular
            onClick={() => setIsModalOpen(true)}
            className="flex justify-start p-4"
          >
            {grammar?.name || "Loading..."}
          </ButtonRectangular>
          <ButtonRectangular className="w-button grow-0" onClick={onClose}>
            <CloseIcon />
          </ButtonRectangular>
        </div>
        <p className=" border border-dashed w-full grow p-4">{grammar?.note}</p>
        {!singleItem && (
          <div className="flex gap-1 ">
            <ButtonRectangular disabled={previousDisabled} onClick={onPrevious}>
              <PreviousIcon />
            </ButtonRectangular>
            <ButtonRectangular disabled={nextDisabled} onClick={onNext}>
              <NextIcon />
            </ButtonRectangular>
          </div>
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleClearGrammarUserItems}
      >
        <p>Opravdu chcete vymazat veškerý progress pro "{grammar?.name}"?</p>
        <p>Změna již nepůjde vrátit.</p>
      </Modal>
    </>
  );
}
