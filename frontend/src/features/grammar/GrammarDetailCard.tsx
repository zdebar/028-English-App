import OverviewCard from '@/components/UI/OverviewCard';
import HelpButton from '@/features/help/HelpButton';
import { TEXTS } from '@/locales/cs';
import DOMPurify from 'dompurify';

export type GrammarDetail = Readonly<{
  id: number;
  name: string;
  note?: string | null;
  chunks?: readonly GrammarDetail[];
}>;

type GrammarDetailCardProps = Readonly<{
  grammar?: GrammarDetail | null;
  onClose: () => void;
  onReset?: () => Promise<void>;
  /** Whether to render the bottom-right contextual help control. */
  showHelpButton?: boolean;
}>;

export default function GrammarDetailCard({
  grammar,
  onClose,
  onReset,
  showHelpButton = false,
}: GrammarDetailCardProps) {
  return (
    <OverviewCard
      buttonTitle={grammar?.name}
      modalTitle={TEXTS.restartGrammarTitle}
      modalText={TEXTS.restartGrammarDescription}
      handleReset={onReset}
      onClose={onClose}
      className="relative"
    >
      {grammar?.note && (
        <div className="grammar p-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(grammar.note) }} />
      )}
      {grammar?.chunks?.map((chunk) => (
        <section key={chunk.id}>
          <h2 className="h-button px-4 pt-4 text-left text-lg font-bold">{chunk.name}</h2>
          {chunk.note && (
            <div className="grammar p-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chunk.note) }} />
          )}
        </section>
      ))}
      {!grammar?.note && !grammar?.chunks?.some((chunk) => chunk.note) && TEXTS.noNotesToDisplay}
      {showHelpButton && (
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      )}
    </OverviewCard>
  );
}
