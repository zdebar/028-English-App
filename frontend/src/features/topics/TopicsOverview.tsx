import { getOverviewQuery, overviewQueryKey } from '@/hooks/overview-query-store';
import { TEXTS } from '@/locales/cs';
import type { GroupType } from '@/types/table.types';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { useCallback } from 'react';
import { DataState } from '@/components/UI/DataState';
import StackedList from '@/components/UI/StackedList';
import OverviewCard from '@/components/UI/OverviewCard';
import { NavigationButton } from '@/routing/data-navigation';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { useRouteClose } from '@/routing/use-route-close';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';

export default function TopicsOverview({
  initialTopics,
}: Readonly<{ initialTopics?: GroupType[] }>) {
  const closeRoute = useRouteClose(ROUTES.overviews);
  const userId = useAuthStore((state) => state.userId);

  // Topics management
  const fetchTopics = useCallback(async (): Promise<GroupType[]> => {
    if (!userId) return [];
    return getOverviewQuery(userId, 'topics')();
  }, [userId]);

  const {
    data: topics,
    loading: topicsLoading,
    error: topicsError,
  } = useLiveQueryData<GroupType[]>(fetchTopics, {
    emptyData: [],
    initialData: initialTopics,
    sharedKey: userId ? overviewQueryKey(userId, 'topics') : undefined,
  });
  const hasTopics = topics.length > 0;

  useQueryErrorToast(topicsError, 'Failed to fetch topics overview');

  return (
    <OverviewCard buttonTitle={TEXTS.topicsOverview} onClose={closeRoute}>
      <DataState loading={topicsLoading} hasData={hasTopics} noDataMessage={TEXTS.noTopics}>
        <StackedList>
          {topics.map((topic) => (
            <NavigationButton
              key={topic.id}
              className="h-input flex w-full justify-start px-4 text-left"
              to={`${ROUTES.topics}/${topic.id}`}
              title={topic.name}
            >
              <p className="overflow-hidden text-ellipsis whitespace-nowrap">{topic.name}</p>
            </NavigationButton>
          ))}
        </StackedList>
      </DataState>
    </OverviewCard>
  );
}

