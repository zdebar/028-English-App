import InfoNotification from '@/components/UI/InfoNotification';
import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

type PracticeEmptyStateProps = Readonly<{
  showTryAgainLater?: boolean;
}>;

export default function PracticeEmptyState({
  showTryAgainLater = true,
}: PracticeEmptyStateProps): JSX.Element {
  return (
    <div className="card-width w-full pt-24">
      <InfoNotification>{TEXTS.nothingToPractice}</InfoNotification>
      {showTryAgainLater && (
        <InfoNotification className="mb-4">{TEXTS.tryAgainLater}</InfoNotification>
      )}
      <ReturnHomeButton />
    </div>
  );
}
