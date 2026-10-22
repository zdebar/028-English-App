import OverviewCard from '@/components/UI/OverviewCard';
import AudioItemList from '@/components/UI/AudioItemList';
import SanitizedNote from '@/components/UI/SanitizedNote';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { getItemAudioSources } from '@/features/audio/audio.utils';
import { useMemo } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import VolumeSlider from '@/features/audio/VolumeSlider';
import DirectionResetButton from '@/features/practice/DirectionResetButton';
import { getEnabledReviewDirections } from '@/features/practice/review-directions.utils';
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
  onReset?: (grammarGroupId: number, direction: ReviewDirection) => Promise<void>;
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

function GrammarNote({ note }: Readonly<{ note: string | null | undefined }>) {
  if (!note) return null;
  return <SanitizedNote className="grammar m-4" html={note} />;
}

function GrammarContent({
  grammar,
  itemsProps,
  onReset,
}: Readonly<{
  grammar: GrammarDetail | null | undefined;
  itemsProps: Omit<React.ComponentProps<typeof AudioItemList>, 'items'>;
  onReset?: (grammarGroupId: number, direction: ReviewDirection) => Promise<void>;
}>) {
  if (!grammar) return null;
  if (grammar.kind === 'chunk') {
    return (
      <>
        <GrammarNote note={grammar.note} />
        <AudioItemList items={grammar.items ?? []} {...itemsProps} />
      </>
    );
  }
  return (
    <>
      <GrammarNote note={grammar.note} />
      <div className="flex flex-col gap-4">
        {grammar.chunks.map((chunk) => (
          <section key={chunk.id} className="flex flex-col gap-1">
            <h2 className="border-disabled-light text-light dark:border-disabled-dark dark:text-dark mt-1 mb-0 border border-dashed px-4 py-2 text-left">
              {chunk.name}
            </h2>
            <GrammarDirectionResetButtons
              items={chunk.items ?? []}
              onReset={onReset ? (direction) => onReset(chunk.id, direction) : undefined}
            />
            <GrammarNote note={chunk.note} />
            <AudioItemList items={chunk.items ?? []} {...itemsProps} />
          </section>
        ))}
      </div>
    </>
  );
}

function GrammarBottomControls({ hasItems }: Readonly<{ hasItems: boolean }>) {
  return (
    <>
      {hasItems && (
        <div className="pos-bottom-left-control">
          <VolumeSlider />
        </div>
      )}
    </>
  );
}

function GrammarDirectionResetButtons({
  items,
  onReset,
}: Readonly<{
  items: readonly UserItemLocal[];
  onReset?: (direction: ReviewDirection) => Promise<void>;
}>) {
  if (!onReset) return null;

  const directions = getEnabledReviewDirections(items);
  if (directions.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {directions.map((direction) => (
        <DirectionResetButton
          key={direction}
          direction={direction}
          label={direction === 'cz_to_en' ? TEXTS.restartProgressCzToEn : TEXTS.restartProgressEnToCz}
          modalTitle={TEXTS.restartGrammarDirectionTitle}
          modalText={TEXTS.restartDirectionProgressDescription}
          onReset={onReset}
        />
      ))}
    </div>
  );
}

export default function GrammarDetailCard({
  grammar,
  onClose,
  onReset,
}: GrammarDetailCardProps) {
  const showToast = useToastStore((state) => state.showToast);
  const chunks = useMemo(() => getGrammarChunks(grammar), [grammar]);
  const items = useMemo(() => chunks.flatMap((chunk) => chunk.items ?? []), [chunks]);
  const audios = useMemo(() => getItemAudioSources(items), [items]);
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);

  const hasContent = hasGrammarContent(grammar, chunks);
  const hasBottomControls = items.length > 0;

  return (
    <OverviewCard
      buttonTitle={grammar?.name}
      onClose={onClose}
      className={hasBottomControls ? 'bottom-controls-clearance relative' : 'relative'}
      showResetAction={false}
    >
      <GrammarContent
        grammar={grammar}
        itemsProps={{ audioLoading, isAudioReady, playAudio, showToast }}
        onReset={onReset}
      />
      {!hasContent && TEXTS.noNotesToDisplay}
      <GrammarBottomControls hasItems={items.length > 0} />
    </OverviewCard>
  );
}
