import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAudioMock = vi.fn();
const errorHandlerMock = vi.fn();

class MockAudio {
  src = '';
  volume = 1;
  currentTime = 0;
  play = vi.fn();
  pause = vi.fn();
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

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => errorHandlerMock(...args),
}));

import { useAudioManager } from '@/hooks/use-audio-manager';

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

  it('sets audioError for null audio and finishes loading', async () => {
    const { result } = renderHook(() => useAudioManager(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.audioError).toBe(true);
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
    expect(URL.createObjectURL as any as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });

  it('playAudio starts playback and ended event clears playing state', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });
    const { result } = renderHook(() => useAudioManager('file.opus'));

    await waitFor(() => expect(result.current.isAudioReady()).toBe(true));

    act(() => {
      result.current.playAudio();
    });

    expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      audioInstances[0].emit('ended');
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('setVolume clamps values and applies to audio element', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });
    const { result } = renderHook(() => useAudioManager('file.opus'));
    await waitFor(() => expect(result.current.isAudioReady()).toBe(true));

    act(() => {
      result.current.setVolume(2);
    });
    expect(audioInstances[0].volume).toBe(1);

    act(() => {
      result.current.setVolume(-1);
    });
    expect(audioInstances[0].volume).toBe(0);
  });

  it('handles load failure by setting error state and logging', async () => {
    getAudioMock.mockResolvedValue(null);

    const { result } = renderHook(() => useAudioManager('missing.opus'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.audioError).toBe(true);
    expect(errorHandlerMock).toHaveBeenCalledWith('Audio Manager Error', expect.any(Error));
  });

  it('cleans up audio and object URL on unmount', async () => {
    getAudioMock.mockResolvedValue({ audioBlob: new Blob(['a']) });
    const { result, unmount } = renderHook(() => useAudioManager('file.opus'));
    await waitFor(() => expect(result.current.isAudioReady()).toBe(true));

    unmount();

    expect(audioInstances[0].pause).toHaveBeenCalled();
    expect(URL.revokeObjectURL as any as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      'blob://audio-url',
    );
  });
});
