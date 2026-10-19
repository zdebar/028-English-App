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
import ButtonWithModal from '@/features/modal/ButtonWithModal';
import type { ReviewDirection } from '@/types/practice.types';

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
  onReset?: (direction: ReviewDirection) => Promise<void>;
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

function getEnabledGrammarDirections(items: readonly UserItemLocal[]): readonly ReviewDirection[] {
  const directions: readonly ReviewDirection[] = ['cz_to_en', 'en_to_cz'];
  return directions.filter((direction) => items.some((item) => (
    direction === 'cz_to_en' ? item.is_cz_to_en_enabled : item.is_en_to_cz_enabled
  )));
}

function GrammarDirectionResetButtons({
  items,
  onReset,
}: Readonly<{
  items: readonly UserItemLocal[];
  onReset?: (direction: ReviewDirection) => Promise<void>;
}>) {
  if (!onReset) return null;

  const directions = getEnabledGrammarDirections(items);
  if (directions.length === 0) return null;

  return (
    <div className="mt-1 flex flex-col gap-1">
      {directions.map((direction) => (
        <ButtonWithModal
          key={direction}
          className="h-input w-full justify-center font-bold"
          modalTitle={TEXTS.restartGrammarDirectionTitle}
          modalText={TEXTS.restartDirectionProgressDescription}
          title={TEXTS.restartProgressHelp}
          onConfirm={() => onReset(direction)}
        >
          {lowercaseInitial(direction === 'cz_to_en' ? TEXTS.directionCzToEn : TEXTS.directionEnToCz)}
        </ButtonWithModal>
      ))}
    </div>
  );
}

function lowercaseInitial(value: string): string {
  return value.charAt(0).toLocaleLowerCase('cs-CZ') + value.slice(1);
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
  const hasDirectionReset = Boolean(onReset && getEnabledGrammarDirections(items).length > 0);

  return (
    <OverviewCard
      buttonTitle={grammar?.name}
      onClose={onClose}
      className={hasBottomControls ? 'bottom-controls-clearance relative' : 'relative'}
    >
      <GrammarDirectionResetButtons items={items} onReset={onReset} />
      <div className={hasDirectionReset ? 'mt-1' : ''}>
        <GrammarContent
          grammar={grammar}
          itemsProps={{ audioLoading, isAudioReady, playAudio, showToast }}
        />
        {!hasContent && TEXTS.noNotesToDisplay}
      </div>
      <GrammarBottomControls hasItems={items.length > 0} showHelpButton={showHelpButton} />
    </OverviewCard>
  );
}
