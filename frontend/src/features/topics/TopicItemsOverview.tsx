import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo } from 'react';
import UserBlock from '@/database/models/user-blocks';
import { useNavigate, useParams } from 'react-router-dom';
import type { UserBlockType } from '@/types/generic.types';
import { DataState } from '@/components/UI/DataState';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import HelpButton from '../help/HelpButton';
import OverviewCard from '@/components/UI/OverviewCard';
import VolumeSlider from '../audio/VolumeSlider';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import { useDataNavigation } from '@/routing/data-navigation';
import { useLiveQueryData } from '@/hooks/use-live-query-data';

export default function TopicItemsOverview({
  initialTopic,
  initialItems = [],
}: Readonly<{ initialTopic?: UserBlockType | null; initialItems?: UserItemLocal[] }>) {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const parentDescriptor =
    userId && initialTopic
      ? {
          key: routeDataKey('topics', userId),
          load: () => UserBlock.getStartedTopicsByUserId(userId),
        }
      : undefined;
  const { loadAndNavigate: prepareParent } = useDataNavigation(
    parentDescriptor,
    ROUTES.topics,
  );

  // -- Topic management --
  const { blockId: blockIdText } = useParams<{ blockId: string }>();
  const parsedBlockId = Number(blockIdText);
  const blockId =
    initialTopic?.block_id ??
    (Number.isSafeInteger(parsedBlockId) && parsedBlockId > 0 ? parsedBlockId : null);

  useEffect(() => {
    if (blockId) return;
    navigate(ROUTES.topics);
  }, [blockId, navigate]);

  const fetchTopic = useCallback(async (): Promise<UserBlockType | null> => {
    if (!userId || !blockId) return null;
    return UserBlock.getByBlockId(userId, blockId);
  }, [userId, blockId]);

  const {
    data: topic,
    loading: topicLoading,
    error: topicError,
  } = useLiveQueryData<UserBlockType | null>(fetchTopic, {
    emptyData: null,
    initialData: initialTopic,
  });

  // -- Items management --
  const fetchBlockItems = useCallback(async () => {
    if (!userId || !blockId) return [];
    return UserItem.getByBlockId(userId, blockId);
  }, [userId, blockId]);

  const {
    data: items,
    loading: itemsLoading,
    error: itemsError,
  } = useLiveQueryData<UserItemLocal[]>(fetchBlockItems, {
    emptyData: [],
    initialData: initialItems,
  });
  const hasItems = items.length > 0;

  useEffect(() => {
    if (topicLoading || !userId || !blockId || topic !== null) return;
    navigate(ROUTES.topics, { replace: true });
  }, [blockId, navigate, topic, topicLoading, userId]);

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
    if (!userId || !blockId) return;
    try {
      const resetCount = await UserItem.resetItemsByBlockId(userId, blockId);
      invalidateRouteData(routeDataKey('topic-detail', userId, blockId));
      invalidateRouteData(routeDataKey('topics', userId));
      reportInfo(`Reset ${resetCount} items in topic block ${blockId}`);
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      reportError(TEXTS.resetProgressErrorToast, error);
    }
  }, [userId, blockId, showToast]);

  const onClose = useCallback(() => {
    void prepareParent();
  }, [prepareParent]);

  const resetHandler = topic?.is_removed_from_practice ? undefined : handleReset;

  return (
    <OverviewCard
      buttonTitle={topic?.name}
      modalTitle={TEXTS.resetTopicTitle}
      modalText={TEXTS.resetTopicDescription}
      loading={topicLoading}
      handleReset={resetHandler}
      onClose={onClose}
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
