import OverviewCard from '@/components/UI/OverviewCard';
import { DataState } from '@/components/UI/DataState';
import StackedList from '@/components/UI/StackedList';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { getOverviewQuery, overviewQueryKey } from '@/hooks/overview-query-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { TEXTS } from '@/locales/cs';
import type { GroupType } from '@/types/table.types';
import { useCallback } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import { useRouteClose } from '@/routing/use-route-close';

export default function SoundsOverview({
  initialSounds,
}: Readonly<{ initialSounds?: GroupType[] }>) {
  const userId = useAuthStore((state) => state.userId);
  const closeRoute = useRouteClose(ROUTES.overviews);
  const fetchSounds = useCallback((): Promise<GroupType[]> => {
    if (!userId) return Promise.resolve([]);
    return getOverviewQuery(userId, 'sounds')();
  }, [userId]);
  const { data: sounds, loading, error } = useLiveQueryData<GroupType[]>(fetchSounds, {
    emptyData: [],
    initialData: initialSounds,
    sharedKey: userId ? overviewQueryKey(userId, 'sounds') : undefined,
  });

  useQueryErrorToast(error, 'Failed to fetch sound overview');

  return (
    <OverviewCard
      buttonTitle={TEXTS.soundsOverview}
      onClose={closeRoute}
      showResetAction={false}
      titleAlignment="center"
    >
      <DataState loading={loading} hasData={sounds.length > 0} noDataMessage={TEXTS.noSounds}>
        <StackedList>
          {sounds.map((sound) => (
            <NavigationButton
              key={sound.id}
              className="h-input flex w-full justify-center px-4 text-center"
              to={ROUTES.soundDetail.replace(':groupId', String(sound.id))}
              title={sound.name}
            >
              <p className="overflow-hidden text-ellipsis whitespace-nowrap">{sound.name}</p>
            </NavigationButton>
          ))}
        </StackedList>
      </DataState>
    </OverviewCard>
  );
}
