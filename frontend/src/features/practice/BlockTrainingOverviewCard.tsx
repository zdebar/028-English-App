import Card from '@/components/UI/Card';
import { CardHeader } from '@/components/UI/CardHeader';
import StyledButton from '@/components/UI/buttons/StyledButton';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { TEXTS } from '@/locales/cs';
import type { UserBlockType } from '@/types/generic.types';
import DOMPurify from 'dompurify';
import type { JSX } from 'react';

type BlockTrainingOverviewCardProps = Readonly<{
  block: Pick<UserBlockType, 'name' | 'note'>;
  grammar: GrammarDetail | null;
  onClose: () => void;
  onContinue: () => void;
}>;

function Note({ note }: Readonly<{ note: string }>): JSX.Element {
  return (
    <div className="grammar p-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note) }} />
  );
}

/** Introduces the selected block and its optional grammar before initial training begins. */
export default function BlockTrainingOverviewCard({
  block,
  grammar,
  onClose,
  onContinue,
}: BlockTrainingOverviewCardProps): JSX.Element {
  return (
    <Card className="flex w-full flex-col gap-1">
      <CardHeader onClose={onClose}>
        <h1 className="px-4 text-left text-lg font-bold">{block.name}</h1>
      </CardHeader>
      {block.note && <Note note={block.note} />}
      {grammar && (
        <section>
          <h2 className="h-button px-4 pt-4 text-left text-lg font-bold">{grammar.name}</h2>
          {grammar.note && <Note note={grammar.note} />}
        </section>
      )}
      <StyledButton className="card-width h-button w-full" onClick={onContinue}>
        {TEXTS.continuePractice}
      </StyledButton>
    </Card>
  );
}
