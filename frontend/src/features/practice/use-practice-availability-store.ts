import type { ReadyPracticeScheduleEntry } from '@/types/generic.types';
import { create } from 'zustand';

type PracticeAvailabilityState = {
  readyCount: number;
  readySchedule: ReadyPracticeScheduleEntry[];
  readyLoading: boolean;
  readyError: Error | null;
  pronunciationCount: number;
  pronunciationLoading: boolean;
  pronunciationError: Error | null;
  reset: () => void;
};

const EMPTY_AVAILABILITY = {
  readyCount: 0,
  readySchedule: [] as ReadyPracticeScheduleEntry[],
  readyLoading: false,
  readyError: null,
  pronunciationCount: 0,
  pronunciationLoading: false,
  pronunciationError: null,
};

/** Route-stable availability snapshots for the practice actions shown on Home. */
export const usePracticeAvailabilityStore = create<PracticeAvailabilityState>((set) => ({
  ...EMPTY_AVAILABILITY,
  readyLoading: true,
  pronunciationLoading: true,
  reset: () => set(EMPTY_AVAILABILITY),
}));
