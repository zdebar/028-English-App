import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export type TourStep = {
  id?: string | number;
  content: React.ReactNode;
  target: string;
  onPreviousNavigateTo?: string;
  onNextNavigateTo?: string;
};

export function useTourGuide(tour: TourStep[]) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const isLast = index === tour.length - 1;

  const next = useCallback(() => {
    if (tour[index].onNextNavigateTo) {
      navigate(tour[index].onNextNavigateTo);
    }
    if (!isLast) {
      setIndex((prev) => (!isLast ? prev + 1 : prev));
    } else {
      setIndex(0);
    }
  }, [isLast, navigate, index, tour]);

  const prev = useCallback(() => {
    if (tour[index].onPreviousNavigateTo) {
      navigate(tour[index].onPreviousNavigateTo);
    }
    setIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, [index, navigate, tour]);

  const reset = useCallback(() => {
    setIndex(0);
  }, []);

  return {
    index,
    id: tour[index].id,
    current: tour[index],
    next,
    prev,
    reset,
    target: tour[index]?.target,
    length: tour.length,
    isFirst: index === 0,
    isLast: index === tour.length - 1,
  };
}
