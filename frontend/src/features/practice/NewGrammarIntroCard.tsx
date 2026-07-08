import StyledButton from '@/components/UI/buttons/StyledButton';
import GrammarDetailCard, { type GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

type NewGrammarIntroCardProps = Readonly<{
  grammar: GrammarDetail;
  onClose: () => void;
  onContinue: () => void;
}>;

export default function NewGrammarIntroCard({
  grammar,
  onClose,
  onContinue,
}: NewGrammarIntroCardProps): JSX.Element {
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <GrammarDetailCard grammar={grammar} onClose={onClose} />
      <StyledButton
        className="card-width h-button mt-[calc(var(--height-button)+0.5rem)] w-full"
        onClick={onContinue}
      >
        {TEXTS.continuePractice}
      </StyledButton>
    </div>
  );
}
