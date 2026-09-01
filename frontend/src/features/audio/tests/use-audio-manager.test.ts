import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAudioMock = vi.fn();
const errorHandlerMock = vi.fn();

class MockAudio {
  src = '';
  volume = 1;
  currentTime = 0;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn((attribute: string) => {
    if (attribute === 'src') this.src = '';
  });
  private listeners: Record<string, Array<() => void>> = {};

  addEventListener(type: string, cb: () => void) {
    this.listeners[type] = this.listeners[type] ?? [];
    this.listeners[type].push(cb);
  }

  removeEventListener(type: string, cb: () => void) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((x) => x !== cb);
  }

  emit(type: string) {
    (this.listeners[type] ?? []).forEach((cb) => cb());
  }
}

const audioInstances: MockAudio[] = [];

vi.mock('@/database/models/audio-records', () => ({
  default: {
    getByFilename: (...args: unknown[]) => getAudioMock(...args),
  },
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => errorHandlerMock(...args),
}));

import { useAudioManager } from '@/features/audio/use-audio-manager';
import { useAudioStore } from '@/features/audio/use-audio-store';

describe('useAudioManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    audioInstances.length = 0;

    class MockAudioCtor extends MockAudio {
      constructor(src?: string) {
        super();
        this.src = src ?? '';
        audioInstances.push(this);
      }
    }

    vi.stubGlobal('Audio', MockAudioCtor as any);

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob://audio-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('treats null audio as a non-error empty state and finishes loading', async () => {
    const { result } = renderHook(() => useAudioManager(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.audioError).toBe(false);
    expect(result.current.isAudioReady()).toBe(false);
  });

  it('loads audio successfully and exposes ready state', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });

    const { result } = renderHook(() => useAudioManager('file.opus'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.audioError).toBe(false);
      expect(result.current.isAudioReady()).toBe(true);
    });

    expect(getAudioMock).toHaveBeenCalledWith('file.opus');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('playAudio starts playback and ended event clears playing state', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });
    const { result } = renderHook(() => useAudioManager('file.opus'));

    await waitFor(() => expect(result.current.isAudioReady()).toBe(true));

    await act(async () => {
      await result.current.playAudio();
    });

    expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      audioInstances[0].emit('ended');
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('waits for an in-flight preload before playing', async () => {
    let resolveAudio: ((value: { audioBlob: Blob }) => void) | undefined;
    getAudioMock.mockReturnValue(
      new Promise<{ audioBlob: Blob }>((resolve) => {
        resolveAudio = resolve;
      }),
    );
    const { result } = renderHook(() => useAudioManager('file.opus'));

    let playback: Promise<boolean> | undefined;
    act(() => {
      playback = result.current.playAudio('file.opus');
    });
    expect(audioInstances).toHaveLength(0);

    let didPlay = false;
    await act(async () => {
      resolveAudio?.({ audioBlob: new Blob(['a']) });
      didPlay = (await playback) ?? false;
    });

    expect(didPlay).toBe(true);
    expect(getAudioMock).toHaveBeenCalledTimes(1);
    expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
  });

  it('deduplicates repeated filenames during preload', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });
    const filenames = ['file.opus', 'file.opus'];
    const { result } = renderHook(() => useAudioManager(filenames));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getAudioMock).toHaveBeenCalledTimes(1);
    expect(result.current.filenames).toEqual(['file.opus']);
  });

  it('playAudio ignores non-string arg and still plays current audio', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });
    const { result } = renderHook(() => useAudioManager('file.opus'));

    await waitFor(() => expect(result.current.isAudioReady()).toBe(true));

    await act(async () => {
      await result.current.playAudio({ type: 'click' });
    });

    expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    expect(result.current.current).toBe('file.opus');
    expect(result.current.isPlaying).toBe(true);
  });

  it('applies current volume from audio store on play', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });
    const { result } = renderHook(() => useAudioManager('file.opus'));
    await waitFor(() => expect(result.current.isAudioReady()).toBe(true));

    await act(async () => {
      useAudioStore.getState().setVolume(0.25);
      await result.current.playAudio();
    });

    expect(audioInstances[0].volume).toBe(0.25);
  });

  it('handles load failure by setting error state and logging', async () => {
    getAudioMock.mockResolvedValue(null);

    const { result } = renderHook(() => useAudioManager('missing.opus'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.audioError).toBe(true);
    expect(result.current.isAudioReady('missing.opus')).toBe(false);
    expect(errorHandlerMock).toHaveBeenCalledWith('Audio Manager Error', expect.any(Error));
  });

  it('does not expose the previous audio error while loading a new file', async () => {
    let resolveNewAudio: ((value: { audioBlob: Blob }) => void) | undefined;
    getAudioMock.mockImplementation((filename: string) => {
      if (filename === 'missing.opus') return Promise.resolve(null);
      return new Promise<{ audioBlob: Blob }>((resolve) => {
        resolveNewAudio = resolve;
      });
    });

    const renders: Array<{
      filename: string;
      audioError: boolean;
      loading: boolean;
      isPlaying: boolean;
    }> = [];
    const { result, rerender } = renderHook(
      ({ filename }: { filename: string }) => {
        const state = useAudioManager(filename);
        renders.push({
          filename,
          audioError: state.audioError,
          loading: state.loading,
          isPlaying: state.isPlaying,
        });
        return state;
      },
      { initialProps: { filename: 'missing.opus' } },
    );

    await waitFor(() => expect(result.current.audioError).toBe(true));
    renders.length = 0;

    rerender({ filename: 'new.opus' });

    expect(renders[0]).toEqual({
      filename: 'new.opus',
      audioError: false,
      loading: true,
      isPlaying: false,
    });
    expect(result.current.isAudioReady('missing.opus')).toBe(false);

    let didPlay = true;
    await act(async () => {
      didPlay = await result.current.playAudio('missing.opus');
    });
    expect(didPlay).toBe(false);
    expect(audioInstances).toHaveLength(0);

    await act(async () => {
      resolveNewAudio?.({ audioBlob: new Blob(['new']) });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isAudioReady('new.opus')).toBe(true);
    });
    expect(result.current.audioError).toBe(false);
  });

  it('returns an immediate empty state when switching from failed audio to no audio', async () => {
    getAudioMock.mockResolvedValue(null);
    const { result, rerender } = renderHook(
      ({ audio }: { audio: string | null }) => useAudioManager(audio),
      { initialProps: { audio: 'missing.opus' as string | null } },
    );

    await waitFor(() => expect(result.current.audioError).toBe(true));

    rerender({ audio: null });

    expect(result.current.audioError).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isAudioReady()).toBe(false);
  });

  it('marks audio as failed when playback rejects', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });
    const { result } = renderHook(() => useAudioManager('file.opus'));

    await waitFor(() => expect(result.current.isAudioReady('file.opus')).toBe(true));
    audioInstances[0].play.mockRejectedValue(new Error('play failed'));

    let didPlay = true;
    await act(async () => {
      didPlay = await result.current.playAudio('file.opus');
    });

    expect(didPlay).toBe(false);
    expect(result.current.audioError).toBe(true);
    expect(result.current.isAudioReady('file.opus')).toBe(false);
    expect(errorHandlerMock).toHaveBeenCalledWith('Audio Playback Error', expect.any(Error));
  });

  it('cleans up audio and object URL on unmount', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });
    const { result, unmount } = renderHook(() => useAudioManager('file.opus'));
    await waitFor(() => expect(result.current.isAudioReady()).toBe(true));

    unmount();

    expect(audioInstances[0].pause).toHaveBeenCalled();
    expect(audioInstances[0].removeAttribute).toHaveBeenCalledWith('src');
    expect(audioInstances[0].load).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://audio-url');
  });

  it('disposes an in-flight load that finishes after unmount', async () => {
    let resolveAudio: ((value: { audioBlob: Blob }) => void) | undefined;
    getAudioMock.mockReturnValue(
      new Promise<{ audioBlob: Blob }>((resolve) => {
        resolveAudio = resolve;
      }),
    );
    const { unmount } = renderHook(() => useAudioManager('file.opus'));
    unmount();

    await act(async () => {
      resolveAudio?.({ audioBlob: new Blob(['a']) });
      await Promise.resolve();
    });

    expect(audioInstances).toHaveLength(1);
    expect(audioInstances[0].play).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://audio-url');
  });

  it('disposes a stale in-flight load after the requested filename changes', async () => {
    let resolveOldAudio: ((value: { audioBlob: Blob }) => void) | undefined;
    getAudioMock.mockImplementation((filename: string) => {
      if (filename === 'old.opus') {
        return new Promise<{ audioBlob: Blob }>((resolve) => {
          resolveOldAudio = resolve;
        });
      }
      return Promise.resolve({ audioBlob: new Blob(['new']) });
    });
    const { result, rerender } = renderHook(({ filename }) => useAudioManager(filename), {
      initialProps: { filename: 'old.opus' },
    });

    rerender({ filename: 'new.opus' });
    await waitFor(() => expect(result.current.isAudioReady('new.opus')).toBe(true));
    await act(async () => {
      resolveOldAudio?.({ audioBlob: new Blob(['old']) });
      await Promise.resolve();
    });

    expect(result.current.isAudioReady('old.opus')).toBe(false);
    expect(result.current.isAudioReady('new.opus')).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://audio-url');
  });
});
