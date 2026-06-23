import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { useArray } from '@/hooks/use-array';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useMemo } from 'react';
import UserBlock from '@/database/models/user-blocks';
import { useFetch } from '@/hooks/use-fetch';
import { useNavigate, useParams } from 'react-router-dom';
import type { UserBlockType } from '@/types/generic.types';
import { DataState } from '@/components/UI/DataState';
import { ListButton } from '@/components/UI/buttons/ListButton';
import HelpButton from '../help/HelpButton';
import OverviewCard from '@/components/UI/OverviewCard';
import VolumeSlider from '../audio/VolumeSlider';

function getPronunciationTitle(pronunciation: string): string {
  return typeof TEXTS.pronunciationTitle === 'function'
    ? TEXTS.pronunciationTitle(pronunciation)
    : `${TEXTS.pronunciation ?? 'Pronunciation'}: ${pronunciation}`;
}

export default function BlockItemsOverview() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  // -- Block management --
  const { blockId: blockIdString } = useParams<{ blockId: string }>();
  const blockId = blockIdString ? Number(blockIdString) : null;

  if (!blockId) {
    navigate(ROUTES.blocks);
  }

  const fetchBlock = useCallback(async (): Promise<UserBlockType | null> => {
    if (!userId || !blockId) return null;
    try {
      return await UserBlock.getByBlockId(userId, blockId);
    } catch (err) {
      showToast(TEXTS.loadingError, 'error');
      reportError('Failed to fetch block details', err);
      throw err;
    }
  }, [userId, blockId, showToast]);

  const { data: block, loading: blockLoading } = useFetch<UserBlockType>(fetchBlock);

  // -- Items management --
  const fetchBlockItems = useCallback(async () => {
    if (!userId || !blockId) return [];
    try {
      return await UserItem.getByBlockId(userId, blockId);
    } catch (err) {
      showToast(TEXTS.loadingError, 'error');
      reportError('Failed to fetch block items', err);
      return [];
    }
  }, [userId, blockId]);

  const {
    data: items,
    loading: itemsLoading,
    hasData: hasItems,
  } = useArray<UserItemLocal>(fetchBlockItems);

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
      reportInfo(`Reset ${resetCount} items in block ${blockId} for user ${userId}`);
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      reportError(TEXTS.resetProgressErrorToast, error);
    }
  }, [userId, blockId, showToast]);

  const onClose = useCallback(() => {
    navigate(ROUTES.blocks);
  }, [navigate]);

  return (
    <OverviewCard
      buttonTitle={block?.name}
      modalTitle={TEXTS.resetBlockTitle}
      modalText={TEXTS.resetBlockDescription}
      loading={blockLoading}
      handleReset={handleReset}
      onClose={onClose}
    >
      <DataState loading={itemsLoading} hasData={hasItems} noDataMessage={TEXTS.noBlockItems}>
        {items.map((item) => (
          <ListButton
            key={item.item_id}
            className="px-4"
            title={getPronunciationTitle(item.pronunciation)}
            onClick={async () => {
              if (!item.audio) return;
              const didPlay = await playAudio(item.audio);
              if (!didPlay) {
                showToast(TEXTS.noAudio, 'error');
              }
            }}
            disabled={!item.audio || audioLoading || !isAudioReady(item.audio)}
          >
            <div className="flex w-full items-center justify-between gap-3 overflow-hidden">
              <span className="min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap">
                {item.czech}
              </span>
              <span className="min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap">
                {item.english}
              </span>
            </div>
          </ListButton>
        ))}
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
