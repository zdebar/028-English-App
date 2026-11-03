import GrammarDetailCard from '@/features/grammar/GrammarDetailCard';
import NoteDetailCard from '@/features/notes/NoteDetailCard';
import type { GroupType } from '@/types/table.types';
import type { GrammarChunkWithExamples } from '@/database/state/data-types';
import type { NoteType } from '@/types/generic.types';
import PronunciationSoundDetailCard from './PronunciationSoundDetailCard';
import type { PronunciationSegment } from '@/features/pronunciation/pronunciation.utils';
import type { PracticeDetail } from './practice-session-card.types';

type PracticeSessionDetailProps = Readonly<{
  visibleDetail: PracticeDetail;
  grammar: GrammarChunkWithExamples | null;
  note: NoteType | null;
  sounds: readonly GroupType[];
  pronunciationSegments: readonly PronunciationSegment[];
  audio: string | null | undefined;
  selectedSoundIndex: number;
  onClose: () => void;
  onSoundIndexChange: (index: number) => void;
}>;

export default function PracticeSessionDetail({
  visibleDetail,
  grammar,
  note,
  sounds,
  pronunciationSegments,
  audio,
  selectedSoundIndex,
  onClose,
  onSoundIndexChange,
}: PracticeSessionDetailProps) {
  if (visibleDetail === 'grammar') {
    return (
      <GrammarDetailCard
        grammar={grammar ? { ...grammar, kind: 'chunk' } : null}
        onClose={onClose}
      />
    );
  }

  if (visibleDetail === 'note') return <NoteDetailCard note={note} onClose={onClose} />;

  return (
    <PronunciationSoundDetailCard
      sounds={sounds}
      pronunciationSegments={pronunciationSegments}
      audio={audio}
      index={selectedSoundIndex}
      onIndexChange={onSoundIndexChange}
      onClose={onClose}
    />
  );
}
