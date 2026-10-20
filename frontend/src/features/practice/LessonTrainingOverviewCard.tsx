import OverviewCard from '@/components/UI/OverviewCard';
import StyledButton from '@/components/UI/buttons/StyledButton';
import { ROUTES } from '@/config/routes.config';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { TEXTS } from '@/locales/cs';
import type { LessonType } from '@/types/generic.types';
import type { GroupType } from '@/types/table.types';
import DOMPurify from 'dompurify';
import type { JSX } from 'react';
import type { UserItemLocal } from '@/types/user-item.types';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { useMemo } from 'react';
import { useToastStore } from '@/features/toast/use-toast-store';
import VolumeSlider from '@/features/audio/VolumeSlider';
import { useRouteClose } from '@/routing/use-route-close';

type LessonTrainingOverviewCardProps = Readonly<{
  lesson: Pick<LessonType, 'name' | 'note'>;
  grammar: GrammarDetail | null;
  grammarGroup: Pick<GroupType, 'note'> | null;
  items?: readonly UserItemLocal[];
  onContinue: () => void;
}>;

function Note({ note }: Readonly<{ note: string }>): JSX.Element {
  return <div className="m-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note) }} />;
}

type OverviewNotesProps = Readonly<{
  lessonNote: string | null;
  grammarNote: string | null | undefined;
  grammarGroupNote: string | null;
}>;

function OverviewNotes({
  lessonNote,
  grammarNote,
  grammarGroupNote,
}: OverviewNotesProps): JSX.Element {
  const hasNotes = Boolean(grammarGroupNote || grammarNote || lessonNote);

  return (
    <>
      {grammarGroupNote && <Note note={grammarGroupNote} />}
      {grammarNote && (
        <section>
          <Note note={grammarNote} />
        </section>
      )}
      {lessonNote && <Note note={lessonNote} />}
      {!hasNotes && <div className="h-4" aria-hidden="true" />}
    </>
  );
}

/** Introduces the selected lesson and its optional grammar before initial training begins. */
export default function LessonTrainingOverviewCard({
  lesson,
  grammar,
  grammarGroup,
  items = [],
  onContinue,
}: LessonTrainingOverviewCardProps): JSX.Element {
  const closeRoute = useRouteClose(ROUTES.practice);
  const showToast = useToastStore((state) => state.showToast);
  const audios = useMemo(
    () => items.map((item) => item.audio).filter((audio): audio is string => Boolean(audio)),
    [items],
  );
  const { playAudio, isAudioReady, loading } = useAudioManager(audios);
  const title = lesson.name;

  return (
    <OverviewCard
      buttonTitle={title}
      onClose={closeRoute}
      className="flex w-full flex-col gap-1"
    >
      <OverviewNotes
        lessonNote={lesson.note}
        grammarNote={grammar?.note}
        grammarGroupNote={grammarGroup?.note ?? null}
      />
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
    </OverviewCard>
  );
}
