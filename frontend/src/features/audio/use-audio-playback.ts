import { useCallback, useEffect, useRef, useState } from 'react';
import { reportError } from '@/features/logging/logging-handler';
import { useAudioStore } from './use-audio-store';
import type { ManagedAudio } from './use-audio-loader';

type AudioWaiter = Readonly<{
  filename: string;
  inputKey: string;
  resolve: (entry: ManagedAudio | null) => void;
}>;

type ActiveEndHandler = Readonly<{
  audio: HTMLAudioElement;
  handler: () => void;
}>;

type PlaybackActions = Readonly<{
  activeEndHandlerRef: { current: ActiveEndHandler | null };
  clearActiveEndHandler: (audio?: HTMLAudioElement) => void;
  playRequestRef: { current: number };
  setCurrent: (filename: string) => void;
  setFailedFilenames: (update: (previous: Set<string>) => Set<string>) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}>;

/** Plays audio entries from the map returned by useAudioLoader. */
export function useAudioPlayback(audioMap: Map<string, ManagedAudio>) {
  const volume = useAudioStore((state) => state.volume);
  const audioFilesKey = JSON.stringify([...audioMap.keys()]);
  const firstFilename = audioMap.keys().next().value ?? null;
  const audioMapRef = useRef(audioMap);
  audioMapRef.current = audioMap;
  const audioFilesKeyRef = useRef(audioFilesKey);
  audioFilesKeyRef.current = audioFilesKey;
  const waitersRef = useRef<AudioWaiter[]>([]);
  const activeEndHandlerRef = useRef<ActiveEndHandler | null>(null);
  const playRequestRef = useRef(0);
  const [playbackStateInputKey, setPlaybackStateInputKey] = useState(audioFilesKey);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState<string | null>(firstFilename);
  const [failedFilenames, setFailedFilenames] = useState<Set<string>>(new Set());
  const playbackStateMatchesInput = playbackStateInputKey === audioFilesKey;
  const clearActiveEndHandler = useCallback((audio?: HTMLAudioElement) => {
    const activeEndHandler = activeEndHandlerRef.current;
    if (!activeEndHandler || (audio && activeEndHandler.audio !== audio)) return;

    activeEndHandler.audio.removeEventListener('ended', activeEndHandler.handler);
    activeEndHandlerRef.current = null;
  }, []);

  useEffect(() => {
    resolveAudioWaiters(audioMap, audioFilesKey, waitersRef);
  }, [audioFilesKey, audioMap]);

  useEffect(() => {
    setPlaybackStateInputKey(audioFilesKey);
    setCurrent(firstFilename);
    setIsPlaying(false);
    setFailedFilenames(new Set());

    return () => {
      playRequestRef.current += 1;
      clearActiveEndHandler();
    };
  }, [audioFilesKey, clearActiveEndHandler, firstFilename]);

  useEffect(() => {
    audioMap.forEach(({ audio }) => {
      if (audio) audio.volume = volume;
    });
  }, [audioMap, volume]);

  useEffect(
    () => () => {
      resolveAllAudioWaiters(waitersRef);
    },
    [],
  );

  const playAudio = useCallback(
    async (filenameOrEvent?: unknown): Promise<boolean> => {
      const filename = getRequestedAudioFilename(
        filenameOrEvent,
        current,
        audioMapRef.current,
      );
      if (!isAudioRequestCurrent(audioFilesKey, audioFilesKeyRef.current, playbackStateMatchesInput)) {
        return false;
      }
      if (!filename || !audioMapRef.current.has(filename)) {
        setIsPlaying(false);
        return false;
      }

      const playRequest = startAudioRequest(
        playRequestRef,
        audioMapRef.current,
        clearActiveEndHandler,
      );

      const entry = await waitForAudioEntry(
        filename,
        audioFilesKey,
        audioMapRef,
        audioFilesKeyRef,
        waitersRef,
      );
      if (!isAudioRequestCurrent(audioFilesKey, audioFilesKeyRef.current, playbackStateMatchesInput)
        || playRequest !== playRequestRef.current) {
        setIsPlaying(false);
        return false;
      }

      if (!entry?.audio || entry.errorMessage !== null) {
        setIsPlaying(false);
        return false;
      }

      return playAudioElement(filename, entry.audio, playRequest, {
        activeEndHandlerRef,
        clearActiveEndHandler,
        playRequestRef,
        setCurrent,
        setFailedFilenames,
        setIsPlaying,
      });
    },
    [
      audioFilesKey,
      clearActiveEndHandler,
      current,
      playbackStateMatchesInput,
    ],
  );

  const stopAudio = useCallback(() => {
    playRequestRef.current += 1;
    clearActiveEndHandler();
    stopAndResetAll(audioMapRef.current);
    setIsPlaying(false);
  }, [clearActiveEndHandler]);

  const isAudioReady = useCallback(
    (filename?: string) => {
      if (audioFilesKeyRef.current !== audioFilesKey || !playbackStateMatchesInput) {
        return false;
      }

      if (filename) {
        return isManagedAudioReady(filename, audioMapRef.current.get(filename), failedFilenames);
      }

      return [...audioMapRef.current].some(([audioFilename, entry]) =>
        isManagedAudioReady(audioFilename, entry, failedFilenames),
      );
    },
    [audioFilesKey, failedFilenames, playbackStateMatchesInput],
  );

  return {
    playAudio,
    stopAudio,
    audioError: playbackStateMatchesInput && failedFilenames.size > 0,
    isAudioReady,
    isPlaying: playbackStateMatchesInput ? isPlaying : false,
    current: playbackStateMatchesInput ? current : null,
  };
}

function waitForAudioEntry(
  filename: string,
  inputKey: string,
  audioMapRef: { current: Map<string, ManagedAudio> },
  audioFilesKeyRef: { current: string },
  waitersRef: { current: AudioWaiter[] },
): Promise<ManagedAudio | null> {
  if (audioFilesKeyRef.current !== inputKey) return Promise.resolve(null);

  const entry = audioMapRef.current.get(filename);
  if (!entry?.isLoading) return Promise.resolve(entry ?? null);

  return new Promise((resolve) => {
    waitersRef.current.push({ filename, inputKey, resolve });
  });
}

function resolveAudioWaiters(
  audioMap: Map<string, ManagedAudio>,
  inputKey: string,
  waiters: { current: AudioWaiter[] },
): void {
  waiters.current = waiters.current.filter((waiter) => {
    if (waiter.inputKey !== inputKey) {
      waiter.resolve(null);
      return false;
    }

    const entry = audioMap.get(waiter.filename);
    if (entry && !entry.isLoading) {
      waiter.resolve(entry);
      return false;
    }
    return true;
  });
}

function resolveAllAudioWaiters(waiters: { current: AudioWaiter[] }): void {
  waiters.current.forEach((waiter) => waiter.resolve(null));
  waiters.current = [];
}

function stopAndResetAll(audioMap: Map<string, ManagedAudio>): void {
  audioMap.forEach(({ audio }) => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  });
}

function resolveFilenameToPlay(
  requestedFilename: string | undefined,
  currentFilename: string | null,
  audioMap: Map<string, ManagedAudio>,
): string | null {
  if (requestedFilename) return requestedFilename;
  if (currentFilename) return currentFilename;
  return audioMap.keys().next().value ?? null;
}

function getRequestedAudioFilename(
  filenameOrEvent: unknown,
  currentFilename: string | null,
  audioMap: Map<string, ManagedAudio>,
): string | null {
  const requestedFilename = typeof filenameOrEvent === 'string' ? filenameOrEvent : undefined;
  return resolveFilenameToPlay(requestedFilename, currentFilename, audioMap);
}

function isAudioRequestCurrent(
  inputKey: string,
  currentInputKey: string,
  stateMatchesInput: boolean,
): boolean {
  return currentInputKey === inputKey && stateMatchesInput;
}

function startAudioRequest(
  playRequestRef: { current: number },
  audioMap: Map<string, ManagedAudio>,
  clearActiveEndHandler: (audio?: HTMLAudioElement) => void,
): number {
  playRequestRef.current += 1;
  stopAndResetAll(audioMap);
  clearActiveEndHandler();
  return playRequestRef.current;
}

async function playAudioElement(
  filename: string,
  audio: HTMLAudioElement,
  playRequest: number,
  actions: PlaybackActions,
): Promise<boolean> {
  audio.currentTime = 0;
  audio.volume = useAudioStore.getState().volume;
  const handleEnded = () => {
    if (actions.activeEndHandlerRef.current?.audio !== audio) return;
    actions.setIsPlaying(false);
    actions.clearActiveEndHandler(audio);
  };
  audio.addEventListener('ended', handleEnded);
  actions.activeEndHandlerRef.current = { audio, handler: handleEnded };

  try {
    const playPromise = audio.play();
    actions.setCurrent(filename);
    actions.setIsPlaying(true);
    await playPromise;
    return true;
  } catch (error) {
    if (playRequest !== actions.playRequestRef.current) return false;
    actions.clearActiveEndHandler(audio);
    handlePlaybackError(error, filename, actions.setFailedFilenames);
    actions.setIsPlaying(false);
    return false;
  }
}

function isManagedAudioReady(
  filename: string,
  entry: ManagedAudio | undefined,
  failedFilenames: ReadonlySet<string>,
): boolean {
  return Boolean(entry?.audio) && entry?.errorMessage === null && !failedFilenames.has(filename);
}

function handlePlaybackError(
  error: unknown,
  filename: string,
  setFailedFilenames: (update: (previous: Set<string>) => Set<string>) => void,
): void {
  if (isAbortError(error)) return;

  reportError('Audio Playback Error', error);
  setFailedFilenames((previous) => new Set(previous).add(filename));
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}
