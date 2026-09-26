import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState, type JSX } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';
import StyledButton from '@/components/UI/buttons/StyledButton';

type PracticeButtonState = Readonly<{
  grammarReviewDisabled: boolean;
  vocabularyReviewDisabled: boolean;
  newDisabled: boolean;
  newAvailable: boolean;
  grammarReviewTitle: string | undefined;
  vocabularyReviewTitle: string | undefined;
  newTitle: string | undefined;
  grammarReviewCountdown: string | null;
  vocabularyReviewCountdown: string | null;
}>;

function isReviewAvailable(readyAt: string | null, checkedAt: number): boolean {
  if (readyAt === null) return false;
  return Date.parse(readyAt) <= Math.max(checkedAt, Date.now());
}

/** Re-renders once per second until the nearest stored review deadline. */
function useReviewClock(
  grammarReviewReadyAt: string | null,
  vocabularyReviewReadyAt: string | null,
): number {
  const [checkedAt, setCheckedAt] = useState(Date.now);
  useEffect(() => {
    const remainingTimes = [grammarReviewReadyAt, vocabularyReviewReadyAt]
      .filter((readyAt): readyAt is string => readyAt !== null)
      .map((readyAt) => Date.parse(readyAt) - Date.now())
      .filter((remaining) => Number.isFinite(remaining) && remaining > 0);
    if (remainingTimes.length === 0) return;

    const timeout = globalThis.setTimeout(
      () => setCheckedAt(Date.now()),
      Math.min(Math.min(...remainingTimes), 1000),
    );
    return () => globalThis.clearTimeout(timeout);
  }, [checkedAt, grammarReviewReadyAt, vocabularyReviewReadyAt]);
  return checkedAt;
}

function isActiveReview(activeSession: { mode: 'review' | 'new' } | null): boolean {
  return activeSession?.mode === 'review';
}

function isActiveNew(activeSession: { mode: 'review' | 'new' } | null): boolean {
  return activeSession?.mode === 'new';
}

type ReviewAvailability = Readonly<{
  grammar: boolean;
  vocabulary: boolean;
  any: boolean;
}>;

function resolveReviewAvailability(
  grammarReviewReadyAt: string | null,
  vocabularyReviewReadyAt: string | null,
  checkedAt: number,
  activeReview: boolean,
): ReviewAvailability {
  const grammar = activeReview || isReviewAvailable(grammarReviewReadyAt, checkedAt);
  const vocabulary = isReviewAvailable(vocabularyReviewReadyAt, checkedAt);
  return { grammar, vocabulary, any: grammar || vocabulary };
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
  const vocabularyReviewDisabled =
    blocked || reviewAvailability.grammar || !reviewAvailability.vocabulary;
  const newAvailable = activeNew || (!reviewAvailability.any && initialTrainingAvailable);
  const newDisabled = blocked || reviewAvailability.any || !newAvailable;
  return {
    grammarReviewDisabled,
    vocabularyReviewDisabled,
    newDisabled,
    newAvailable,
  };
}

function resolvePracticeButtonState(
  grammarReviewReadyAt: string | null,
  vocabularyReviewReadyAt: string | null,
  checkedAt: number,
  initialTrainingAvailable: boolean,
  activeSession: { mode: 'review' | 'new' } | null,
  loading: boolean,
  error: Error | null,
): PracticeButtonState {
  const activeReview = isActiveReview(activeSession);
  const activeNew = isActiveNew(activeSession);
  const reviewAvailability = resolveReviewAvailability(
    grammarReviewReadyAt,
    vocabularyReviewReadyAt,
    checkedAt,
    activeReview,
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
    grammarReviewCountdown: resolveReviewCountdown(
      grammarReviewReadyAt,
      checkedAt,
      buttonFlags.grammarReviewDisabled,
      loading,
      error,
    ),
    vocabularyReviewCountdown: resolveReviewCountdown(
      vocabularyReviewReadyAt,
      checkedAt,
      buttonFlags.vocabularyReviewDisabled,
      loading,
      error,
    ),
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
  countdown,
  disabled,
  title,
  to,
  children,
}: Readonly<{
  countdown: string | null;
  disabled: boolean;
  title: string | undefined;
  to: string;
  children: string;
}>): JSX.Element {
  return (
    <NavigationButton
      to={to}
      className="relative h-button max-h-button w-full px-4"
      disabled={disabled}
      title={title}
    >
      {countdown ? (
        <span
          aria-hidden="true"
          className="text-disabled-light dark:text-disabled-dark pointer-events-none absolute top-1 right-1 text-xs leading-none"
        >
          {countdown}
        </span>
      ) : null}
      {children}
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
  const checkedAt = useReviewClock(grammarReviewReadyAt, vocabularyReviewReadyAt);
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
    grammarReviewCountdown,
    vocabularyReviewCountdown,
  } = resolvePracticeButtonState(
    grammarReviewReadyAt,
    vocabularyReviewReadyAt,
    checkedAt,
    initialTrainingAvailable,
    activeSession,
    loading,
    error,
  );

  return (
    <div className="flex w-full flex-col gap-1">
      <NewPracticeButton
        available={newAvailable}
        disabled={newDisabled}
        loading={loading}
        title={newTitle}
      />
      <ReviewPracticeButton
        countdown={grammarReviewCountdown}
        disabled={grammarReviewDisabled}
        title={grammarReviewTitle}
        to={ROUTES.grammarPractice}
      >
        {TEXTS.grammarReviewButton}
      </ReviewPracticeButton>
      <ReviewPracticeButton
        countdown={vocabularyReviewCountdown}
        disabled={vocabularyReviewDisabled}
        title={vocabularyReviewTitle}
        to={ROUTES.vocabularyPractice}
      >
        {TEXTS.vocabularyReviewButton}
      </ReviewPracticeButton>
    </div>
  );
}

function resolveReviewCountdown(
  readyAt: string | null,
  checkedAt: number,
  reviewDisabled: boolean,
  loading: boolean,
  error: Error | null,
): string | null {
  if (!reviewDisabled || loading || error) return null;
  return formatReviewCountdown(readyAt, checkedAt);
}

function formatReviewCountdown(readyAt: string | null, checkedAt: number): string | null {
  if (!readyAt) return null;
  const remainingSeconds = Math.ceil((Date.parse(readyAt) - checkedAt) / 1000);
  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) return null;

  const days = Math.floor(remainingSeconds / 86_400);
  const hours = Math.floor((remainingSeconds % 86_400) / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;
  const clock = formatClock(days, hours, minutes, seconds);

  if (days > 0) return `${days} ${getDayLabel(days)} + ${clock}`;
  return clock;
}

function formatClock(days: number, hours: number, minutes: number, seconds: number): string {
  if (days > 0 || hours > 0) {
    return `${hours}:${padTime(minutes)}:${padTime(seconds)}`;
  }
  if (minutes > 0) return `${minutes}:${padTime(seconds)}`;
  return String(seconds);
}

function padTime(value: number): string {
  return String(value).padStart(2, '0');
}

function getDayLabel(days: number): string {
  const lastTwoDigits = days % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'dní';

  const lastDigit = days % 10;
  if (lastDigit === 1) return 'den';
  if (lastDigit >= 2 && lastDigit <= 4) return 'dny';
  return 'dní';
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
