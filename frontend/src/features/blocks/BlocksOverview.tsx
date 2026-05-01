import Blocks from '@/database/models/blocks';
import { useNavigate } from 'react-router-dom';
import { TEXTS } from '@/locales/cs';
import type { BlockType } from '@/types/generic.types';
import { useArray } from '@/hooks/use-array';
import StyledButton from '@/components/UI/buttons/StyledButton';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { useCallback, useEffect } from 'react';
import { useToastStore } from '../toast/use-toast-store';
import { errorHandler } from '../logging/error-handler';
import DelayedNotification from '@/components/UI/DelayedNotification';

export default function BlocksOverview() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  // Blocks management
  const fetchBlocks = useCallback(async (): Promise<BlockType[]> => {
    if (userId) {
      return Blocks.getOverviewBlocks(userId);
    }
    return [];
  }, [userId]);

  const { data: blocks, error, loading } = useArray<BlockType>(fetchBlocks);
  const hasBlocks = blocks.length > 0;

  useEffect(() => {
    if (error) {
      showToast(TEXTS.dataLoadingError, 'error');
      errorHandler(TEXTS.dataLoadingError, error);
    }
  }, [error]);

  // Early returns
  if (loading) {
    return <DelayedNotification />;
  }

  return (
    <div className="card-width flex flex-col justify-start gap-1">
      <div className="h-button flex items-center justify-between gap-1">
        <div className="flex grow justify-start px-4">{TEXTS.blocksOverview}</div>
        <CloseButton onClick={() => navigate(ROUTES.profile)} />
      </div>

      {hasBlocks ? (
        blocks.map((block) => (
          <StyledButton
            key={block.id}
            className="h-input flex justify-start px-4 text-left"
            onClick={() => navigate(`${ROUTES.blocks}/${block.id}`)}
            title={block.name}
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">{block.name}</p>
          </StyledButton>
        ))
      ) : (
        <DelayedNotification message={TEXTS.noBlocks} />
      )}
    </div>
  );
}
