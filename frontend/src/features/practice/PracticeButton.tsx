import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';
import StyledButton from '@/components/UI/buttons/StyledButton';
import config from '@/config/config';
import {
  isReviewLimitExceeded,
  isReviewThresholdReached,
} from './practice-availability';

type PracticeButtonState = Readonly<{
  grammarReviewDisabled: boolean;
  vocabularyReviewDisabled: boolean;
  newDisabled: boolean;
  newAvailable: boolean;
  grammarReviewTitle: string | undefined;
  vocabularyReviewTitle: string | undefined;
  newTitle: string | undefined;
}>;

function isActiveNew(activeSession: { mode: 'review' | 'new' } | null): boolean {
  return activeSession?.mode === 'new';
}

type ReviewAvailability = Readonly<{
  grammar: boolean;
  vocabulary: boolean;
  any: boolean;
  limitExceeded: boolean;
}>;

function resolveReviewAvailability(
  grammarReviewReadyAt: string | null,
  vocabularyReviewReadyAt: string | null,
  grammarReviewDueCount: number,
  vocabularyReviewDueCount: number,
): ReviewAvailability {
  const grammar = isReviewAvailable(
    grammarReviewReadyAt,
    grammarReviewDueCount,
    config.practice.grammarReviewLimitSize,
  );
  const vocabulary = isReviewAvailable(
    vocabularyReviewReadyAt,
    vocabularyReviewDueCount,
    config.practice.vocabularyReviewLimitSize,
  );
  const grammarLimitExceeded = isReviewLimitExceeded(
    grammarReviewDueCount,
    config.practice.grammarReviewLimitSize,
  );
  const vocabularyLimitExceeded = isReviewLimitExceeded(
    vocabularyReviewDueCount,
    config.practice.vocabularyReviewLimitSize,
  );
  return {
    grammar,
    vocabulary,
    any: grammar || vocabulary,
    limitExceeded: grammarLimitExceeded || vocabularyLimitExceeded,
  };
}

function isReviewAvailable(
  readyAt: string | null,
  dueCount: number,
  limitSize: number,
): boolean {
  return isReviewThresholdReached(dueCount, readyAt, limitSize);
}

type PracticeButtonFlags = Readonly<{
  grammarReviewDisabled: boolean;
  vocabularyReviewDisabled: boolean;
  newDisabled: boolean;
  newAvailable: boolean;
}>;

function resolvePracticeButtonFlags(
  reviewAvailability: ReviewAvailability,
  initialTrainingAvailable: boolean,
  activeNew: boolean,
  loading: boolean,
  error: Error | null,
): PracticeButtonFlags {
  const blocked = Boolean(error) || loading;
  const grammarReviewDisabled = blocked || !reviewAvailability.grammar;
  const vocabularyReviewDisabled = blocked || !reviewAvailability.vocabulary;
  const newAvailable = activeNew || initialTrainingAvailable;
  const newBlockedByReview = !activeNew && reviewAvailability.limitExceeded;
  const newDisabled = blocked || newBlockedByReview || !newAvailable;
  return {
    grammarReviewDisabled,
    vocabularyReviewDisabled,
    newDisabled,
    newAvailable,
  };
}

type PracticeButtonInputs = Readonly<{
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  grammarReviewDueCount: number;
  vocabularyReviewDueCount: number;
  initialTrainingAvailable: boolean;
  activeSession: { mode: 'review' | 'new' } | null;
  loading: boolean;
  error: Error | null;
}>;

function resolvePracticeButtonState({
  grammarReviewReadyAt,
  vocabularyReviewReadyAt,
  grammarReviewDueCount,
  vocabularyReviewDueCount,
  initialTrainingAvailable,
  activeSession,
  loading,
  error,
}: PracticeButtonInputs): PracticeButtonState {
  const activeNew = isActiveNew(activeSession);
  const reviewAvailability = resolveReviewAvailability(
    grammarReviewReadyAt,
    vocabularyReviewReadyAt,
    grammarReviewDueCount,
    vocabularyReviewDueCount,
  );
  const buttonFlags = resolvePracticeButtonFlags(
    reviewAvailability,
    initialTrainingAvailable,
    activeNew,
    loading,
    error,
  );

  return {
    ...buttonFlags,
    grammarReviewTitle: resolveButtonTitle(loading, error, buttonFlags.grammarReviewDisabled),
    vocabularyReviewTitle: resolveButtonTitle(
      loading,
      error,
      buttonFlags.vocabularyReviewDisabled,
    ),
    newTitle: resolveButtonTitle(loading, error, buttonFlags.newDisabled),
  };
}

function NewPracticeButton({
  available,
  disabled,
  loading,
  title,
}: Readonly<{
  available: boolean;
  disabled: boolean;
  loading: boolean;
  title: string | undefined;
}>): JSX.Element {
  if (!available && !loading) {
    return (
      <StyledButton className="h-button max-h-button w-full px-4" disabled title={title}>
        {TEXTS.newButton}
      </StyledButton>
    );
  }
  return (
    <NavigationButton
      to={ROUTES.initialTraining}
      className="h-button max-h-button w-full px-4"
      disabled={disabled}
      title={title}
    >
      {TEXTS.newButton}
    </NavigationButton>
  );
}

function ReviewPracticeButton({
  dueCount,
  disabled,
  title,
  to,
  labelClassName = '',
  children,
}: Readonly<{
  dueCount: number;
  disabled: boolean;
  title: string | undefined;
  to: string;
  labelClassName?: string;
  children: string;
}>): JSX.Element {
  return (
    <NavigationButton
      to={to}
      className="h-button max-h-button relative w-full px-4"
      disabled={disabled}
      title={title}
    >
      {dueCount > 0 ? (
        <span
          aria-hidden="true"
          className="bg-light font-body text-dark dark:bg-dark dark:text-light pointer-events-none absolute top-1 right-1 z-10 rounded-full py-0.5 pr-1.5 pl-2 text-center text-xs leading-none"
        >
          {dueCount}
        </span>
      ) : null}
      <span className={`inline-block ${labelClassName}`}>{children}</span>
    </NavigationButton>
  );
}

export default function PracticeButtons(): JSX.Element {
  const grammarReviewReadyAt = usePracticeAvailabilityStore(
    (state) => state.grammarReviewReadyAt,
  );
  const vocabularyReviewReadyAt = usePracticeAvailabilityStore(
    (state) => state.vocabularyReviewReadyAt,
  );
  const grammarReviewDueCount = usePracticeAvailabilityStore(
    (state) => state.grammarReviewDueCount,
  );
  const vocabularyReviewDueCount = usePracticeAvailabilityStore(
    (state) => state.vocabularyReviewDueCount,
  );
  const initialTrainingAvailable = usePracticeAvailabilityStore(
    (state) => state.initialTrainingAvailable,
  );
  const activeSession = usePracticeAvailabilityStore((state) => state.activeSession);
  const loading = usePracticeAvailabilityStore((state) => state.practiceLoading);
  const error = usePracticeAvailabilityStore((state) => state.practiceError);
  const {
    grammarReviewDisabled,
    vocabularyReviewDisabled,
    newDisabled,
    newAvailable,
    grammarReviewTitle,
    vocabularyReviewTitle,
    newTitle,
  } = resolvePracticeButtonState({
    grammarReviewReadyAt,
    vocabularyReviewReadyAt,
    grammarReviewDueCount,
    vocabularyReviewDueCount,
    initialTrainingAvailable,
    activeSession,
    loading,
    error,
  });

  return (
    <div className="flex w-full flex-col gap-1">
      <NewPracticeButton
        available={newAvailable}
        disabled={newDisabled}
        loading={loading}
        title={newTitle}
      />
      <ReviewPracticeButton
        dueCount={grammarReviewDueCount}
        disabled={grammarReviewDisabled}
        title={grammarReviewTitle}
        to={ROUTES.grammarPractice}
      >
        {TEXTS.grammarReviewButton}
      </ReviewPracticeButton>
      <ReviewPracticeButton
        dueCount={vocabularyReviewDueCount}
        disabled={vocabularyReviewDisabled}
        labelClassName="-translate-x-1.5"
        title={vocabularyReviewTitle}
        to={ROUTES.vocabularyPractice}
      >
        {TEXTS.vocabularyReviewButton}
      </ReviewPracticeButton>
    </div>
  );
}

function resolveButtonTitle(
  loading: boolean,
  error: Error | null,
  disabled: boolean,
): string | undefined {
  if (loading) return TEXTS.loadingMessage;
  if (error) return TEXTS.loadingError;
  if (disabled) return TEXTS.nothingToPractice;
  return undefined;
}
