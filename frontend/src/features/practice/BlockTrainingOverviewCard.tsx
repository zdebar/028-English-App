import Card from '@/components/UI/Card';
import StyledButton from '@/components/UI/buttons/StyledButton';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { TEXTS } from '@/locales/cs';
import type { UserBlockType } from '@/types/generic.types';
import DOMPurify from 'dompurify';
import type { JSX } from 'react';
import type { UserItemLocal } from '@/types/user-item.types';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { useMemo } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import VolumeSlider from '@/features/audio/VolumeSlider';

type BlockTrainingOverviewCardProps = Readonly<{
  block: Pick<UserBlockType, 'name' | 'note'>;
  grammar: GrammarDetail | null;
  items?: readonly UserItemLocal[];
  onContinue: () => void;
}>;

function Note({ note }: Readonly<{ note: string }>): JSX.Element {
  return (
    <div className="grammar m-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note) }} />
  );
}

/** Introduces the selected block and its optional grammar before initial training begins. */
export default function BlockTrainingOverviewCard({
  block,
  grammar,
  items = [],
  onContinue,
}: BlockTrainingOverviewCardProps): JSX.Element {
  const showToast = useToastStore((state) => state.showToast);
  const audios = useMemo(
    () => items.map((item) => item.audio).filter((audio): audio is string => Boolean(audio)),
    [items],
  );
  const { playAudio, isAudioReady, loading } = useAudioManager(audios);

  return (
    <Card className="flex w-full flex-col gap-1">
      {grammar ? (
        <section>
          <h1 className="m-4 flex items-center text-left text-lg font-bold">{grammar.name}</h1>
          {grammar.note && <Note note={grammar.note} />}
        </section>
      ) : (
        <>
          <h1 className="m-4 flex items-center text-left text-lg font-bold">{block.name}</h1>
          {block.note && <Note note={block.note} />}
        </>
      )}
      {items.map((item) => (
        <BilingualItemButton
          key={item.item_id}
          item={item}
          disabled={!item.audio || loading || !isAudioReady(item.audio)}
          onClick={async () => {
            if (!item.audio) return;
            const didPlay = await playAudio(item.audio);
            if (!didPlay) showToast(TEXTS.noAudio, 'error');
          }}
        />
      ))}
      {items.length > 0 && <VolumeSlider />}
      <StyledButton className="card-width h-button w-full" onClick={onContinue}>
        {TEXTS.continuePractice}
      </StyledButton>
    </Card>
  );
}
