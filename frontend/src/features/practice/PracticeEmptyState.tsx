import InfoNotification from '@/components/UI/InfoNotification';
import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

export default function PracticeEmptyState(): JSX.Element {
  return (
    <div className="w-full">
      <InfoNotification>{TEXTS.nothingToPractice}</InfoNotification>
      <InfoNotification>{TEXTS.tryAgainLater}</InfoNotification>
      <ReturnHomeButton />
    </div>
  );
}
