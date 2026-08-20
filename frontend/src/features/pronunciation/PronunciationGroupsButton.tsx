import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { DataNavigationButton } from '@/routing/data-navigation';
import { usePronunciationGroupsStore } from './use-pronunciation-groups-store';

export default function PronunciationGroupsButton() {
  const groups = usePronunciationGroupsStore((state) => state.groups);
  const loading = usePronunciationGroupsStore((state) => state.loading);
  const error = usePronunciationGroupsStore((state) => state.error);
  const hasGroups = groups.length > 0;
  const disabled = Boolean(error) || (!loading && !hasGroups);
  let title: string = TEXTS.loadingMessage;
  if (!loading) {
    if (error) {
      title = TEXTS.loadingError;
    } else if (hasGroups) {
      title = TEXTS.pronunciationGroupsTooltip;
    } else {
      title = TEXTS.noPronunciationGroups;
    }
  }

  return (
    <DataNavigationButton
      to={ROUTES.pronunciationGroups}
      className="h-button max-h-button w-full px-4"
      disabled={disabled}
      title={title}
    >
      {TEXTS.pronunciationGroupsButton}
    </DataNavigationButton>
  );
}
