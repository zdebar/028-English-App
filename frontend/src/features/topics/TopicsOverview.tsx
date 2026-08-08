import UserBlock from '@/database/models/user-blocks';
import { useNavigate } from 'react-router-dom';
import { TEXTS } from '@/locales/cs';
import type { UserBlockType } from '@/types/generic.types';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { useCallback, useEffect } from 'react';
import { useToastStore } from '../toast/use-toast-store';
import { reportError } from '../logging/monitoring-handler';
import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import { PrefetchButton } from '@/routing/prefetch-navigation';
import { topicDetailDescriptor } from '@/routing/route-data';
import { useLiveQueryData } from '@/hooks/use-live-query-data';

export default function TopicsOverview({
  initialTopics,
}: Readonly<{ initialTopics?: UserBlockType[] }>) {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  // Topics management
  const fetchTopics = useCallback(async (): Promise<UserBlockType[]> => {
    if (!userId) return [];
    return UserBlock.getStartedTopicsByUserId(userId);
  }, [userId]);

  const {
    data: topics,
    loading: topicsLoading,
    error: topicsError,
  } = useLiveQueryData<UserBlockType[]>(fetchTopics, {
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
    <OverviewCard buttonTitle={TEXTS.topicsOverview} onClose={() => navigate(ROUTES.overviews)}>
      <DataState loading={topicsLoading} hasData={hasTopics} noDataMessage={TEXTS.noTopics}>
        {topics.map((topic) => (
          <PrefetchButton
            key={topic.block_id}
            className="h-input flex w-full justify-start px-4 text-left"
            to={`${ROUTES.topics}/${topic.block_id}`}
            descriptor={userId ? topicDetailDescriptor(userId, topic.block_id) : undefined}
            title={topic.name}
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">{topic.name}</p>
          </PrefetchButton>
        ))}
      </DataState>
    </OverviewCard>
  );
}

