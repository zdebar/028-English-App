import { runProgressReset } from '@/features/practice/run-progress-reset';
import { sharedQueryKey } from '@/hooks/shared-query-store';
import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { getItemAudioSources } from '@/features/audio/audio.utils';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo } from 'react';
import Topic from '@/database/models/topics';
import { useNavigate, useParams } from 'react-router-dom';
import type { GroupType } from '@/types/table.types';
import { DataState } from '@/components/UI/DataState';
import AudioItemList from '@/components/UI/AudioItemList';
import HelpButton from '../help/HelpButton';
import OverviewCard from '@/components/UI/OverviewCard';
import VolumeSlider from '../audio/VolumeSlider';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { useRouteClose } from '@/routing/use-route-close';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';

export default function TopicItemsOverview({
  initialTopic,
  initialItems = [],
}: Readonly<{ initialTopic?: GroupType | null; initialItems?: UserItemLocal[] }>) {
  const navigate = useNavigate();
  const closeRoute = useRouteClose(ROUTES.topics);
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  // -- Topic management --
  const { topicId: topicIdText } = useParams<{ topicId: string }>();
  const parsedTopicId = Number(topicIdText);
  const topicId =
    initialTopic?.id ??
    (Number.isSafeInteger(parsedTopicId) && parsedTopicId > 0 ? parsedTopicId : null);

  useEffect(() => {
    if (topicId) return;
    void navigate(ROUTES.topics);
  }, [navigate, topicId]);

  const fetchTopic = useCallback(async (): Promise<GroupType | null> => {
    if (!userId || !topicId) return null;
    return Topic.getById(userId, topicId);
  }, [topicId, userId]);

  const {
    data: topic,
    loading: topicLoading,
    error: topicError,
  } = useLiveQueryData<GroupType | null>(fetchTopic, {
    emptyData: null,
    initialData: initialTopic,
    sharedKey: sharedQueryKey(userId, `topic:${topicId}`),
  });

  // -- Items management --
  const fetchTopicItems = useCallback(async () => {
    if (!userId || !topicId) return [];
    return UserItem.getInitiatedByTopicId(userId, topicId);
  }, [topicId, userId]);

  const {
    data: items,
    loading: itemsLoading,
    error: itemsError,
  } = useLiveQueryData<UserItemLocal[]>(fetchTopicItems, {
    emptyData: [],
    initialData: initialItems,
    sharedKey: sharedQueryKey(userId, `topic-items:${topicId}`),
  });
  const hasItems = items.length > 0;

  useEffect(() => {
    if (topicLoading || !userId || !topicId || topic !== null) return;
    void navigate(ROUTES.topics, { replace: true });
  }, [navigate, topic, topicId, topicLoading, userId]);

  useQueryErrorToast(topicError, 'Failed to fetch topic details');
  useQueryErrorToast(itemsError, 'Failed to fetch topic items');

  const itemAudios = useMemo(() => getItemAudioSources(items), [items]);

  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(itemAudios);

  // -- Handlers --
  const handleReset = useCallback(async () => {
    if (!userId || !topicId) return;
    await runProgressReset(userId, () => UserItem.resetItemsByTopicId(userId, topicId), {
      successLog: (resetCount) => `Reset ${resetCount} items in topic ${topicId}`,
      errorContext: TEXTS.resetProgressErrorToast,
    });
  }, [topicId, userId]);

  const resetHandler = topic ? handleReset : undefined;

  return (
    <OverviewCard
      buttonTitle={topic?.name}
      modalTitle={TEXTS.resetTopicTitle}
      modalText={TEXTS.resetTopicDescription}
      loading={topicLoading}
      handleReset={resetHandler}
      onClose={closeRoute}
      className="bottom-controls-clearance"
    >
      <DataState loading={itemsLoading} hasData={hasItems} noDataMessage={TEXTS.noTopicItems}>
        <AudioItemList
          items={items}
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
        />
      </DataState>
      <div className="pos-bottom-left-control">
        <VolumeSlider />
      </div>
      {items && items.length > 0 && (
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      )}
    </OverviewCard>
  );
}
