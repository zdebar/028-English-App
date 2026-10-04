import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { memo, type JSX } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import {
  usePracticeAvailabilityStore,
  type PracticeAvailabilityState,
} from './use-practice-availability-store';
import StyledButton from '@/components/UI/buttons/StyledButton';
import config from '@/config/config';
import {
  hasExceededReviewLimit,
  isReviewThresholdReached,
} from './practice-availability';

type ReviewKind = 'grammar' | 'vocabulary';

function isActiveNew(activeSession: PracticeAvailabilityState['activeSession']): boolean {
  return activeSession?.mode === 'new';
}

function selectReviewDueCount(
  state: PracticeAvailabilityState,
  reviewKind: ReviewKind,
): number {
  if (reviewKind === 'grammar') return state.grammarReviewDueCount;
  return state.vocabularyReviewDueCount;
}

function selectReviewReadyAt(
  state: PracticeAvailabilityState,
  reviewKind: ReviewKind,
): string | null {
  if (reviewKind === 'grammar') return state.grammarReviewReadyAt;
  return state.vocabularyReviewReadyAt;
}

function selectReviewLimit(reviewKind: ReviewKind): number {
  if (reviewKind === 'grammar') return config.practice.grammarReviewLimitSize;
  return config.practice.vocabularyReviewLimitSize;
}

function selectReviewDisabled(
  state: PracticeAvailabilityState,
  reviewKind: ReviewKind,
): boolean {
  if (state.practiceLoading || state.practiceError) return true;

  const dueCount = selectReviewDueCount(state, reviewKind);
  const readyAt = selectReviewReadyAt(state, reviewKind);
  const limit = selectReviewLimit(reviewKind);
  return !isReviewThresholdReached(dueCount, readyAt, limit);
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

function selectReviewTitle(
  state: PracticeAvailabilityState,
  reviewKind: ReviewKind,
): string | undefined {
  const disabled = selectReviewDisabled(state, reviewKind);
  return resolveButtonTitle(state.practiceLoading, state.practiceError, disabled);
}

function selectNewAvailable(state: PracticeAvailabilityState): boolean {
  if (isActiveNew(state.activeSession)) return true;
  return state.initialTrainingAvailable;
}

function selectNewDisabled(state: PracticeAvailabilityState): boolean {
  if (state.practiceLoading || state.practiceError) return true;
  if (!selectNewAvailable(state)) return true;
  if (isActiveNew(state.activeSession)) return false;
  return hasExceededReviewLimit(state);
}

function selectNewTitle(state: PracticeAvailabilityState): string | undefined {
  return resolveButtonTitle(
    state.practiceLoading,
    state.practiceError,
    selectNewDisabled(state),
  );
}

const NewPracticeButton = memo(function NewPracticeButton(): JSX.Element {
  const available = usePracticeAvailabilityStore(selectNewAvailable);
  const disabled = usePracticeAvailabilityStore(selectNewDisabled);
  const loading = usePracticeAvailabilityStore((state) => state.practiceLoading);
  const title = usePracticeAvailabilityStore(selectNewTitle);

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
});

type ReviewCountBadgeProps = Readonly<{
  reviewKind: ReviewKind;
}>;

const ReviewCountBadge = memo(function ReviewCountBadge({
  reviewKind,
}: ReviewCountBadgeProps): JSX.Element | null {
  const dueCount = usePracticeAvailabilityStore((state) =>
    selectReviewDueCount(state, reviewKind),
  );

  if (dueCount <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className="bg-light font-body text-dark dark:bg-dark dark:text-light pointer-events-none absolute top-1 right-1 z-10 rounded-full py-0.5 pr-1.5 pl-2 text-center text-xs leading-none"
    >
      {dueCount}
    </span>
  );
});

type ReviewPracticeButtonProps = Readonly<{
  reviewKind: ReviewKind;
  to: string;
  labelClassName?: string;
  children: string;
}>;

const ReviewPracticeButton = memo(function ReviewPracticeButton({
  reviewKind,
  to,
  labelClassName = '',
  children,
}: ReviewPracticeButtonProps): JSX.Element {
  const disabled = usePracticeAvailabilityStore((state) =>
    selectReviewDisabled(state, reviewKind),
  );
  const title = usePracticeAvailabilityStore((state) =>
    selectReviewTitle(state, reviewKind),
  );

  return (
    <NavigationButton
      to={to}
      className="h-button max-h-button relative w-full px-4"
      disabled={disabled}
      title={title}
    >
      <ReviewCountBadge reviewKind={reviewKind} />
      <span className={`inline-block ${labelClassName}`}>{children}</span>
    </NavigationButton>
  );
});

export default function PracticeButtons(): JSX.Element {
  return (
    <div className="flex w-full flex-col gap-1">
      <NewPracticeButton />
      <ReviewPracticeButton reviewKind="grammar" to={ROUTES.grammarPractice}>
        {TEXTS.grammarReviewButton}
      </ReviewPracticeButton>
      <ReviewPracticeButton
        reviewKind="vocabulary"
        labelClassName="-translate-x-1.5"
        to={ROUTES.vocabularyPractice}
      >
        {TEXTS.vocabularyReviewButton}
      </ReviewPracticeButton>
    </div>
  );
}
