import { useState, useEffect } from "react";
import { Modal } from "@/components/modal";
import ButtonRectangular from "../components/button-rectangular";
import Grammar from "@/database/models/grammar";
import UserItem from "@/database/models/user-items";
import type { GrammarLocal } from "@/types/local.types";
import { CloseIcon, NextIcon, PreviousIcon } from "../components/icons";
import { useNavigate } from "react-router-dom";

export default function GrammarOverview() {
  const [grammarArray, setGrammarArray] = useState<GrammarLocal[] | null>(null);
  const [index, setIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchGrammarArray() {
      try {
        const fetchedContent = await Grammar.getStartedGrammarList();
        console.log(fetchedContent);
        setGrammarArray(fetchedContent);
      } catch (error) {
        setError("Chyba při načítání gramatiky.");
        console.error("Failed to fetch grammar content.", error);
      }
    }

    fetchGrammarArray();
  }, []);

  const handleClearGrammarUserItems = () => {
    const id = grammarArray?.[index]?.id;
    if (typeof id === "number") {
      UserItem.clearGrammarUserItems(id);
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
            {error ? error : grammarArray?.[index]?.name || "Loading..."}
          </ButtonRectangular>
          <ButtonRectangular
            className="w-button grow-0"
            onClick={() => navigate("/profile")}
          >
            <CloseIcon />
          </ButtonRectangular>
        </div>
        <p className=" border border-dashed w-full grow p-4">
          {grammarArray?.[index]?.note}
        </p>
        <div className="flex gap-1 ">
          <ButtonRectangular
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            <PreviousIcon />
          </ButtonRectangular>
          <ButtonRectangular
            disabled={!grammarArray || index >= grammarArray.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            <NextIcon />
          </ButtonRectangular>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleClearGrammarUserItems}
      >
        <p>
          Opravdu chcete vymazat veškerý progress položek pro gramatiku "
          {grammarArray?.[index].name}"?
        </p>
        <p>Změna již nepůjde vrátit.</p>
      </Modal>
    </>
  );
}
