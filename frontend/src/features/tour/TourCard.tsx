import Button from "../../components/UI/buttons/Button";
import { useState, useRef, useEffect } from "react";
import CloseButton from "../../components/UI/buttons/CloseButton";

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
      className="max-w-card h-65 color-audio z-1000 fixed flex flex-col items-center justify-center w-full border border-dashed"
    >
      <CloseButton onClick={onClose} className="absolute top-0 right-0" />
      <div className="min-h-30 flex flex-col justify-center h-full p-4 pt-12 text-center">
        {content}
      </div>
      <div className="flex w-full max-w-full gap-1">
        <Button
          onClick={onPrevious}
          disabled={isFirst}
          className=" shrink flex-1 min-w-0"
        >
          Předchozí
        </Button>
        <Button onClick={onNext} className=" shrink flex-1 min-w-0">
          {isLast ? "Dokončit" : "Další"}
        </Button>
      </div>
    </div>
  );
}
