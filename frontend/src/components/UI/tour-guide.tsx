import { useTourGuide, type TourStep } from "@/hooks/use-tour-guide";
import TourCard from "./tour-card";
import Overlay from "./overlay";
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
  const { current, next, prev, isFirst, isLast } = useTourGuide(tour);
  const setCurrent = useTourStore((s) => s.setCurrent);

  useEffect(() => {
    setCurrent(current);
  }, [current, setCurrent]);

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
