import config from '@/config/config';
import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { DataNavigationButton } from '@/routing/data-navigation';
import { blockTrainingDescriptor, practiceDeckDescriptor } from '@/routing/route-data';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';
import StyledButton from '@/components/UI/buttons/StyledButton';

type PracticeButtonsProps = Readonly<{ userId: string }>;

export default function PracticeButtons({ userId }: PracticeButtonsProps): JSX.Element {
  const reviewCount = usePracticeAvailabilityStore((state) => state.reviewCount);
  const nextBlockId = usePracticeAvailabilityStore((state) => state.nextBlockId);
  const activeSession = usePracticeAvailabilityStore((state) => state.activeSession);
  const loading = usePracticeAvailabilityStore((state) => state.practiceLoading);
  const error = usePracticeAvailabilityStore((state) => state.practiceError);
  const activeReview = activeSession?.mode === 'review';
  const activeNew = activeSession?.mode === 'new';
  const reviewAvailable = reviewCount >= config.practice.reviewStarSize;
  const reviewDisabled = Boolean(error) || activeNew || (!loading && !activeReview && !reviewAvailable);
  const newBlockId = activeNew ? activeSession.block_id : nextBlockId;
  const newAvailable = !reviewAvailable && newBlockId != null;
  const newDisabled = Boolean(error) || activeReview || (!loading && !activeNew && !newAvailable);
  const reviewTitle = resolveButtonTitle(loading, error, reviewDisabled);
  const newTitle = resolveButtonTitle(loading, error, newDisabled);

  return (
    <div className="flex w-full gap-1">
      <DataNavigationButton
        to={ROUTES.practice}
        descriptor={practiceDeckDescriptor(userId)}
        className="h-button max-h-button w-full px-4"
        disabled={reviewDisabled}
        title={reviewTitle}
      >
        {TEXTS.reviewButton}
      </DataNavigationButton>
      {newBlockId == null ? (
        <StyledButton className="h-button max-h-button w-full px-4" disabled title={newTitle}>
          {TEXTS.newButton}
        </StyledButton>
      ) : (
        <DataNavigationButton
          to={`${ROUTES.practiceBlockTraining}?blockId=${newBlockId}`}
          descriptor={blockTrainingDescriptor(userId, newBlockId)}
          className="h-button max-h-button w-full px-4"
          disabled={newDisabled}
          title={newTitle}
        >
          {TEXTS.newButton}
        </DataNavigationButton>
      )}
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
