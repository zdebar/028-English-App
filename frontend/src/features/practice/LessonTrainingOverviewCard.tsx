import OverviewCard from '@/components/UI/OverviewCard';
import StyledButton from '@/components/UI/buttons/StyledButton';
import { ROUTES } from '@/config/routes.config';
import type { LessonType } from '@/types/generic.types';
import { TEXTS } from '@/locales/cs';
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
  lesson: Pick<LessonType, 'name'>;
  groupNotes: readonly Pick<GroupType, 'note'>[];
  items?: readonly UserItemLocal[];
  onContinue: () => void;
}>;

function Note({ note }: Readonly<{ note: string }>): JSX.Element {
  return <div className="m-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note) }} />;
}

function OverviewNotes({
  groupNotes,
}: Readonly<{ groupNotes: readonly Pick<GroupType, 'note'>[] }>): JSX.Element {
  const notes = groupNotes.flatMap((group) => (group.note ? [group.note] : []));
  return (
    <>
      {notes.length > 0 ? (
        notes.map((note, index) => <Note key={`${index}-${note}`} note={note} />)
      ) : (
        <div className="h-4" aria-hidden="true" />
      )}
    </>
  );
}

/** Introduces the selected lesson and its optional grammar before initial training begins. */
export default function LessonTrainingOverviewCard({
  lesson,
  groupNotes,
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
      <OverviewNotes groupNotes={groupNotes} />
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
