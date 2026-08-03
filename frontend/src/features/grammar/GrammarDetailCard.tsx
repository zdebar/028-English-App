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

export type GrammarDetail = Readonly<{
  id: number;
  name: string;
  note?: string | null;
  chunks?: readonly GrammarDetail[];
  items?: readonly UserItemLocal[];
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
  const showToast = useToastStore((state) => state.showToast);
  const items = useMemo(
    () => [
      ...(grammar?.items ?? []),
      ...(grammar?.chunks?.flatMap((chunk) => chunk.items ?? []) ?? []),
    ],
    [grammar],
  );
  const audios = useMemo(
    () => items.map((item) => item.audio).filter((audio): audio is string => Boolean(audio)),
    [items],
  );
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);

  const renderItems = (entries: readonly UserItemLocal[] | undefined) =>
    entries?.map((item) => (
      <BilingualItemButton
        key={item.item_id}
        item={item}
        disabled={!item.audio || audioLoading || !isAudioReady(item.audio)}
        onClick={async () => {
          if (!item.audio) return;
          const didPlay = await playAudio(item.audio);
          if (!didPlay) showToast(TEXTS.noAudio, 'error');
        }}
      />
    ));

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
        <div
          className="grammar p-4"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(grammar.note) }}
        />
      )}
      {renderItems(grammar?.items)}
      {grammar?.chunks?.map((chunk) => (
        <section key={chunk.id}>
          <h2 className="h-button px-4 pt-4 text-left text-lg font-bold">{chunk.name}</h2>
          {chunk.note && (
            <div
              className="grammar p-4"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chunk.note) }}
            />
          )}
          {renderItems(chunk.items)}
        </section>
      ))}
      {!grammar?.note &&
        !grammar?.items?.length &&
        !grammar?.chunks?.some((chunk) => chunk.note || chunk.items?.length) &&
        TEXTS.noNotesToDisplay}
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
