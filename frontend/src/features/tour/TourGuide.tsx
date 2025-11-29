import { useTourGuide, type TourStep } from "@/features/tour/use-tour-guide";
import TourCard from "./TourCard";
import Overlay from "../../components/UI/Overlay";
import { useTourStore } from "@/features/tour/use-tour-store";
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
