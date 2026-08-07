import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { PrefetchButton } from '@/routing/prefetch-navigation';
import { pronunciationPracticeDescriptor } from '@/routing/route-data';
import { usePracticeAvailabilityStore } from '@/features/practice/use-practice-availability-store';

export default function PronunciationPracticeButton({
  userId,
}: Readonly<{ userId: string }>) {
  const selectedCount = usePracticeAvailabilityStore((state) => state.pronunciationCount);
  const loading = usePracticeAvailabilityStore((state) => state.pronunciationLoading);
  const error = usePracticeAvailabilityStore((state) => state.pronunciationError);
  const hasSelection = selectedCount > 0;
  const disabled = Boolean(error) || (!loading && !hasSelection);
  let title: string = TEXTS.loadingMessage;
  if (error) {
    title = TEXTS.loadingError;
  } else if (!loading) {
    title = hasSelection
      ? TEXTS.pronunciationPracticeTooltip
      : TEXTS.noPronunciationPracticeSelection;
  }

  return (
    <PrefetchButton
      to={ROUTES.pronunciationPractice}
      descriptor={pronunciationPracticeDescriptor(userId)}
      className="h-button max-h-button w-full px-4"
      disabled={disabled}
      title={title}
    >
      {TEXTS.pronunciationPracticeButton}
    </PrefetchButton>
  );
}
