import UserBlock from '@/database/models/user-blocks';
import { useNavigate } from 'react-router-dom';
import { TEXTS } from '@/locales/cs';
import type { UserBlockType } from '@/types/generic.types';
import { useArray } from '@/hooks/use-array';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { useCallback, useEffect } from 'react';
import { useToastStore } from '../toast/use-toast-store';
import { reportError } from '../logging/monitoring-handler';
import { DataState } from '@/components/UI/DataState';
import { ListButton } from '@/components/UI/buttons/ListButton';
import OverviewCard from '@/components/UI/OverviewCard';

export default function BlocksOverview() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);

  // Blocks management
  const fetchBlocks = useCallback(async (): Promise<UserBlockType[]> => {
    if (!userId) return [];
    return UserBlock.getStartedTopicsByUserId(userId);
  }, [userId]);

  const {
    data: blocks,
    loading: blocksLoading,
    hasData: hasBlocks,
    error: blocksError,
  } = useArray<UserBlockType>(fetchBlocks);

  useEffect(() => {
    if (!blocksError) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch blocks overview', blocksError);
  }, [blocksError, showToast]);

  return (
    <OverviewCard buttonTitle={TEXTS.blocksOverview} onClose={() => navigate(ROUTES.profile)}>
      <DataState loading={blocksLoading} hasData={hasBlocks} noDataMessage={TEXTS.noBlocks}>
        {blocks.map((block) => (
          <ListButton
            key={block.block_id}
            className="h-input flex w-full justify-start px-4 text-left"
            onClick={() => navigate(`${ROUTES.blocks}/${block.block_id}`)}
            title={block.name}
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">{block.name}</p>
          </ListButton>
        ))}
      </DataState>
    </OverviewCard>
  );
}

