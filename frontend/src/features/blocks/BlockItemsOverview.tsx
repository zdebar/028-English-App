import CloseButton from '@/components/UI/buttons/CloseButton';
import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { errorHandler } from '@/features/logging/error-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useAudioManager } from '@/hooks/use-audio-manager';
import { useArray } from '@/hooks/use-array';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useMemo } from 'react';
import ModalButton from '../modal/ModalButton';
import Blocks from '@/database/models/blocks';
import { useFetch } from '@/hooks/use-fetch';
import { useNavigate, useParams } from 'react-router-dom';
import type { BlockType } from '@/types/generic.types';
import { DataState } from '@/components/UI/DataState';
import { ListButton } from '@/components/UI/buttons/ListButton';

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

  const fetchBlock = useCallback(async (): Promise<BlockType | null> => {
    if (!userId || !blockId) return null;
    try {
      return await Blocks.getById(blockId);
    } catch (err) {
      showToast(TEXTS.loadingError, 'error');
      errorHandler('Failed to fetch block details', err);
      return null;
    }
  }, [userId, blockId]);

  const { data: block, status: blockStatus, hasData: hasBlock } = useFetch<BlockType>(fetchBlock);

  // -- Items management --
  const fetchBlockItems = useCallback(async () => {
    if (!userId || !blockId) return [];
    try {
      return await UserItem.getByBlockId(userId, blockId);
    } catch (err) {
      showToast(TEXTS.loadingError, 'error');
      errorHandler('Failed to fetch block items', err);
      return [];
    }
  }, [userId, blockId]);

  const {
    data: items,
    status: itemsStatus,
    hasData: hasItems,
  } = useArray<UserItemLocal>(fetchBlockItems);

  const itemAudios = useMemo(
    () => items.map((item) => item.audio).filter((audio): audio is string => Boolean(audio)),
    [items],
  );

  const { playAudio } = useAudioManager(itemAudios);

  // -- Handlers --
  const handleReset = useCallback(async () => {
    if (!userId || !blockId) return;
    try {
      await UserItem.resetItemsByBlockId(userId, blockId);
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      errorHandler(TEXTS.resetProgressErrorToast, error);
    }
  }, [userId, blockId, showToast]);

  const onClose = useCallback(() => {
    navigate(ROUTES.blocks);
  }, [navigate]);

  return (
    <div className="card-width flex flex-col justify-start gap-1">
      {/** Card Header */}
      <div className="h-button flex items-center justify-between gap-1">
        <DataState
          loading={blockStatus === 'loading'}
          error={blockStatus === 'error'}
          hasData={hasBlock}
        >
          <ModalButton
            modalTitle={TEXTS.resetBlockTitle}
            modalText={TEXTS.resetBlockDescription}
            title={TEXTS.resetBlockTooltip}
            onConfirm={async () => {
              if (handleReset) {
                await handleReset();
              }
              onClose();
            }}
            className="justify-start px-4"
          >
            {block?.name ?? TEXTS.loadingError}
          </ModalButton>
        </DataState>
        <CloseButton onClick={onClose} />
      </div>
      {/** Items List */}
      <DataState
        loading={itemsStatus === 'loading'}
        error={itemsStatus === 'error'}
        hasData={hasItems}
      >
        {items.map((item) => (
          <ListButton
            key={item.item_id}
            className="h-input px-4"
            title={`výslovnost: ${item.pronunciation}`}
            onClick={() => {
              if (!item.audio) return;
              playAudio(item.audio);
            }}
          >
            <div className="flex w-full items-center justify-between gap-3 overflow-hidden">
              <span className="min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap">
                {item.czech}
              </span>
              <span className="min-w-0 flex-1 overflow-hidden text-right text-ellipsis whitespace-nowrap">
                {item.english}
              </span>
            </div>
          </ListButton>
        ))}
      </DataState>
    </div>
  );
}
