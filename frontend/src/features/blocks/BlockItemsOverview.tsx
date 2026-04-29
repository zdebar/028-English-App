import BaseButton from '@/components/UI/buttons/BaseButton';
import CloseButton from '@/components/UI/buttons/CloseButton';
import DelayedMessage from '@/components/UI/DelayedMessage';
import Notification from '@/components/UI/Notification';
import { ROUTES } from '@/config/routes.config';
import AudioRecord from '@/database/models/audio-records';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { errorHandler } from '@/features/logging/error-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useArray } from '@/hooks/use-array';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function BlockItemsOverview() {
  const navigate = useNavigate();
  const { blockId: rawBlockId } = useParams();
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);

  const blockId = useMemo(() => {
    const parsed = Number(rawBlockId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [rawBlockId]);

  const fetchBlockItems = useCallback(async () => {
    if (!userId || blockId === null) return [];
    return UserItem.getByBlockId(userId, blockId);
  }, [userId, blockId]);

  const { data: items, error, loading } = useArray<UserItemLocal>(fetchBlockItems);

  const stopActiveAudio = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }

    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopActiveAudio();
  }, [stopActiveAudio]);

  const playAudio = useCallback(
    async (audioName: string | null) => {
      if (!audioName) return;

      try {
        stopActiveAudio();
        const audioRecord = await AudioRecord.getByFilename(audioName);
        if (!audioRecord?.audioBlob) return;

        const objectUrl = URL.createObjectURL(audioRecord.audioBlob);
        const audioElement = new Audio(objectUrl);

        activeObjectUrlRef.current = objectUrl;
        activeAudioRef.current = audioElement;

        const cleanup = () => {
          if (activeObjectUrlRef.current === objectUrl) {
            URL.revokeObjectURL(objectUrl);
            activeObjectUrlRef.current = null;
          }
          if (activeAudioRef.current === audioElement) {
            activeAudioRef.current = null;
          }
        };

        audioElement.addEventListener('ended', cleanup, { once: true });
        audioElement.addEventListener('error', cleanup, { once: true });

        await audioElement.play();
      } catch (error) {
        showToast(TEXTS.loadingError, 'error');
        errorHandler('Block audio playback failed', error);
      }
    },
    [showToast, stopActiveAudio],
  );

  if (blockId === null) {
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
          <div className="h-button flex grow items-center justify-start border border-dashed px-4">
            {error}
          </div>
        ) : (
          <div className="flex grow justify-start px-4">{TEXTS.blocksOverview}</div>
        )}
        <CloseButton onClick={() => navigate(ROUTES.blocks)} />
      </div>

      {items.length > 0 ? (
        items.map((item) => (
          <BaseButton
            key={item.item_id}
            className="h-input flex justify-start px-4 text-left"
            onClick={() => playAudio(item.audio)}
            title={`${item.czech} / ${item.english}`}
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
