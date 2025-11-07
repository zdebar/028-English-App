import { useState } from "react";
import ButtonRectangular from "@/components/button-rectangular";
import { CloseIcon } from "@/components/icons";
import { Modal } from "@/components/modal";

interface OverviewCardProps {
  titleText?: string;
  children?: React.ReactNode;
  className?: string;
  handleReset?: () => void;
  onClose: () => void;
}

export default function OverviewCard({
  titleText = "bez názvu",
  children,
  className = "",
  handleReset,
  onClose,
}: OverviewCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className={`card-height card-width flex flex-col gap-1 justify-start ${className}`}
      >
        <div className="h-button flex items-center justify-between gap-1">
          <ButtonRectangular
            disabled={!handleReset}
            onClick={() => setIsModalOpen(true)}
            className="flex justify-start p-4"
          >
            {titleText}
          </ButtonRectangular>
          <ButtonRectangular className="w-button grow-0" onClick={onClose}>
            <CloseIcon />
          </ButtonRectangular>
        </div>
        <p className=" border border-dashed w-full grow p-4">{children}</p>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          if (handleReset) {
            handleReset();
          }
          console.log("Reset confirmed");
          setIsModalOpen(false);
          onClose();
        }}
      >
        <p>Opravdu chcete vymazat veškerý progress</p>
        <p>"{titleText}" ?</p>
        <p>Změna již nepůjde vrátit.</p>
      </Modal>
    </>
  );
}
