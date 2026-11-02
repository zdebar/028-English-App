import { useCallback, useState } from 'react';
import type { NoteType } from '@/types/generic.types';
import type { NoteDetail } from './note.types';

export function useNoteViewer(notes: readonly NoteType[] = []) {
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [noteData, setNoteData] = useState<NoteDetail | null>(null);

  const openNote = useCallback(
    (noteId: number | null | undefined) => {
      if (typeof noteId !== 'number') return;
      const note = notes.find((entry) => entry.id === noteId);
      if (!note) return;
      setNoteData(note);
      setIsNoteVisible(true);
    },
    [notes],
  );

  const closeNote = useCallback(() => {
    setIsNoteVisible(false);
  }, []);

  return {
    isNoteVisible,
    noteData,
    openNote,
    closeNote,
  };
}
