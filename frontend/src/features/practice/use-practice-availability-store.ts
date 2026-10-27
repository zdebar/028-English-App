import { create } from 'zustand';
import type { PracticeAvailabilitySnapshot } from './practice-availability';

type PracticeAvailabilityValues = Pick<
  PracticeAvailabilitySnapshot,
  | 'grammarReviewReadyAt'
  | 'vocabularyReviewReadyAt'
  | 'grammarReviewDueCount'
  | 'vocabularyReviewDueCount'
  | 'nextReviewAt'
  | 'initialTrainingAvailable'
  | 'continuingInitialLessonToday'
  | 'dailyNewLessonLimitReached'
  | 'newLessonsStartedTodayCount'
  | 'maxNewLessonsPerDay'
>;

type ReviewAvailabilityValues = Pick<
  PracticeAvailabilitySnapshot,
  | 'grammarReviewReadyAt'
  | 'vocabularyReviewReadyAt'
  | 'grammarReviewDueCount'
  | 'vocabularyReviewDueCount'
  | 'nextReviewAt'
>;

export type PracticeAvailabilityState = {
  availabilityUserId: string | null;
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  grammarReviewDueCount: number;
  vocabularyReviewDueCount: number;
  nextReviewAt: string | null;
  initialTrainingAvailable: boolean;
  continuingInitialLessonToday: boolean;
  dailyNewLessonLimitReached: boolean;
  newLessonsStartedTodayCount: number;
  maxNewLessonsPerDay: number;
  practiceLoading: boolean;
  practiceError: Error | null;
  setLoading: (userId: string) => void;
  setSnapshot: (userId: string, values: PracticeAvailabilityValues) => void;
  setReviewSnapshot: (userId: string, values: ReviewAvailabilityValues) => void;
  setMaxNewLessonsPerDay: (limit: number) => void;
  setError: (userId: string, error: Error) => void;
  reset: () => void;
};

const EMPTY_AVAILABILITY = {
  availabilityUserId: null,
  grammarReviewReadyAt: null,
  vocabularyReviewReadyAt: null,
  grammarReviewDueCount: 0,
  vocabularyReviewDueCount: 0,
  nextReviewAt: null,
  initialTrainingAvailable: false,
  continuingInitialLessonToday: false,
  dailyNewLessonLimitReached: false,
  newLessonsStartedTodayCount: 0,
  maxNewLessonsPerDay: 1,
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
      grammarReviewDueCount: 0,
      vocabularyReviewDueCount: 0,
      nextReviewAt: null,
      initialTrainingAvailable: false,
      continuingInitialLessonToday: false,
      dailyNewLessonLimitReached: false,
      newLessonsStartedTodayCount: 0,
      maxNewLessonsPerDay: 1,
      practiceLoading: true,
      practiceError: null,
    }),
  setSnapshot: (userId, values) =>
    set({
      availabilityUserId: userId,
      grammarReviewReadyAt: values.grammarReviewReadyAt,
      vocabularyReviewReadyAt: values.vocabularyReviewReadyAt,
      grammarReviewDueCount: values.grammarReviewDueCount,
      vocabularyReviewDueCount: values.vocabularyReviewDueCount,
      nextReviewAt: values.nextReviewAt,
      initialTrainingAvailable: values.initialTrainingAvailable,
      continuingInitialLessonToday: values.continuingInitialLessonToday,
      dailyNewLessonLimitReached: values.dailyNewLessonLimitReached,
      newLessonsStartedTodayCount: values.newLessonsStartedTodayCount,
      maxNewLessonsPerDay: values.maxNewLessonsPerDay,
      practiceLoading: false,
      practiceError: null,
    }),
  setReviewSnapshot: (userId, values) =>
    set((state) => {
      if (state.availabilityUserId !== userId) return state;
      return values;
    }),
  setMaxNewLessonsPerDay: (limit) =>
    set((state) => ({
      maxNewLessonsPerDay: limit,
      dailyNewLessonLimitReached:
        state.newLessonsStartedTodayCount >= limit && !state.continuingInitialLessonToday,
    })),
  setError: (userId, error) =>
    set({
      availabilityUserId: userId,
      grammarReviewReadyAt: null,
      vocabularyReviewReadyAt: null,
      grammarReviewDueCount: 0,
      vocabularyReviewDueCount: 0,
      nextReviewAt: null,
      initialTrainingAvailable: false,
      continuingInitialLessonToday: false,
      dailyNewLessonLimitReached: false,
      newLessonsStartedTodayCount: 0,
      maxNewLessonsPerDay: 1,
      practiceLoading: false,
      practiceError: error,
    }),
  reset: () => set(EMPTY_AVAILABILITY),
}));
