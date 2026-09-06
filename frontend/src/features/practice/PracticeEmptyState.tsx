import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import PracticeEndState from './PracticeEndState';

type PracticeEmptyStateProps = Readonly<{
  showTryAgainLater?: boolean;
}>;

export default function PracticeEmptyState({
  showTryAgainLater = true,
}: PracticeEmptyStateProps): JSX.Element {
  return (
    <PracticeEndState
      message={TEXTS.nothingToPractice}
      secondaryMessage={showTryAgainLater ? TEXTS.tryAgainLater : undefined}
    />
  );
}
