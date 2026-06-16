import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getById: vi.fn(),
  reportError: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/database/models/notes', () => ({
  default: {
    getById: (...args: unknown[]) => mocks.getById(...args),
  },
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    loadingError: 'Loading failed',
  },
}));

import { useNoteViewer } from '@/features/notes/use-note-viewer';

describe('useNoteViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens a note loaded by id and closes it again', async () => {
    mocks.getById.mockResolvedValue({ id: 1, name: 'Note', note: 'Body' });

    const { result } = renderHook(() => useNoteViewer());

    await act(async () => {
      await result.current.openNote(1);
    });

    await waitFor(() => expect(result.current.isNoteVisible).toBe(true));
    expect(result.current.noteData).toEqual({ id: 1, name: 'Note', note: 'Body' });

    act(() => {
      result.current.closeNote();
    });

    expect(result.current.isNoteVisible).toBe(false);
  });

  it('ignores missing ids and reports loading failures', async () => {
    const error = new Error('boom');
    mocks.getById.mockRejectedValue(error);

    const { result } = renderHook(() => useNoteViewer());

    await act(async () => {
      await result.current.openNote(null);
    });

    expect(mocks.getById).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.openNote(2);
    });

    expect(mocks.reportError).toHaveBeenCalledWith('Error fetching note:', error);
    expect(mocks.showToast).toHaveBeenCalledWith('Loading failed', 'error');
  });
});
