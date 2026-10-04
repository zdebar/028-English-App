import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState, type JSX } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';
import StyledButton from '@/components/UI/buttons/StyledButton';
import config from '@/config/config';
import { isReviewThresholdReached } from './practice-availability';

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
  grammarReviewDueCount: number,
  vocabularyReviewDueCount: number,
  checkedAt: number,
): ReviewAvailability {
  const grammar = isReviewAvailable(
    grammarReviewReadyAt,
    grammarReviewDueCount,
    config.practice.grammarReviewMinimumSize,
    checkedAt,
  );
  const vocabulary = isReviewAvailable(
    vocabularyReviewReadyAt,
    vocabularyReviewDueCount,
    config.practice.vocabularyReviewMinimumSize,
    checkedAt,
  );
  return { grammar, vocabulary, any: grammar || vocabulary };
}

function isReviewAvailable(
  readyAt: string | null,
  dueCount: number,
  minimumSize: number,
  checkedAt: number,
): boolean {
  const effectiveCheckedAt = Math.max(checkedAt, Date.now());
  return isReviewThresholdReached(dueCount, readyAt, minimumSize, effectiveCheckedAt);
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
  const newBlockedByReview = !activeNew && reviewAvailability.any;
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
  checkedAt: number;
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
  checkedAt,
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
    checkedAt,
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
  dueCount,
  countdown,
  disabled,
  title,
  to,
  labelClassName = '',
  children,
}: Readonly<{
  dueCount: number;
  countdown: string | null;
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
      {countdown ? (
        <span
          aria-hidden="true"
          className="text-disabled-light dark:text-disabled-dark pointer-events-none absolute top-1 right-1 text-xs leading-none"
        >
          {countdown}
        </span>
      ) : null}
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
  } = resolvePracticeButtonState({
    grammarReviewReadyAt,
    vocabularyReviewReadyAt,
    grammarReviewDueCount,
    vocabularyReviewDueCount,
    checkedAt,
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
        countdown={grammarReviewCountdown}
        disabled={grammarReviewDisabled}
        title={grammarReviewTitle}
        to={ROUTES.grammarPractice}
      >
        {TEXTS.grammarReviewButton}
      </ReviewPracticeButton>
      <ReviewPracticeButton
        dueCount={vocabularyReviewDueCount}
        countdown={vocabularyReviewCountdown}
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
