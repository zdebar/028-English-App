import Blocks from '@/database/models/blocks';
import { useNavigate } from 'react-router-dom';
import DelayedMessage from '@/components/UI/DelayedMessage';
import Notification from '@/components/UI/Notification';
import { TEXTS } from '@/locales/cs';
import type { BlockLocal } from '@/types/local.types';
import { useArray } from '@/hooks/use-array';
import BaseButton from '@/components/UI/buttons/BaseButton';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { ROUTES } from '@/config/routes.config';

export default function BlocksOverview() {
  const navigate = useNavigate();

  const { data: blocks, error, loading } = useArray<BlockLocal>(Blocks.getAll);
  const hasBlocks = blocks.length > 0;

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
            onClick={() => navigate(`${ROUTES.blocks}/${block.id}`)}
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
