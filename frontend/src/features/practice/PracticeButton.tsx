import config from '@/config/config';
import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { PrefetchButton } from '@/routing/prefetch-navigation';
import { practiceDeckDescriptor } from '@/routing/route-data';
import { usePracticeAvailabilityStore } from './use-practice-availability-store';

type PracticeButtonProps = Readonly<{ userId: string }>;

function ReadyPracticeBadge({ count }: Readonly<{ count: number }>): JSX.Element | null {
  if (count <= 0) return null;
  return (
    <span className="bg-button-hover text-light absolute top-1 right-2 min-w-5 rounded-full px-2 text-xs">
      {count}
    </span>
  );
}

export default function PracticeButton({ userId }: PracticeButtonProps): JSX.Element {
  const badgeCap = config.practice.readyPracticeBadgeCap;
  const readyCount = usePracticeAvailabilityStore((state) => state.readyCount);
  const loading = usePracticeAvailabilityStore((state) => state.readyLoading);
  const error = usePracticeAvailabilityStore((state) => state.readyError);
  const disabled = Boolean(error) || (!loading && readyCount === 0);
  let title: string | undefined;
  if (loading) title = TEXTS.loadingMessage;
  if (error) title = TEXTS.loadingError;
  if (!loading && !error && readyCount === 0) title = TEXTS.nothingToPractice;

  return (
    <PrefetchButton
      to={ROUTES.practice}
      descriptor={practiceDeckDescriptor(userId)}
      className="h-button max-h-button relative w-full px-4"
      disabled={disabled}
      title={title}
    >
      {TEXTS.practiceButton}
      {!loading && readyCount < badgeCap && <ReadyPracticeBadge count={readyCount} />}
    </PrefetchButton>
  );
}
