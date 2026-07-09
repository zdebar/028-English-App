import InfoNotification from '@/components/UI/InfoNotification';
import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

export default function PracticeEmptyState(): JSX.Element {
  return (
    <div className="card-width w-full landscape:my-auto">
      <InfoNotification>{TEXTS.nothingToPractice}</InfoNotification>
      <InfoNotification className="mb-4">{TEXTS.tryAgainLater}</InfoNotification>
      <ReturnHomeButton />
    </div>
  );
}
