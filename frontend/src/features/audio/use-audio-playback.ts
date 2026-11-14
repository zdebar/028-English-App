import { useCallback, useEffect, useState } from 'react';
import { reportError } from '@/features/logging/logging-handler';
import { useAudioStore } from './use-audio-store';
import type { AudioLoaderState, ManagedAudio } from './use-audio-loader';

type PlaybackStateSetters = Readonly<{
  setIsPlaying: (isPlaying: boolean) => void;
  markAudioFailure: (filename: string) => void;
}>;

/** Provides playback controls for the audio elements managed by useAudioLoader. */
export function useAudioPlayback(loader: AudioLoaderState) {
  const volume = useAudioStore((state) => state.volume);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState<string | null>(loader.firstRequestedFilename);
  const [playbackStateInputKey, setPlaybackStateInputKey] = useState(loader.audioInputKey);
  const playbackStateMatchesInput = playbackStateInputKey === loader.audioInputKey;
  const audioStateMatchesInput = loader.audioStateMatchesInput && playbackStateMatchesInput;
  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    loader.audioEndedRef.current = handleAudioEnded;
  }, [handleAudioEnded, loader.audioEndedRef]);

  useEffect(() => {
    setPlaybackStateInputKey(loader.audioInputKey);
    setCurrent(loader.firstRequestedFilename);
    setIsPlaying(false);
  }, [loader.audioInputKey, loader.firstRequestedFilename]);

  const playAudio = useCallback(
    async (filenameOrEvent?: unknown): Promise<boolean> => {
      if (loader.audioInputKeyRef.current !== loader.audioInputKey || !audioStateMatchesInput) {
        return false;
      }

      stopAndResetAll(loader.audioMapRef.current);

      const filename = typeof filenameOrEvent === 'string' ? filenameOrEvent : undefined;
      const toPlay = resolveFilenameToPlay(filename, current, loader.filenames);
      if (!toPlay) {
        setIsPlaying(false);
        return false;
      }

      const pendingLoad = loader.loadPromisesRef.current.get(toPlay);
      if (pendingLoad) await pendingLoad;

      if (loader.audioInputKeyRef.current !== loader.audioInputKey) {
        setIsPlaying(false);
        return false;
      }

      const managedAudio = loader.audioMapRef.current.get(toPlay);
      if (!managedAudio) {
        setIsPlaying(false);
        return false;
      }

      managedAudio.element.currentTime = 0;
      managedAudio.element.volume = useAudioStore.getState().volume;

      try {
        const playPromise = managedAudio.element.play();
        setCurrent(toPlay);
        setIsPlaying(true);

        if (typeof playPromise.catch === 'function') {
          await playPromise;
        }

        return true;
      } catch (error) {
        handlePlaybackError(error, toPlay, {
          setIsPlaying,
          markAudioFailure: loader.markAudioFailure,
        });
        return false;
      }
    },
    [
      audioStateMatchesInput,
      current,
      loader.audioInputKey,
      loader.audioInputKeyRef,
      loader.audioMapRef,
      loader.filenames,
      loader.loadPromisesRef,
      loader.markAudioFailure,
    ],
  );

  const stopAudio = useCallback(() => {
    stopAndResetAll(loader.audioMapRef.current);
    setIsPlaying(false);
  }, [loader.audioMapRef]);

  useEffect(() => {
    loader.audioMapRef.current.forEach(({ element }) => {
      element.volume = volume;
    });
  }, [loader.audioMapRef, volume]);

  return {
    playAudio,
    stopAudio,
    isPlaying: audioStateMatchesInput ? isPlaying : false,
    current: audioStateMatchesInput ? current : null,
  };
}

/** Stops and resets all managed audio elements. */
function stopAndResetAll(audioMap: Map<string, ManagedAudio>): void {
  audioMap.forEach(({ element }) => {
    stopAndReset(element);
  });
}

/** Stops and resets one audio element to the start. */
function stopAndReset(element: HTMLAudioElement): void {
  element.pause();
  element.currentTime = 0;
}

function resolveFilenameToPlay(
  requestedFilename: string | undefined,
  currentFilename: string | null,
  filenames: string[],
): string | null {
  if (requestedFilename) return requestedFilename;
  if (currentFilename) return currentFilename;
  return filenames[0] ?? null;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

function handlePlaybackError(
  error: unknown,
  filename: string,
  setters: PlaybackStateSetters,
): void {
  setters.setIsPlaying(false);
  if (isAbortError(error)) return;

  reportError('Audio Playback Error', error);
  setters.markAudioFailure(filename);
}
