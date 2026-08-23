import Notification from '@/components/UI/Notification';
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
      <Notification>{TEXTS.nothingToPractice}</Notification>
      {showTryAgainLater && (
        <Notification className="mb-4">{TEXTS.tryAgainLater}</Notification>
      )}
      <ReturnHomeButton />
    </div>
  );
}
