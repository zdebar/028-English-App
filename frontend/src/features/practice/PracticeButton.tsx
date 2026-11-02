import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { memo, type JSX } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import StyledButton from '@/components/UI/buttons/StyledButton';
import { hasReachedReviewLimit } from './practice-availability';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useDataManager } from '@/database/state/data-store';
import { selectPracticeAvailability, selectPronunciationOverview } from '@/database/state/data-selectors';
import type { PracticeAvailabilitySnapshot } from './practice-availability';

type ReviewKind = 'grammar' | 'vocabulary';

const NewPracticeButton = memo(function NewPracticeButton(): JSX.Element {
  const { availability, loading, error } = usePracticeStatus();
  const available = availability?.initialTrainingAvailable ?? false;
  const disabled = selectNewDisabled(availability, loading, error);
  const title = resolveButtonTitle(loading, error, disabled);

  if (!available && !loading) {
    return (
      <StyledButton
        className="h-button max-h-button w-full px-4"
        disabled
        title={title}
      >
        <PracticeButtonLabel>{TEXTS.newButton}</PracticeButtonLabel>
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
      <PracticeButtonLabel>{TEXTS.newButton}</PracticeButtonLabel>
    </NavigationButton>
  );
});

type ReviewCountBadgeProps = Readonly<{
  reviewKind: ReviewKind;
}>;

const ReviewCountBadge = memo(function ReviewCountBadge({
  reviewKind,
}: ReviewCountBadgeProps): JSX.Element | null {
  const { availability } = usePracticeStatus();
  const dueCount = selectReviewDueCount(availability, reviewKind);

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
  children: string;
}>;

const ReviewPracticeButton = memo(function ReviewPracticeButton({
  reviewKind,
  to,
  children,
}: ReviewPracticeButtonProps): JSX.Element {
  const { availability, loading, error } = usePracticeStatus();
  const disabled = selectReviewDisabled(availability, loading, error, reviewKind);
  const title = resolveButtonTitle(loading, error, disabled);

  return (
    <NavigationButton
      to={to}
      className="h-button max-h-button relative w-full px-4"
      disabled={disabled}
      title={title}
    >
      <ReviewCountBadge reviewKind={reviewKind} />
      <PracticeButtonLabel>{children}</PracticeButtonLabel>
    </NavigationButton>
  );
});

const PronunciationPracticeButton = memo(function PronunciationPracticeButton(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const dataState = useDataManager((state) => state);
  const dataReady = dataState.userId === userId && dataState.status === 'ready';
  const loading = Boolean(userId) && !dataReady && dataState.status !== 'error';
  const error = dataState.userId === userId && dataState.status === 'error' ? dataState.error : null;
  const hasActiveGroup = userId !== null && dataReady &&
    selectPronunciationOverview(dataState, userId).some((group) => group.isActive);
  const disabled = loading || error !== null || !hasActiveGroup;

  return (
    <NavigationButton
      to={ROUTES.pronunciationGroups}
      className="h-button max-h-button w-full px-4"
      disabled={disabled}
      title={getPronunciationPracticeButtonTitle(loading, error, hasActiveGroup)}
    >
      <PracticeButtonLabel>{TEXTS.pronunciationPractice}</PracticeButtonLabel>
    </NavigationButton>
  );
});

export default function PracticeButtons(): JSX.Element {
  return (
    <div className="flex w-full flex-col gap-1">
      <NewPracticeButton />
      <PronunciationPracticeButton />
      <ReviewPracticeButton reviewKind="grammar" to={ROUTES.grammarPractice}>
        {TEXTS.grammarReviewButton}
      </ReviewPracticeButton>
      <ReviewPracticeButton reviewKind="vocabulary" to={ROUTES.vocabularyPractice}>
        {TEXTS.vocabularyReviewButton}
      </ReviewPracticeButton>
    </div>
  );
}

function PracticeButtonLabel({ children }: Readonly<{ children: string }>): JSX.Element {
  return (
    <span className="grid w-full grid-cols-[1fr_max-content_1fr]">
      <span
        aria-hidden="true"
        className="invisible col-start-2 row-start-1 whitespace-nowrap"
      >
        {TEXTS.grammarReviewButton}
      </span>
      <span
        className="col-start-2 row-start-1 w-0 min-w-0 justify-self-start overflow-visible text-left whitespace-nowrap"
      >
        {children}
      </span>
    </span>
  );
}

function usePracticeStatus(): Readonly<{
  availability: PracticeAvailabilitySnapshot | null;
  loading: boolean;
  error: Error | null;
}> {
  const userId = useAuthStore((state) => state.userId);
  const state = useDataManager((current) => current);
  const isReady = state.userId === userId && state.status === 'ready';
  return {
    availability: userId && isReady ? selectPracticeAvailability(state, userId, new Date(state.nowIso)) : null,
    loading: Boolean(userId) && !isReady && state.status !== 'error',
    error: state.userId === userId && state.status === 'error' ? state.error : null,
  };
}

function selectReviewDueCount(
  state: PracticeAvailabilitySnapshot | null,
  reviewKind: ReviewKind,
): number {
  if (!state) return 0;
  if (reviewKind === 'grammar') return state.grammarReviewDueCount;
  return state.vocabularyReviewDueCount;
}

function selectReviewDisabled(
  state: PracticeAvailabilitySnapshot | null,
  loading: boolean,
  error: Error | null,
  reviewKind: ReviewKind,
): boolean {
  if (loading || error || !state) return true;
  return selectReviewDueCount(state, reviewKind) === 0;
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

function selectNewDisabled(
  state: PracticeAvailabilitySnapshot | null,
  loading: boolean,
  error: Error | null,
): boolean {
  if (loading || error || !state) return true;
  if (!state.initialTrainingAvailable) return true;
  if (state.continuingInitialLessonToday) return false;
  return hasReachedReviewLimit(state);
}

function getPronunciationPracticeButtonTitle(
  loading: boolean,
  error: Error | null,
  hasActiveGroup: boolean,
): string | undefined {
  if (loading) return TEXTS.loadingMessage;
  if (error) return TEXTS.loadingError;
  if (!hasActiveGroup) return TEXTS.noActivePronunciationGroups;
  return undefined;
}
