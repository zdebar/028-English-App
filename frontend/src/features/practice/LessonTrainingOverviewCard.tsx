import OverviewCard from '@/components/UI/OverviewCard';
import StyledButton from '@/components/UI/buttons/StyledButton';
import AudioItemList from '@/components/UI/AudioItemList';
import { ROUTES } from '@/config/routes.config';
import type { LessonType } from '@/types/generic.types';
import { TEXTS } from '@/locales/cs';
import type { GroupType } from '@/types/table.types';
import SanitizedNote from '@/components/UI/SanitizedNote';
import type { JSX } from 'react';
import type { UserItemLocal } from '@/types/user-item.types';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { getItemAudioSources } from '@/features/audio/audio.utils';
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
  return <SanitizedNote className="m-4" html={note} />;
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
  const audios = useMemo(() => getItemAudioSources(items), [items]);
  const { playAudio, isAudioReady, loading } = useAudioManager(audios);
  const title = lesson.name;

  return (
    <OverviewCard
      buttonTitle={title}
      onClose={closeRoute}
      className="flex w-full flex-col gap-1"
    >
      <OverviewNotes groupNotes={groupNotes} />
      <AudioItemList
        items={items}
        audioLoading={loading}
        isAudioReady={isAudioReady}
        playAudio={playAudio}
        showToast={showToast}
      />
      {items.length > 0 && <VolumeSlider />}
      <StyledButton className="card-width h-button w-full" onClick={onContinue}>
        {TEXTS.continuePractice}
      </StyledButton>
    </OverviewCard>
  );
}
