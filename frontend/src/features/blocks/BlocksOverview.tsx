import Blocks from '@/database/models/blocks';
import { useNavigate } from 'react-router-dom';
import { TEXTS } from '@/locales/cs';
import type { BlockType } from '@/types/generic.types';
import { useArray } from '@/hooks/use-array';
import StyledButton from '@/components/UI/buttons/StyledButton';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { useCallback } from 'react';
import { useToastStore } from '../toast/use-toast-store';
import { errorHandler } from '../logging/error-handler';
import { DataState } from '@/components/UI/DataState';

export default function BlocksOverview() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  // Blocks management
  const fetchBlocks = useCallback(async (): Promise<BlockType[]> => {
    if (!userId) return [];
    try {
      return await Blocks.getOverviewBlocks(userId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error));
      errorHandler('Failed to fetch blocks overview', error);
      return [];
    }
  }, [userId, showToast]);

  const { data: blocks, loading, status, hasData: hasBlocks } = useArray<BlockType>(fetchBlocks);

  return (
    <div className="card-width flex flex-col justify-start gap-1">
      <div className="h-button flex items-center justify-between gap-1">
        <div className="flex grow justify-start px-4">{TEXTS.blocksOverview}</div>
        <CloseButton onClick={() => navigate(ROUTES.profile)} />
      </div>
      <DataState
        loading={loading}
        error={status === 'error'}
        hasData={hasBlocks}
        noDataMessage={TEXTS.noBlocks}
      >
        {blocks.map((block) => (
          <StyledButton
            key={block.id}
            className="h-input flex justify-start px-4 text-left"
            onClick={() => navigate(`${ROUTES.blocks}/${block.id}`)}
            title={block.name}
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">{block.name}</p>
          </StyledButton>
        ))}
      </DataState>
    </div>
  );
}
