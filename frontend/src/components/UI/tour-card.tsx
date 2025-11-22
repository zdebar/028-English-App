import ButtonRectangular from "./button-rectangular";
import { CloseIcon } from "./icons";
import { useState, useRef, useEffect } from "react";

type TourCardProps = {
  content: React.ReactNode;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  selector?: string;
};

const CARD_CONFIG = {
  offset: 12, // distance from the element
  minSpace: 20, // minimum space above/below
  edgePadding: 0, // padding from the edge
  maxWidth: 400, // maximum card width
};

export default function TourCard({
  content,
  onNext,
  onPrevious,
  onClose,
  isFirst = false,
  isLast,
  selector,
}: TourCardProps) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updatePosition() {
      let top = window.innerHeight / 2;
      if (selector) {
        const el = document.querySelector(selector);
        const card = cardRef.current;
        if (el && card) {
          const rect = el.getBoundingClientRect();
          const cardHeight = card.offsetHeight;
          const spaceAbove = rect.top;
          const spaceBelow = window.innerHeight - rect.bottom;

          // Preferuj umístění nad selektor, pokud je dost místa
          if (spaceAbove > cardHeight + CARD_CONFIG.minSpace) {
            top = rect.top - CARD_CONFIG.offset - cardHeight / 2;
          } else if (spaceBelow > cardHeight + CARD_CONFIG.minSpace) {
            top = rect.bottom + CARD_CONFIG.offset + cardHeight / 2;
          } else {
            top = window.innerHeight / 2;
          }
        }
      }
      setStyle({
        position: "absolute",
        left: "50%",
        top,
        transform: "translate(-50%, -50%)",
        zIndex: 1001,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [selector, content]);

  return (
    <div
      ref={cardRef}
      style={style}
      className="max-w-card w-full fixed color-audio border border-dashed z-1000 flex flex-col items-center justify-center"
    >
      <p
        className="absolute top-0 right-0 w-11 h-11 flex justify-center items-center"
        onClick={onClose}
      >
        <CloseIcon />
      </p>
      <div className="p-4 pt-12 h-full min-h-30 flex flex-col justify-center text-center">
        {content}
      </div>
      <div className="flex gap-1 w-full max-w-full">
        <ButtonRectangular
          onClick={onPrevious}
          disabled={isFirst}
          className=" min-w-0 shrink flex-1"
        >
          Předchozí
        </ButtonRectangular>
        <ButtonRectangular onClick={onNext} className=" min-w-0 shrink flex-1">
          {isLast ? "Dokončit" : "Další"}
        </ButtonRectangular>
      </div>
    </div>
  );
}
