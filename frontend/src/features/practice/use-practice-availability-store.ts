import type { PracticeSessionType } from '@/types/practice-session.types';
import { create } from 'zustand';
import type { PracticeAvailabilitySnapshot } from './practice-availability';

type PracticeAvailabilityValues = Pick<
  PracticeAvailabilitySnapshot,
  'grammarReviewReadyAt' | 'vocabularyReviewReadyAt' | 'initialTrainingAvailable' | 'activeSession'
>;

type PracticeAvailabilityState = {
  availabilityUserId: string | null;
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  initialTrainingAvailable: boolean;
  activeSession: PracticeSessionType | null;
  practiceLoading: boolean;
  practiceError: Error | null;
  setLoading: (userId: string) => void;
  setSnapshot: (userId: string, values: PracticeAvailabilityValues) => void;
  setError: (userId: string, error: Error) => void;
  reset: () => void;
};

const EMPTY_AVAILABILITY = {
  availabilityUserId: null,
  grammarReviewReadyAt: null,
  vocabularyReviewReadyAt: null,
  initialTrainingAvailable: false,
  activeSession: null,
  practiceLoading: true,
  practiceError: null,
};

/** Stores the latest availability snapshot used by the practice actions shown on Home. */
export const usePracticeAvailabilityStore = create<PracticeAvailabilityState>((set) => ({
  ...EMPTY_AVAILABILITY,
  setLoading: (userId) =>
    set({
      availabilityUserId: userId,
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      initialTrainingAvailable: false,
      activeSession: null,
      practiceLoading: true,
      practiceError: null,
    }),
  setSnapshot: (userId, values) =>
    set({
      availabilityUserId: userId,
      grammarReviewReadyAt: values.grammarReviewReadyAt,
      vocabularyReviewReadyAt: values.vocabularyReviewReadyAt,
      initialTrainingAvailable: values.initialTrainingAvailable,
      activeSession: values.activeSession,
      practiceLoading: false,
      practiceError: null,
    }),
  setError: (userId, error) =>
    set({
      availabilityUserId: userId,
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      initialTrainingAvailable: false,
      activeSession: null,
      practiceLoading: false,
      practiceError: error,
    }),
  reset: () => set(EMPTY_AVAILABILITY),
}));
