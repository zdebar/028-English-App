import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { memo, type JSX } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import StyledButton from '@/components/UI/buttons/StyledButton';
import ChevronRightIcon from '@/components/UI/icons/ChevronRightIcon';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useCurrentUserDataPackage } from '@/database/state/use-current-user-data-package';
import type { PracticeAvailabilityData } from '@/database/state/data-types';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';

const REVIEW_SECTION_LABEL_CLASS_NAME =
  'h-input border-disabled-light text-light dark:border-disabled-dark dark:text-dark flex w-full items-center justify-start border border-dashed px-4 text-left font-normal';

type ReviewSectionProps = Readonly<{ reviewKind: ReviewKind }>;

const NewPracticeButton = memo(function NewPracticeButton(): JSX.Element {
  const { availability, loading, error } = usePracticeStatus();
  const available = availability?.initialTrainingAvailable ?? false;
  const label = availability?.initialTrainingStarted ? TEXTS.completeLesson : TEXTS.newButton;
  const disabled = selectNewDisabled(availability, loading, error);
  const title = resolveButtonTitle(loading, error, disabled);

  if (!available && !loading) {
    return (
      <StyledButton className="h-button max-h-button w-full px-4" disabled title={title}>
        <PracticeButtonLabel>{label}</PracticeButtonLabel>
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
      <PracticeButtonLabel>{label}</PracticeButtonLabel>
    </NavigationButton>
  );
});

type ReviewCountBadgeProps = Readonly<{
  dueCount: number;
}>;

const ReviewCountBadge = memo(function ReviewCountBadge({
  dueCount,
}: ReviewCountBadgeProps): JSX.Element {
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
  direction: ReviewDirection;
}>;

const ReviewPracticeButton = memo(function ReviewPracticeButton({
  reviewKind,
  direction,
}: ReviewPracticeButtonProps): JSX.Element {
  const { availability, loading, error } = usePracticeStatus();
  const dueCount = selectReviewDueCount(availability, reviewKind, direction);
  const disabled = selectReviewDisabled(availability, loading, error, reviewKind, direction);
  const title = resolveButtonTitle(loading, error, disabled);
  const to = `${getPracticeRoute(reviewKind)}?direction=${direction}`;

  return (
    <NavigationButton
      to={to}
      className="h-button max-h-button relative w-full min-w-0 px-2 text-sm"
      disabled={disabled}
      title={title}
      aria-label={getReviewButtonAccessibleLabel(reviewKind, direction, dueCount)}
    >
      <ReviewCountBadge dueCount={dueCount} />
      <ReviewDirectionLabel direction={direction} />
    </NavigationButton>
  );
});

const PronunciationPracticeButton = memo(function PronunciationPracticeButton(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const { data, loading, error } = useCurrentUserDataPackage(userId, { kind: 'home' });
  const hasActiveGroup = data?.hasActivePronunciationGroups === true;
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
      <PronunciationPracticeButton />
      <NewPracticeButton />
      <ReviewPracticeSection reviewKind="vocabulary" />
      <ReviewPracticeSection reviewKind="grammar" />
    </div>
  );
}

function ReviewPracticeSection({ reviewKind }: ReviewSectionProps): JSX.Element {
  const title =
    reviewKind === 'vocabulary' ? TEXTS.vocabularyReviewButton : TEXTS.grammarReviewButton;

  return (
    <section aria-label={title} className="flex flex-col gap-1">
      <div className={REVIEW_SECTION_LABEL_CLASS_NAME}>
        <PracticeButtonLabel>{title}</PracticeButtonLabel>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <ReviewPracticeButton reviewKind={reviewKind} direction="cz_to_en" />
        <ReviewPracticeButton reviewKind={reviewKind} direction="en_to_cz" />
      </div>
    </section>
  );
}

function ReviewDirectionLabel({
  direction,
}: Readonly<{ direction: ReviewDirection }>): JSX.Element {
  const [sourceLanguage, targetLanguage] = getDirectionLanguages(direction);

  return (
    <span className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
      <span className="overflow-hidden text-right text-ellipsis whitespace-nowrap">
        {sourceLanguage}
      </span>
      <ChevronRightIcon className="mx-1 shrink-0" size={16} />
      <span className="overflow-hidden text-left text-ellipsis whitespace-nowrap">
        {targetLanguage}
      </span>
    </span>
  );
}

function PracticeButtonLabel({ children }: Readonly<{ children: string }>): JSX.Element {
  return (
    <span className="grid w-full grid-cols-[1fr_max-content_1fr]">
      <span aria-hidden="true" className="invisible col-start-2 row-start-1 whitespace-nowrap">
        {TEXTS.grammarReviewButton}
      </span>
      <span className="col-start-2 row-start-1 w-0 min-w-0 justify-self-start overflow-visible text-left whitespace-nowrap">
        {children}
      </span>
    </span>
  );
}

function usePracticeStatus(): Readonly<{
  availability: PracticeAvailabilityData | null;
  loading: boolean;
  error: Error | null;
}> {
  const userId = useAuthStore((state) => state.userId);
  const { data, loading, error } = useCurrentUserDataPackage(userId, { kind: 'home' });
  return {
    availability: data?.practiceAvailability ?? null,
    loading,
    error,
  };
}

function selectReviewDueCount(
  state: PracticeAvailabilityData | null,
  reviewKind: ReviewKind,
  direction: ReviewDirection,
): number {
  if (!state) return 0;
  return state.reviewDueCounts[reviewKind][direction];
}

function selectReviewDisabled(
  state: PracticeAvailabilityData | null,
  loading: boolean,
  error: Error | null,
  reviewKind: ReviewKind,
  direction: ReviewDirection,
): boolean {
  if (loading || error || !state) return true;
  return selectReviewDueCount(state, reviewKind, direction) === 0;
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
  state: PracticeAvailabilityData | null,
  loading: boolean,
  error: Error | null,
): boolean {
  return loading || error !== null || !state?.initialTrainingAvailable;
}

function getPracticeRoute(reviewKind: ReviewKind): string {
  return reviewKind === 'vocabulary' ? ROUTES.vocabularyPractice : ROUTES.grammarPractice;
}

function getDirectionLanguages(direction: ReviewDirection): readonly [string, string] {
  if (direction === 'cz_to_en') return ['CZ', 'EN'];
  return ['EN', 'CZ'];
}

function getReviewButtonAccessibleLabel(
  reviewKind: ReviewKind,
  direction: ReviewDirection,
  dueCount: number,
): string {
  const kindLabel =
    reviewKind === 'vocabulary' ? TEXTS.vocabularyReviewButton : TEXTS.grammarReviewButton;
  const directionLabel = direction === 'cz_to_en' ? TEXTS.directionCzToEn : TEXTS.directionEnToCz;
  return `${kindLabel}: ${directionLabel}. ${TEXTS.availableItems}: ${dueCount}`;
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
