import type { ReadyPracticeScheduleEntry } from '@/types/generic.types';
import type { PracticeSessionType } from '@/types/practice-session.types';
import { create } from 'zustand';

type PracticeAvailabilityState = {
  reviewCount: number;
  reviewSchedule: ReadyPracticeScheduleEntry[];
  nextBlockId: number | null;
  activeSession: PracticeSessionType | null;
  practiceLoading: boolean;
  practiceError: Error | null;
  pronunciationCount: number;
  pronunciationLoading: boolean;
  pronunciationError: Error | null;
  reset: () => void;
};

const EMPTY_AVAILABILITY = {
  reviewCount: 0,
  reviewSchedule: [] as ReadyPracticeScheduleEntry[],
  nextBlockId: null,
  activeSession: null,
  practiceLoading: false,
  practiceError: null,
  pronunciationCount: 0,
  pronunciationLoading: false,
  pronunciationError: null,
};

/** Route-stable availability snapshots for the practice actions shown on Home. */
export const usePracticeAvailabilityStore = create<PracticeAvailabilityState>((set) => ({
  ...EMPTY_AVAILABILITY,
  practiceLoading: true,
  pronunciationLoading: true,
  reset: () => set(EMPTY_AVAILABILITY),
}));
