import React from "react";
import ButtonRectangular from "./button-rectangular";

export function Modal({
  isOpen,
  onConfirm,
  onClose,
  children,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className=" fixed inset-0 bg-overlay z-1000 flex justify-center items-center">
      <div className="bg-background-light dark:bg-background-dark card-width z-1001 flex flex-col justify-between min-h-40">
        <div className="flex flex-col justify-center items-center p-4 grow">
          {children}
        </div>
        <div className="flex gap-1">
          <ButtonRectangular onClick={onClose}>Ne</ButtonRectangular>
          <ButtonRectangular onAbort={onConfirm}>Ano</ButtonRectangular>
        </div>
      </div>
    </div>
  );
}
