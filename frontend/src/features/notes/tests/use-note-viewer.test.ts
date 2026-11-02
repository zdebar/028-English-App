import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notes: [] as Array<{ id: number; name: string; note?: string }>,
}));

vi.mock('@/database/state/data-store', () => ({
  useDataManager: (selector: (state: any) => unknown) => selector({ notes: mocks.notes }),
}));

import { useNoteViewer } from '@/features/notes/use-note-viewer';

describe('useNoteViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notes = [{ id: 1, name: 'Note', note: 'Body' }];
  });

  it('opens a note from central data and closes it again', () => {
    const { result } = renderHook(() => useNoteViewer());

    act(() => {
      result.current.openNote(1);
    });

    expect(result.current.isNoteVisible).toBe(true);
    expect(result.current.noteData).toEqual({ id: 1, name: 'Note', note: 'Body' });

    act(() => {
      result.current.closeNote();
    });

    expect(result.current.isNoteVisible).toBe(false);
  });

  it('ignores missing ids and notes that are not in the central dataset', () => {
    const { result } = renderHook(() => useNoteViewer());

    act(() => {
      result.current.openNote(null);
      result.current.openNote(2);
    });

    expect(result.current.isNoteVisible).toBe(false);
    expect(result.current.noteData).toBeNull();
  });
});
