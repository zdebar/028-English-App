import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { DataNavigationButton } from '@/routing/data-navigation';
import { initialTrainingDescriptor, practiceDeckDescriptor } from '@/routing/route-data';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';
import StyledButton from '@/components/UI/buttons/StyledButton';

type PracticeButtonsProps = Readonly<{ userId: string }>;

type PracticeButtonState = Readonly<{
  reviewDisabled: boolean;
  newDisabled: boolean;
  newAvailable: boolean;
  reviewTitle: string | undefined;
  newTitle: string | undefined;
}>;

function isReviewAvailable(reviewReadyAt: string | null): boolean {
  if (reviewReadyAt === null) return false;
  return Date.parse(reviewReadyAt) <= Date.now();
}

function isActiveReview(activeSession: { mode: 'review' | 'new' } | null): boolean {
  return activeSession?.mode === 'review';
}

function isActiveNew(activeSession: { mode: 'review' | 'new' } | null): boolean {
  return activeSession?.mode === 'new';
}

function isReviewButtonDisabled(
  error: Error | null,
  activeNew: boolean,
  activeReview: boolean,
  reviewAvailable: boolean,
  loading: boolean,
): boolean {
  return [Boolean(error), activeNew, !loading && !activeReview && !reviewAvailable].some(Boolean);
}

function isNewButtonDisabled(
  error: Error | null,
  activeReview: boolean,
  activeNew: boolean,
  newAvailable: boolean,
  loading: boolean,
): boolean {
  return [Boolean(error), activeReview, !loading && !activeNew && !newAvailable].some(Boolean);
}

function resolvePracticeButtonState(
  reviewReadyAt: string | null,
  initialTrainingAvailable: boolean,
  activeSession: { mode: 'review' | 'new' } | null,
  loading: boolean,
  error: Error | null,
): PracticeButtonState {
  const activeReview = isActiveReview(activeSession);
  const activeNew = isActiveNew(activeSession);
  const reviewAvailable = isReviewAvailable(reviewReadyAt);
  const reviewDisabled = isReviewButtonDisabled(
    error,
    activeNew,
    activeReview,
    reviewAvailable,
    loading,
  );
  const newAvailable = activeNew || (!reviewAvailable && initialTrainingAvailable);
  const newDisabled = isNewButtonDisabled(error, activeReview, activeNew, newAvailable, loading);

  return {
    reviewDisabled,
    newDisabled,
    newAvailable,
    reviewTitle: resolveButtonTitle(loading, error, reviewDisabled),
    newTitle: resolveButtonTitle(loading, error, newDisabled),
  };
}

function NewPracticeButton({
  userId,
  available,
  disabled,
  loading,
  title,
}: Readonly<{
  userId: string;
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
    <DataNavigationButton
      to={ROUTES.initialTraining}
      descriptor={initialTrainingDescriptor(userId)}
      className="h-button max-h-button w-full px-4"
      disabled={disabled}
      title={title}
    >
      {TEXTS.newButton}
    </DataNavigationButton>
  );
}

export default function PracticeButtons({ userId }: PracticeButtonsProps): JSX.Element {
  const reviewReadyAt = usePracticeAvailabilityStore((state) => state.reviewReadyAt);
  const initialTrainingAvailable = usePracticeAvailabilityStore(
    (state) => state.initialTrainingAvailable,
  );
  const activeSession = usePracticeAvailabilityStore((state) => state.activeSession);
  const loading = usePracticeAvailabilityStore((state) => state.practiceLoading);
  const error = usePracticeAvailabilityStore((state) => state.practiceError);
  const { reviewDisabled, newDisabled, newAvailable, reviewTitle, newTitle } =
    resolvePracticeButtonState(
      reviewReadyAt,
      initialTrainingAvailable,
      activeSession,
      loading,
      error,
    );

  return (
    <div className="flex w-full flex-col gap-1">
      <NewPracticeButton
        userId={userId}
        available={newAvailable}
        disabled={newDisabled}
        loading={loading}
        title={newTitle}
      />
      <DataNavigationButton
        to={ROUTES.practice}
        descriptor={practiceDeckDescriptor(userId)}
        className="h-button max-h-button w-full px-4"
        disabled={reviewDisabled}
        title={reviewTitle}
      >
        {TEXTS.reviewButton}
      </DataNavigationButton>
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
