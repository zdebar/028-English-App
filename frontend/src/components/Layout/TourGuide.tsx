import { useTourGuide, type TourStep } from "@/hooks/use-tour-guide";
import TourCard from "../UI/TourCard";
import Overlay from "../UI/Overlay";
import { useTourStore } from "@/hooks/use-tour-store";
import { useEffect } from "react";

type TourGuideLauncherProps = {
  tour: TourStep[];
  onClose: () => void;
};

export default function TourGuideLauncher({
  tour,
  onClose,
}: TourGuideLauncherProps) {
  const { id, current, next, prev, isFirst, isLast } = useTourGuide(tour);
  const setCurrentId = useTourStore((s) => s.setCurrentId);

  useEffect(() => {
    setCurrentId(id);
  }, [id, setCurrentId]);
  return (
    <>
      <Overlay target={current.target} />
      <TourCard
        content={current.content}
        onNext={() => {
          next();
          if (isLast) {
            onClose();
          }
        }}
        onPrevious={prev}
        onClose={onClose}
        isFirst={isFirst}
        isLast={isLast}
        selector={current.target}
      />
    </>
  );
}
