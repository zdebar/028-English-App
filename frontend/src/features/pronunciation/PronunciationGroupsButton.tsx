import { ROUTES } from '@/config/routes.config';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import { TEXTS } from '@/locales/cs';
import { PrefetchButton } from '@/routing/prefetch-navigation';
import { pronunciationGroupsDescriptor } from '@/routing/route-data';
import { useLiveQuery } from 'dexie-react-hooks';

export default function PronunciationGroupsButton({
  userId,
}: Readonly<{ userId: string }>) {
  const groups = useLiveQuery(() => PronunciationGroup.getOverview(userId), [userId]);
  const loading = groups === undefined;
  const hasGroups = Boolean(groups?.length);
  let title: string = TEXTS.loadingMessage;
  if (!loading) {
    title = hasGroups ? TEXTS.pronunciationGroupsTooltip : TEXTS.noPronunciationGroups;
  }

  return (
    <PrefetchButton
      to={ROUTES.pronunciationGroups}
      descriptor={pronunciationGroupsDescriptor(userId)}
      className="h-button max-h-button w-full px-4"
      disabled={!hasGroups}
      title={title}
    >
      {TEXTS.pronunciationGroupsButton}
    </PrefetchButton>
  );
}
