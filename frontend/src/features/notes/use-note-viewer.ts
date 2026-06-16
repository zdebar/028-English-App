import Notes from '@/database/models/notes';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useCallback, useState } from 'react';
import type { NoteDetail } from './NoteDetailCard';

export function useNoteViewer() {
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [noteData, setNoteData] = useState<NoteDetail | null>(null);
  const showToast = useToastStore((state) => state.showToast);

  const openNote = useCallback(
    async (noteId: number | null | undefined) => {
      if (typeof noteId !== 'number') return;

      try {
        const note = await Notes.getById(noteId);
        if (!note) return;

        setNoteData(note);
        setIsNoteVisible(true);
      } catch (error) {
        reportError('Error fetching note:', error);
        showToast(TEXTS.loadingError, 'error');
      }
    },
    [showToast],
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
