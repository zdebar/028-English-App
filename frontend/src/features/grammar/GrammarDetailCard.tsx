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

function getGrammarChunks(
  grammar: GrammarDetail | null | undefined,
): readonly GrammarChunkDetail[] {
  if (!grammar) return [];
  if (grammar.kind === 'chunk') return [grammar];
  return grammar.chunks;
}

function hasGrammarContent(
  grammar: GrammarDetail | null | undefined,
  chunks: readonly GrammarChunkDetail[],
): boolean {
  return Boolean(grammar?.note || chunks.some((chunk) => chunk.note || chunk.items?.length));
}

async function playGrammarItemAudio(
  item: UserItemLocal,
  playAudio: (audio: string) => Promise<boolean>,
  showToast: (message: string, type: 'error') => void,
): Promise<void> {
  if (!item.audio) return;
  const didPlay = await playAudio(item.audio);
  if (!didPlay) showToast(TEXTS.noAudio, 'error');
}

function GrammarNote({ note }: Readonly<{ note: string | null | undefined }>) {
  if (!note) return null;
  return (
    <div className="grammar m-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note) }} />
  );
}

function GrammarItems({
  entries,
  audioLoading,
  isAudioReady,
  playAudio,
  showToast,
}: Readonly<{
  entries: readonly UserItemLocal[] | undefined;
  audioLoading: boolean;
  isAudioReady: (audio: string) => boolean;
  playAudio: (audio: string) => Promise<boolean>;
  showToast: (message: string, type: 'error') => void;
}>) {
  if (!entries?.length) return null;
  return (
    <div className="flex flex-col gap-1">
      {entries.map((item) => (
        <BilingualItemButton
          key={item.item_id}
          item={item}
          disabled={!item.audio || (!audioLoading && !isAudioReady(item.audio))}
          onClick={() => playGrammarItemAudio(item, playAudio, showToast)}
        />
      ))}
    </div>
  );
}

function GrammarContent({
  grammar,
  itemsProps,
}: Readonly<{
  grammar: GrammarDetail | null | undefined;
  itemsProps: Omit<React.ComponentProps<typeof GrammarItems>, 'entries'>;
}>) {
  if (!grammar) return null;
  if (grammar.kind === 'chunk') {
    return (
      <>
        <GrammarNote note={grammar.note} />
        <GrammarItems entries={grammar.items} {...itemsProps} />
      </>
    );
  }
  return (
    <>
      <GrammarNote note={grammar.note} />
      {grammar.chunks.map((chunk) => (
        <section key={chunk.id}>
          <h2 className="m-4 text-left text-lg font-bold">{chunk.name}</h2>
          <GrammarNote note={chunk.note} />
          <GrammarItems entries={chunk.items} {...itemsProps} />
        </section>
      ))}
    </>
  );
}

function GrammarBottomControls({
  hasItems,
  showHelpButton,
}: Readonly<{ hasItems: boolean; showHelpButton: boolean }>) {
  return (
    <>
      {hasItems && (
        <div className="pos-bottom-left-control">
          <VolumeSlider />
        </div>
      )}
      {showHelpButton && (
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      )}
    </>
  );
}

export default function GrammarDetailCard({
  grammar,
  onClose,
  onReset,
  showHelpButton = false,
}: GrammarDetailCardProps) {
  const showToast = useToastStore((state) => state.showToast);
  const chunks = useMemo(() => getGrammarChunks(grammar), [grammar]);
  const items = useMemo(() => chunks.flatMap((chunk) => chunk.items ?? []), [chunks]);
  const audios = useMemo(
    () => items.map((item) => item.audio).filter((audio): audio is string => Boolean(audio)),
    [items],
  );
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);

  const hasContent = hasGrammarContent(grammar, chunks);
  const hasBottomControls = items.length > 0 || showHelpButton;

  return (
    <OverviewCard
      buttonTitle={grammar?.name}
      modalTitle={TEXTS.restartGrammarTitle}
      modalText={TEXTS.restartGrammarDescription}
      handleReset={onReset}
      onClose={onClose}
      className={hasBottomControls ? 'bottom-controls-clearance relative' : 'relative'}
    >
      <GrammarContent
        grammar={grammar}
        itemsProps={{ audioLoading, isAudioReady, playAudio, showToast }}
      />
      {!hasContent && TEXTS.noNotesToDisplay}
      <GrammarBottomControls hasItems={items.length > 0} showHelpButton={showHelpButton} />
    </OverviewCard>
  );
}
