import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { useEffect } from 'react';
import { DataNavigationButton } from '@/routing/data-navigation';
import { pronunciationGroupDetailDescriptor } from '@/routing/route-data';
import { usePronunciationGroupsStore } from './use-pronunciation-groups-store';
import { useRouteClose } from '@/routing/use-route-close';

export default function PronunciationOverview() {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const closeRoute = useRouteClose(ROUTES.home);
  const data = usePronunciationGroupsStore((state) => state.groups);
  const loading = usePronunciationGroupsStore((state) => state.loading);
  const error = usePronunciationGroupsStore((state) => state.error);
  const hasData = data.length > 0;

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
  }, [error, showToast]);

  return (
    <OverviewCard
      buttonTitle={TEXTS.pronunciationGroups}
      onClose={closeRoute}
      className={hasData ? 'bottom-controls-clearance' : ''}
    >
      <DataState loading={loading} hasData={hasData} noDataMessage={TEXTS.noPronunciationGroups}>
        <div className="flex flex-col gap-1 pt-1">
          {data.map((group) => (
            <DataNavigationButton
              key={group.id}
              className="h-input preserve-disabled-text-color w-full grow-0 px-4"
              title={group.name}
              to={ROUTES.pronunciationGroup.replace(':groupId', String(group.id))}
              descriptor={userId ? pronunciationGroupDetailDescriptor(userId, group.id) : undefined}
            >
              <div className="flex w-full min-w-0 items-center justify-between gap-3">
                <div className="min-w-0 text-left">
                  <p className="overflow-hidden font-bold text-ellipsis whitespace-nowrap">
                    {group.name}
                  </p>
                  <p className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                    {group.examples.join(', ')}
                  </p>
                </div>
                <span className="shrink-0 text-sm">
                  {group.unlocked_count}/{group.total_count}
                </span>
              </div>
            </DataNavigationButton>
          ))}
        </div>
        <HelpText className="top-20 right-2">{TEXTS.pronunciationStartedHelp}</HelpText>
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      </DataState>
    </OverviewCard>
  );
}
