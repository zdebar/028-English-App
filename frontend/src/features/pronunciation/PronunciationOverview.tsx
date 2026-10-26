import { DataState } from '@/components/UI/DataState';
import StackedList from '@/components/UI/StackedList';
import OverviewCard from '@/components/UI/OverviewCard';
import { ROUTES } from '@/config/routes.config';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { NavigationButton } from '@/routing/data-navigation';
import { usePronunciationGroupsStore } from './use-pronunciation-groups-store';
import { useRouteClose } from '@/routing/use-route-close';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePronunciationGroupsStoreSync } from './use-pronunciation-groups-store-sync';

export default function PronunciationOverview() {
  usePronunciationGroupsStoreSync(useAuthStore((state) => state.userId));
  const closeRoute = useRouteClose(ROUTES.overviews);
  const data = usePronunciationGroupsStore((state) => state.groups);
  const loading = usePronunciationGroupsStore((state) => state.loading);
  const error = usePronunciationGroupsStore((state) => state.error);
  const hasData = data.length > 0;

  useQueryErrorToast(error, 'Failed to fetch pronunciation overview');

  return (
    <OverviewCard
      buttonTitle={TEXTS.pronunciationSettings}
      onClose={closeRoute}
      className={hasData ? 'bottom-controls-clearance' : ''}
    >
      <DataState loading={loading} hasData={hasData} noDataMessage={TEXTS.noPronunciationGroups}>
        <StackedList>
          {data.map((group) => (
            <NavigationButton
              key={group.id}
              className="h-input w-full grow-0 px-4"
              title={group.name}
              to={ROUTES.pronunciationGroup.replace(':groupId', String(group.id))}
            >
              <p className="w-full overflow-hidden text-left font-bold text-ellipsis whitespace-nowrap">
                {group.name}
              </p>
            </NavigationButton>
          ))}
        </StackedList>
        <HelpText className="top-20 right-2">{TEXTS.pronunciationStartedHelp}</HelpText>
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      </DataState>
    </OverviewCard>
  );
}
