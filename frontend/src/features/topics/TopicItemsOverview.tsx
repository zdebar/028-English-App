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
import { useCurrentUserDataPackage } from '@/database/state/use-current-user-data-package';
import type { AudioCacheSnapshot } from '@/features/audio/use-audio-loader';

export default function TopicItemsOverview({
  audioCacheSnapshot,
}: Readonly<{ audioCacheSnapshot?: AudioCacheSnapshot }>) {
  const navigate = useNavigate();
  const closeRoute = useRouteClose(ROUTES.topics);
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  // -- Topic management --
  const { topicId: topicIdText } = useParams<{ topicId: string }>();
  const topicId = parseTopicId(topicIdText);

  useEffect(() => {
    if (topicId) return;
    void navigate(ROUTES.topics);
  }, [navigate, topicId]);

  const { data, loading: topicLoading, error: topicError } = useCurrentUserDataPackage(
    userId,
    { kind: 'topic-detail', topicId: topicId ?? 0 },
  );
  const topic = data?.topic ?? null;
  const items = data?.items ?? [];
  const hasItems = items.length > 0;

  useEffect(() => {
    if (topicLoading || !userId || !topicId || topic !== null) return;
    void navigate(ROUTES.topics, { replace: true });
  }, [navigate, topic, topicId, topicLoading, userId]);

  useQueryErrorToast(topicError, 'Failed to load topic data');

  const itemAudios = useMemo(() => getItemAudioSources(items), [items]);

  const { playAudio, isAudioReady } = useAudioManager(itemAudios, audioCacheSnapshot);

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

function parseTopicId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
