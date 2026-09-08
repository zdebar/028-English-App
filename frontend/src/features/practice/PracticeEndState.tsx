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
    <div className="card-width max-h-card h-full w-full grow">
      <div className="flex h-full grow flex-col justify-center">
        <Notification>{message}</Notification>
        {secondaryMessage && <div className={`mt-4 text-center text-lg`}>{secondaryMessage}</div>}
      </div>
      <ReturnHomeButton />
    </div>
  );
}
