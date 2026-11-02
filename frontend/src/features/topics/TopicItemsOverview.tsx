import { runProgressReset } from '@/features/practice/run-progress-reset';
import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { getItemAudioSources } from '@/features/audio/audio.utils';
import { TEXTS } from '@/locales/cs';
import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataState } from '@/components/UI/DataState';
import AudioItemList from '@/components/UI/AudioItemList';
import HelpButton from '../help/HelpButton';
import OverviewCard from '@/components/UI/OverviewCard';
import { AudioItemListControls } from '@/features/audio/AudioItemListControls';
import { useRouteClose } from '@/routing/use-route-close';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useDataManager } from '@/database/state/data-store';
import { selectTopicDetail } from '@/database/state/data-selectors';

export default function TopicItemsOverview() {
  const navigate = useNavigate();
  const closeRoute = useRouteClose(ROUTES.topics);
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const dataState = useDataManager((state) => state);
  // -- Topic management --
  const { topicId: topicIdText } = useParams<{ topicId: string }>();
  const parsedTopicId = Number(topicIdText);
  const topicId = Number.isSafeInteger(parsedTopicId) && parsedTopicId > 0 ? parsedTopicId : null;

  useEffect(() => {
    if (topicId) return;
    void navigate(ROUTES.topics);
  }, [navigate, topicId]);

  const topicData = userId && topicId ? selectTopicDetail(dataState, userId, topicId) : { topic: null, items: [] };
  const topic = topicData.topic;
  const items = topicData.items;
  const topicLoading = isDataLoading(userId, dataState.userId, dataState.status);
  const topicError = getDataError(userId, dataState.userId, dataState.status, dataState.error);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (topicLoading || !userId || !topicId || topic !== null) return;
    void navigate(ROUTES.topics, { replace: true });
  }, [navigate, topic, topicId, topicLoading, userId]);

  useQueryErrorToast(topicError, 'Failed to load topic data');

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
      <DataState loading={topicLoading} hasData={hasItems} noDataMessage={TEXTS.noTopicItems}>
        <AudioItemList
          items={items}
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
        />
      </DataState>
      <AudioItemListControls items={items} />
      {items.length > 0 && (
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      )}
    </OverviewCard>
  );
}

function isDataLoading(
  userId: string | null,
  dataUserId: string | null,
  status: 'idle' | 'loading' | 'ready' | 'error',
): boolean {
  return Boolean(userId) && (dataUserId !== userId || status === 'idle' || status === 'loading');
}

function getDataError(
  userId: string | null,
  dataUserId: string | null,
  status: 'idle' | 'loading' | 'ready' | 'error',
  error: Error | null,
): Error | null {
  return dataUserId === userId && status === 'error' ? error : null;
}
