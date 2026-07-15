import UserBlock from '@/database/models/user-blocks';
import { useNavigate } from 'react-router-dom';
import { TEXTS } from '@/locales/cs';
import type { UserBlockType } from '@/types/generic.types';
import { useArray } from '@/hooks/use-array';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { useCallback, useEffect } from 'react';
import { useToastStore } from '../toast/use-toast-store';
import { reportError } from '../logging/monitoring-handler';
import { DataState } from '@/components/UI/DataState';
import { ListButton } from '@/components/UI/buttons/ListButton';
import OverviewCard from '@/components/UI/OverviewCard';

export default function TopicsOverview() {
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
    hasData: hasTopics,
    error: topicsError,
  } = useArray<UserBlockType>(fetchTopics);

  useEffect(() => {
    if (!topicsError) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch topics overview', topicsError);
  }, [showToast, topicsError]);

  return (
    <OverviewCard buttonTitle={TEXTS.topicsOverview} onClose={() => navigate(ROUTES.profile)}>
      <DataState loading={topicsLoading} hasData={hasTopics} noDataMessage={TEXTS.noTopics}>
        {topics.map((topic) => (
          <ListButton
            key={topic.block_id}
            className="h-input flex w-full justify-start px-4 text-left"
            onClick={() => navigate(`${ROUTES.topics}/${topic.block_id}`)}
            title={topic.name}
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">{topic.name}</p>
          </ListButton>
        ))}
      </DataState>
    </OverviewCard>
  );
}

