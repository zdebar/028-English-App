import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo } from 'react';
import Topic from '@/database/models/topics';
import { useNavigate, useParams } from 'react-router-dom';
import type { TopicType } from '@/types/generic.types';
import { DataState } from '@/components/UI/DataState';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import HelpButton from '../help/HelpButton';
import OverviewCard from '@/components/UI/OverviewCard';
import VolumeSlider from '../audio/VolumeSlider';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { useRouteClose } from '@/routing/use-route-close';

export default function TopicItemsOverview({
  initialTopic,
  initialItems = [],
}: Readonly<{ initialTopic?: TopicType | null; initialItems?: UserItemLocal[] }>) {
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
    navigate(ROUTES.topics);
  }, [navigate, topicId]);

  const fetchTopic = useCallback(async (): Promise<TopicType | null> => {
    if (!userId || !topicId) return null;
    return Topic.getById(topicId);
  }, [topicId, userId]);

  const {
    data: topic,
    loading: topicLoading,
    error: topicError,
  } = useLiveQueryData<TopicType | null>(fetchTopic, {
    emptyData: null,
    initialData: initialTopic,
  });

  // -- Items management --
  const fetchTopicItems = useCallback(async () => {
    if (!userId || !topicId) return [];
    return UserItem.getStartedByTopicId(userId, topicId);
  }, [topicId, userId]);

  const {
    data: items,
    loading: itemsLoading,
    error: itemsError,
  } = useLiveQueryData<UserItemLocal[]>(fetchTopicItems, {
    emptyData: [],
    initialData: initialItems,
  });
  const hasItems = items.length > 0;

  useEffect(() => {
    if (topicLoading || !userId || !topicId || topic !== null) return;
    navigate(ROUTES.topics, { replace: true });
  }, [navigate, topic, topicId, topicLoading, userId]);

  useEffect(() => {
    if (!topicError) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch topic details', topicError);
  }, [showToast, topicError]);

  useEffect(() => {
    if (!itemsError) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch topic items', itemsError);
  }, [itemsError, showToast]);

  const itemAudios = useMemo(
    () => items.map((item) => item.audio).filter((audio): audio is string => Boolean(audio)),
    [items],
  );

  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(itemAudios);

  // -- Handlers --
  const handleReset = useCallback(async () => {
    if (!userId || !topicId) return;
    try {
      const resetCount = await UserItem.resetItemsByTopicId(userId, topicId);
      invalidateRouteData(routeDataKey('topic-detail', userId, topicId));
      invalidateRouteData(routeDataKey('topics', userId));
      reportInfo(`Reset ${resetCount} items in topic ${topicId}`);
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      reportError(TEXTS.resetProgressErrorToast, error);
    }
  }, [showToast, topicId, userId]);

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
        <div className="mt-1 flex flex-col gap-1">
          {items.map((item) => (
            <BilingualItemButton
              key={item.item_id}
              item={item}
              onClick={async () => {
                if (!item.audio) return;
                const didPlay = await playAudio(item.audio);
                if (!didPlay) {
                  showToast(TEXTS.noAudio, 'error');
                }
              }}
              disabled={!item.audio || (!audioLoading && !isAudioReady(item.audio))}
            />
          ))}
        </div>
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
