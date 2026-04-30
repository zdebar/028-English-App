import BaseButton from '@/components/UI/buttons/BaseButton';
import CloseButton from '@/components/UI/buttons/CloseButton';
import DelayedMessage from '@/components/UI/DelayedMessage';
import Notification from '@/components/UI/Notification';
import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { errorHandler } from '@/features/logging/error-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useArray } from '@/hooks/use-array';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback } from 'react';
import ModalButton from '../modal/ModalButton';

import { useNavigate, useLocation } from 'react-router-dom';

export default function BlockItemsOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { blockId, blockName } = location.state?.myData;
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  // Items management
  const fetchBlockItems = useCallback(async () => {
    if (!userId || blockId === null) return [];
    return UserItem.getByBlockId(userId, blockId);
  }, [userId, blockId]);

  const { data: items, error, loading } = useArray<UserItemLocal>(fetchBlockItems);

  // Handlers
  const handleReset = useCallback(async () => {
    if (!userId || !blockId) return;
    try {
      await UserItem.resetItemsByBlockId(userId, blockId);
      showToast('replace', 'success');
    } catch (error) {
      showToast('replace', 'error');
      errorHandler('replace', error);
    }
  }, [userId, blockId, showToast]);

  const onClose = useCallback(() => {
    navigate(ROUTES.blocks);
  }, [navigate]);

  if (!userId || !blockId) {
    return <Notification className="pt-8">{TEXTS.pageNotFound}</Notification>;
  }

  if (loading) {
    return (
      <DelayedMessage>
        <Notification className="color-info pt-4">{TEXTS.loadingMessage}</Notification>
      </DelayedMessage>
    );
  }

  return (
    <div className="card-width flex flex-col justify-start gap-1">
      <div className="h-button flex items-center justify-between gap-1">
        {error ? (
          <Notification className="color-error pt-4">{error}</Notification>
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
            disabled={!!error}
          >
            {blockName}
          </ModalButton>
        )}
        <CloseButton onClick={onClose} />
      </div>
      {items.length > 0 ? (
        items.map((item) => (
          <BaseButton
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
          </BaseButton>
        ))
      ) : (
        <DelayedMessage>
          <Notification className="color-info pt-4">{TEXTS.noBlockItems}</Notification>
        </DelayedMessage>
      )}
    </div>
  );
}
