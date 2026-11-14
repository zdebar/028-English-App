import { useCallback, useEffect, useRef, useState } from 'react';
import { reportError } from '@/features/logging/logging-handler';
import { TEXTS } from '@/locales/cs';
import { useAudioStore } from './use-audio-store';
import type { ManagedAudio } from './use-audio-loader';

export type AudioPlaybackResult = Error | null;

type ActivePlayback = {
  audio: HTMLAudioElement;
  endedHandler: (() => void) | null;
};

/** Plays audio entries from the map returned by useAudioLoader. */
export function useAudioPlayback(
  audioMap: Map<string, ManagedAudio>,
  markAudioFailed: (filename: string, errorMessage: string) => void,
) {
  const volume = useAudioStore((state) => state.volume);
  const audioFilesKey = JSON.stringify([...audioMap.keys()]);
  const audioMapRef = useRef(audioMap);
  audioMapRef.current = audioMap;
  const activePlaybackRef = useRef<ActivePlayback | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    return () => stopCurrentAudio(activePlaybackRef);
  }, [audioFilesKey]);

  useEffect(() => {
    const activeAudio = activePlaybackRef.current?.audio;
    if (activeAudio) activeAudio.volume = volume;
  }, [volume]);

  const playAudio = useCallback(async (filename: string): Promise<AudioPlaybackResult> => {
    const entry = audioMapRef.current.get(filename);
    if (entry?.errorMessage) return new Error(entry.errorMessage);
    if (!entry?.audio) return new Error(TEXTS.noAudio);

    stopCurrentAudio(activePlaybackRef);
    const audio = entry.audio;
    audio.currentTime = 0;
    audio.volume = useAudioStore.getState().volume;

    const activePlayback: ActivePlayback = { audio, endedHandler: null };
    activePlaybackRef.current = activePlayback;
    const handleEnded = () => {
      if (activePlaybackRef.current !== activePlayback) return;
      activePlaybackRef.current = null;
      audio.removeEventListener('ended', handleEnded);
      setIsPlaying(false);
    };
    activePlayback.endedHandler = handleEnded;
    audio.addEventListener('ended', handleEnded);

    try {
      const playPromise = audio.play();
      setIsPlaying(true);
      await playPromise;
      return null;
    } catch (error) {
      if (activePlaybackRef.current !== activePlayback) return null;

      stopCurrentAudio(activePlaybackRef);
      setIsPlaying(false);
      const playbackError = toError(error);
      if (isAbortError(playbackError)) return null;

      reportError('Audio Playback Error', error);
      markAudioFailed(filename, 'Error on play');
      return playbackError;
    }
  }, [markAudioFailed]);

  const stopAudio = useCallback(() => {
    stopCurrentAudio(activePlaybackRef);
    setIsPlaying(false);
  }, []);

  return { playAudio, stopAudio, isPlaying };
}

function stopCurrentAudio(
  activePlaybackRef: { current: ActivePlayback | null },
): void {
  const activePlayback = activePlaybackRef.current;
  if (!activePlayback) return;

  activePlayback.audio.pause();
  activePlayback.audio.currentTime = 0;
  if (activePlayback.endedHandler) {
    activePlayback.audio.removeEventListener('ended', activePlayback.endedHandler);
  }
  activePlaybackRef.current = null;
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

function isAbortError(error: Error): boolean {
  return error.name === 'AbortError';
}
