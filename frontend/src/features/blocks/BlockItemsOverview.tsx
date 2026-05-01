import StyledButton from '@/components/UI/buttons/StyledButton';
import CloseButton from '@/components/UI/buttons/CloseButton';
import Notification from '@/components/UI/Notification';
import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { errorHandler } from '@/features/logging/error-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useArray } from '@/hooks/use-array';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useState, useEffect } from 'react';
import ModalButton from '../modal/ModalButton';
import Blocks from '@/database/models/blocks';
import { useFetch } from '@/hooks/use-fetch';

import { useNavigate, useParams } from 'react-router-dom';
import type { BlockType } from '@/types/generic.types';
import DelayedNotification from '@/components/UI/DelayedNotification';

export default function BlockItemsOverview() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  // Block management
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
      return null;
    }
  }, [userId, blockId]);

  const { data: block, error: blockError, loading: blockLoading } = useFetch<BlockType>(fetchBlock);

  // Items management
  const fetchBlockItems = useCallback(async () => {
    if (!userId || !blockId) return [];
    try {
      return await UserItem.getByBlockId(userId, blockId);
    } catch (err) {
      showToast(TEXTS.loadingError, 'error');
      return [];
    }
  }, [userId, blockId]);

  const { data: items, error, loading } = useArray<UserItemLocal>(fetchBlockItems);

  // Handlers
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
      <div className="h-button flex items-center justify-between gap-1">
        {blockError ? (
          <Notification className="color-error pt-4">{TEXTS.loadingError}</Notification>
        ) : (
          <ModalButton
            modalTitle={'resetTitle'}
            modalText={'resetDescription'}
            title={'reset'}
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
        )}
        <CloseButton onClick={onClose} />
      </div>
      {items.length > 0 ? (
        items.map((item) => (
          <StyledButton
            key={item.item_id}
            className="h-input flex justify-start px-4 text-left"
            title={`výslovnost: ${item.pronunciation}`}
          >
            <div className="flex w-full items-center justify-between gap-3 overflow-hidden">
              <span className="min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap">
                {item.czech}
              </span>
              <span className="min-w-0 flex-1 overflow-hidden text-right text-ellipsis whitespace-nowrap">
                {item.english}
              </span>
            </div>
          </StyledButton>
        ))
      ) : (
        <DelayedNotification message={TEXTS.noBlockItems} />
      )}
    </div>
  );
}
