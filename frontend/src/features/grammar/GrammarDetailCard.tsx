import OverviewCard from '@/components/UI/OverviewCard';
import HelpButton from '@/features/help/HelpButton';
import { TEXTS } from '@/locales/cs';
import DOMPurify from 'dompurify';
import type { UserItemLocal } from '@/types/user-item.types';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { useMemo } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import VolumeSlider from '@/features/audio/VolumeSlider';

type GrammarChunkDetail = Readonly<{
  id: number;
  name: string;
  note?: string | null;
  items?: readonly UserItemLocal[];
}>;

export type GrammarDetail =
  | Readonly<{
      kind: 'group';
      id: number;
      name: string;
      note?: string | null;
      chunks: readonly GrammarChunkDetail[];
    }>
  | (GrammarChunkDetail & Readonly<{ kind: 'chunk' }>);

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
  const showToast = useToastStore((state) => state.showToast);
  const chunks = useMemo(() => {
    if (!grammar) return [];
    if (grammar.kind === 'chunk') return [grammar];
    return grammar.chunks;
  }, [grammar]);
  const items = useMemo(() => chunks.flatMap((chunk) => chunk.items ?? []), [chunks]);
  const audios = useMemo(
    () => items.map((item) => item.audio).filter((audio): audio is string => Boolean(audio)),
    [items],
  );
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);

  const renderItems = (entries: readonly UserItemLocal[] | undefined) => {
    if (!entries?.length) return null;

    return (
      <div className="flex flex-col gap-1">
        {entries.map((item) => (
          <BilingualItemButton
            key={item.item_id}
            item={item}
            disabled={!item.audio || (!audioLoading && !isAudioReady(item.audio))}
            onClick={async () => {
              if (!item.audio) return;
              const didPlay = await playAudio(item.audio);
              if (!didPlay) showToast(TEXTS.noAudio, 'error');
            }}
          />
        ))}
      </div>
    );
  };

  const renderNote = (note: string | null | undefined) => {
    if (!note) return null;

    return (
      <div className="grammar m-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note) }} />
    );
  };

  const hasContent = Boolean(
    grammar?.note || chunks.some((chunk) => chunk.note || chunk.items?.length),
  );

  return (
    <OverviewCard
      buttonTitle={grammar?.name}
      modalTitle={TEXTS.restartGrammarTitle}
      modalText={TEXTS.restartGrammarDescription}
      handleReset={onReset}
      onClose={onClose}
      className="relative"
    >
      {grammar?.kind === 'group' && (
        <>
          {renderNote(grammar.note)}
          {grammar.chunks.map((chunk) => (
            <section key={chunk.id}>
              <h2 className="m-4 text-left text-lg font-bold">{chunk.name}</h2>
              {renderNote(chunk.note)}
              {renderItems(chunk.items)}
            </section>
          ))}
        </>
      )}
      {grammar?.kind === 'chunk' && (
        <>
          {renderNote(grammar.note)}
          {renderItems(grammar.items)}
        </>
      )}
      {!hasContent && TEXTS.noNotesToDisplay}
      {items.length > 0 && (
        <div className="pos-bottom-left-control">
          <VolumeSlider />
        </div>
      )}
      {showHelpButton && (
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      )}
    </OverviewCard>
  );
}
