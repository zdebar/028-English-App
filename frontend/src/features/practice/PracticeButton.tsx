import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState, type JSX } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';
import StyledButton from '@/components/UI/buttons/StyledButton';

type PracticeButtonState = Readonly<{
  reviewDisabled: boolean;
  newDisabled: boolean;
  newAvailable: boolean;
  reviewTitle: string | undefined;
  newTitle: string | undefined;
  reviewCountdown: string | null;
}>;

function isReviewAvailable(reviewReadyAt: string | null, checkedAt: number): boolean {
  if (reviewReadyAt === null) return false;
  return Date.parse(reviewReadyAt) <= Math.max(checkedAt, Date.now());
}

/** Re-renders once per second until the stored review deadline. */
function useReviewClock(reviewReadyAt: string | null): number {
  const [checkedAt, setCheckedAt] = useState(Date.now);
  useEffect(() => {
    if (!reviewReadyAt) return;
    const remaining = Date.parse(reviewReadyAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) return;
    const timeout = globalThis.setTimeout(() => setCheckedAt(Date.now()), Math.min(remaining, 1000));
    return () => globalThis.clearTimeout(timeout);
  }, [checkedAt, reviewReadyAt]);
  return checkedAt;
}

function isActiveReview(activeSession: { mode: 'review' | 'new' } | null): boolean {
  return activeSession?.mode === 'review';
}

function isActiveNew(activeSession: { mode: 'review' | 'new' } | null): boolean {
  return activeSession?.mode === 'new';
}

function isReviewButtonDisabled(
  error: Error | null,
  activeReview: boolean,
  reviewAvailable: boolean,
  loading: boolean,
): boolean {
  return [Boolean(error), loading, !activeReview && !reviewAvailable].some(Boolean);
}

function isNewButtonDisabled(
  error: Error | null,
  activeReview: boolean,
  reviewAvailable: boolean,
  newAvailable: boolean,
  loading: boolean,
): boolean {
  return [Boolean(error), loading, activeReview, reviewAvailable, !newAvailable].some(Boolean);
}

function resolvePracticeButtonState(
  reviewReadyAt: string | null,
  checkedAt: number,
  initialTrainingAvailable: boolean,
  activeSession: { mode: 'review' | 'new' } | null,
  loading: boolean,
  error: Error | null,
): PracticeButtonState {
  const activeReview = isActiveReview(activeSession);
  const activeNew = isActiveNew(activeSession);
  const reviewAvailable = isReviewAvailable(reviewReadyAt, checkedAt);
  const reviewDisabled = isReviewButtonDisabled(
    error,
    activeReview,
    reviewAvailable,
    loading,
  );
  const newAvailable = activeNew || (!reviewAvailable && initialTrainingAvailable);
  const newDisabled = isNewButtonDisabled(
    error,
    activeReview,
    reviewAvailable,
    newAvailable,
    loading,
  );

  return {
    reviewDisabled,
    newDisabled,
    newAvailable,
    reviewTitle: resolveButtonTitle(loading, error, reviewDisabled),
    newTitle: resolveButtonTitle(loading, error, newDisabled),
    reviewCountdown: resolveReviewCountdown(
      reviewReadyAt,
      checkedAt,
      reviewDisabled,
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

export default function PracticeButtons(): JSX.Element {
  const reviewReadyAt = usePracticeAvailabilityStore((state) => state.reviewReadyAt);
  const checkedAt = useReviewClock(reviewReadyAt);
  const initialTrainingAvailable = usePracticeAvailabilityStore(
    (state) => state.initialTrainingAvailable,
  );
  const activeSession = usePracticeAvailabilityStore((state) => state.activeSession);
  const loading = usePracticeAvailabilityStore((state) => state.practiceLoading);
  const error = usePracticeAvailabilityStore((state) => state.practiceError);
  const { reviewDisabled, newDisabled, newAvailable, reviewTitle, newTitle, reviewCountdown } =
    resolvePracticeButtonState(
      reviewReadyAt,
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
      <NavigationButton
        to={ROUTES.practice}
        className="relative h-button max-h-button w-full px-4"
        disabled={reviewDisabled}
        title={reviewTitle}
      >
        {reviewCountdown ? (
          <span
            aria-hidden="true"
            className="text-disabled-light dark:text-disabled-dark pointer-events-none absolute top-1 right-1 text-xs leading-none"
          >
            {reviewCountdown}
          </span>
        ) : null}
        {TEXTS.reviewButton}
      </NavigationButton>
    </div>
  );
}

function resolveReviewCountdown(
  reviewReadyAt: string | null,
  checkedAt: number,
  reviewDisabled: boolean,
  loading: boolean,
  error: Error | null,
): string | null {
  if (!reviewDisabled || loading || error) return null;
  return formatReviewCountdown(reviewReadyAt, checkedAt);
}

function formatReviewCountdown(reviewReadyAt: string | null, checkedAt: number): string | null {
  if (!reviewReadyAt) return null;
  const remainingSeconds = Math.ceil((Date.parse(reviewReadyAt) - checkedAt) / 1000);
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
