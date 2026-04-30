import Blocks from '@/database/models/blocks';
import { useNavigate } from 'react-router-dom';
import DelayedMessage from '@/components/UI/DelayedMessage';
import Notification from '@/components/UI/Notification';
import { TEXTS } from '@/locales/cs';
import type { BlockType } from '@/types/generic.types';
import { useArray } from '@/hooks/use-array';
import BaseButton from '@/components/UI/buttons/BaseButton';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { useCallback } from 'react';

export default function BlocksOverview() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);

  // Blocks management
  const fetchBlocks = useCallback(async (): Promise<BlockType[]> => {
    if (userId) {
      return Blocks.getOverviewBlocks(userId);
    }
    return [];
  }, [userId]);

  const { data: blocks, error, loading } = useArray<BlockType>(fetchBlocks);
  const hasBlocks = blocks.length > 0;

  // Early returns
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
        <CloseButton onClick={() => navigate(ROUTES.profile)} />
      </div>

      {hasBlocks ? (
        blocks.map((block) => (
          <BaseButton
            key={block.id}
            className="h-input flex justify-start px-4 text-left"
            onClick={() =>
              navigate(`${ROUTES.blocks}/${block.id}`, {
                state: { blockId: block.id, blockName: block.name },
              })
            }
            title={block.name}
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">{block.name}</p>
          </BaseButton>
        ))
      ) : (
        <DelayedMessage>
          <Notification className="color-info pt-4">{TEXTS.noBlocks}</Notification>
        </DelayedMessage>
      )}
    </div>
  );
}
