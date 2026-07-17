import OverviewCard from '@/components/UI/OverviewCard';
import StyledButton from '@/components/UI/buttons/StyledButton';
import { TEXTS } from '@/locales/cs';
import type { UserBlockType } from '@/types/generic.types';
import DOMPurify from 'dompurify';
import type { JSX } from 'react';

type BlockOverviewCardProps = Readonly<{
  block: Pick<UserBlockType, 'name' | 'note'>;
  onClose: () => void;
  onContinue: () => void;
}>;

/** Introduces a grammar-practice block before its grammar explanation. */
export default function BlockOverviewCard({
  block,
  onClose,
  onContinue,
}: BlockOverviewCardProps): JSX.Element {
  return (
    <div className="card-height card-width flex w-full flex-col items-center gap-1">
      <OverviewCard buttonTitle={block.name} onClose={onClose} className="relative h-full grow">
        {block.note ? (
          <div
            className="grammar p-4"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.note) }}
          />
        ) : (
          <p className="m-auto p-4">{TEXTS.noNotesToDisplay}</p>
        )}
      </OverviewCard>
      <StyledButton className="card-width h-button w-full grow-0" onClick={onContinue}>
        {TEXTS.continuePractice}
      </StyledButton>
    </div>
  );
}
