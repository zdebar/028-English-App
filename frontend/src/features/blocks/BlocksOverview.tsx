import Blocks from '@/database/models/blocks';
import { useNavigate } from 'react-router-dom';
import { TEXTS } from '@/locales/cs';
import type { BlockType } from '@/types/generic.types';
import { useArray } from '@/hooks/use-array';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { useCallback } from 'react';
import { useToastStore } from '../toast/use-toast-store';
import { errorHandler } from '../logging/error-handler';
import { DataState } from '@/components/UI/DataState';
import { CardHeader } from '@/components/UI/CardHeader';
import HeaderText from '@/components/UI/HeaderText';
import { ListButton } from '@/components/UI/buttons/ListButton';

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

  const {
    data: blocks,
    loading: blocksLoading,
    hasData: hasBlocks,
  } = useArray<BlockType>(fetchBlocks);

  return (
    <div className="card-width flex flex-col justify-start gap-1">
      <CardHeader onClose={() => navigate(ROUTES.profile)}>
        <HeaderText>{TEXTS.blocksOverview}</HeaderText>
      </CardHeader>
      <DataState
        loading={blocksLoading}
        error={false}
        hasData={hasBlocks}
        noDataMessage={TEXTS.noBlocks}
      >
        <div className="flex flex-col gap-1">
          {blocks.map((block) => (
            <ListButton
              key={block.id}
              className="h-input flex w-full justify-start px-4 text-left"
              onClick={() => navigate(`${ROUTES.blocks}/${block.id}`)}
              title={block.name}
            >
              <p className="overflow-hidden text-ellipsis whitespace-nowrap">{block.name}</p>
            </ListButton>
          ))}
        </div>
      </DataState>
    </div>
  );
}

