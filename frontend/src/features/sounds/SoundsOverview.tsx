import OverviewCard from '@/components/UI/OverviewCard';
import { DataState } from '@/components/UI/DataState';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { getOverviewQuery, overviewQueryKey } from '@/hooks/overview-query-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { TEXTS } from '@/locales/cs';
import type { GroupType } from '@/types/table.types';
import { useCallback, useEffect } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import { useRouteClose } from '@/routing/use-route-close';

export default function SoundsOverview({
  initialSounds,
}: Readonly<{ initialSounds?: GroupType[] }>) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
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

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch sound overview', error);
  }, [error, showToast]);

  return (
    <OverviewCard
      buttonTitle={TEXTS.soundsOverview}
      onClose={closeRoute}
      showResetAction={false}
      titleAlignment="center"
    >
      <DataState loading={loading} hasData={sounds.length > 0} noDataMessage={TEXTS.noSounds}>
        <div className="flex flex-col gap-1 pt-1">
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
        </div>
      </DataState>
    </OverviewCard>
  );
}
