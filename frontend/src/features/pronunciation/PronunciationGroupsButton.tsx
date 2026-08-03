import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { PrefetchButton } from '@/routing/prefetch-navigation';
import { usePronunciationGroupsStore } from './use-pronunciation-groups-store';

export default function PronunciationGroupsButton() {
  const groups = usePronunciationGroupsStore((state) => state.groups);
  const loading = usePronunciationGroupsStore((state) => state.loading);
  const error = usePronunciationGroupsStore((state) => state.error);
  const hasGroups = groups.length > 0;
  let title: string = TEXTS.loadingMessage;
  if (!loading) {
    title = error
      ? TEXTS.loadingError
      : hasGroups
        ? TEXTS.pronunciationGroupsTooltip
        : TEXTS.noPronunciationGroups;
  }

  return (
    <PrefetchButton
      to={ROUTES.pronunciationGroups}
      className="h-button max-h-button w-full px-4"
      disabled={!hasGroups}
      title={title}
    >
      {TEXTS.pronunciationGroupsButton}
    </PrefetchButton>
  );
}
