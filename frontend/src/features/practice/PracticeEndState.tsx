import Notification from '@/components/UI/Notification';
import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';
import type { JSX } from 'react';

type PracticeEndStateProps = Readonly<{
  message: string;
  secondaryMessage?: string;
}>;

/** Displays a practice end message and an explicit action to return home. */
export default function PracticeEndState({
  message,
  secondaryMessage,
}: PracticeEndStateProps): JSX.Element {
  return (
    <div className="card-width w-full pt-24">
      <Notification>{message}</Notification>
      {secondaryMessage && <Notification className="mb-4">{secondaryMessage}</Notification>}
      <ReturnHomeButton />
    </div>
  );
}
