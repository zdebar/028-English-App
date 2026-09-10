import type { PracticeSessionType } from '@/types/practice-session.types';
import { create } from 'zustand';

type PracticeAvailabilityState = {
  reviewReadyAt: string | null;
  initialTrainingAvailable: boolean;
  activeSession: PracticeSessionType | null;
  practiceLoading: boolean;
  practiceError: Error | null;
  reset: () => void;
};

const EMPTY_AVAILABILITY = {
  reviewReadyAt: null,
  initialTrainingAvailable: false,
  activeSession: null,
  practiceLoading: false,
  practiceError: null,
};

/** Route-stable availability snapshots for the practice actions shown on Home. */
export const usePracticeAvailabilityStore = create<PracticeAvailabilityState>((set) => ({
  ...EMPTY_AVAILABILITY,
  practiceLoading: true,
  reset: () => set(EMPTY_AVAILABILITY),
}));
