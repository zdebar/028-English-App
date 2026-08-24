import Topic from '@/database/models/topics';
import { TEXTS } from '@/locales/cs';
import type { TopicType } from '@/types/generic.types';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { useCallback, useEffect } from 'react';
import { useToastStore } from '../toast/use-toast-store';
import { reportError } from '../logging/monitoring-handler';
import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import { DataNavigationButton } from '@/routing/data-navigation';
import { topicDetailDescriptor } from '@/routing/route-data';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { useRouteClose } from '@/routing/use-route-close';

export default function TopicsOverview({
  initialTopics,
}: Readonly<{ initialTopics?: TopicType[] }>) {
  const closeRoute = useRouteClose(ROUTES.overviews);
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  // Topics management
  const fetchTopics = useCallback(async (): Promise<TopicType[]> => {
    if (!userId) return [];
    return Topic.getStartedByUserId(userId);
  }, [userId]);

  const {
    data: topics,
    loading: topicsLoading,
    error: topicsError,
  } = useLiveQueryData<TopicType[]>(fetchTopics, {
    emptyData: [],
    initialData: initialTopics,
  });
  const hasTopics = topics.length > 0;

  useEffect(() => {
    if (!topicsError) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch topics overview', topicsError);
  }, [showToast, topicsError]);

  return (
    <OverviewCard buttonTitle={TEXTS.topicsOverview} onClose={closeRoute}>
      <DataState loading={topicsLoading} hasData={hasTopics} noDataMessage={TEXTS.noTopics}>
        <div className="flex flex-col gap-1 pt-1">
          {topics.map((topic) => (
            <DataNavigationButton
              key={topic.id}
              className="h-input flex w-full justify-start px-4 text-left"
              to={`${ROUTES.topics}/${topic.id}`}
              descriptor={userId ? topicDetailDescriptor(userId, topic.id) : undefined}
              title={topic.name}
            >
              <p className="overflow-hidden text-ellipsis whitespace-nowrap">{topic.name}</p>
            </DataNavigationButton>
          ))}
        </div>
      </DataState>
    </OverviewCard>
  );
}

