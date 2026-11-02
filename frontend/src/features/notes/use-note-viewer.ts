import { useCallback, useState } from 'react';
import { useDataManager } from '@/database/state/data-store';
import type { NoteDetail } from './note.types';

export function useNoteViewer() {
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [noteData, setNoteData] = useState<NoteDetail | null>(null);
  const notes = useDataManager((state) => state.notes);

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
