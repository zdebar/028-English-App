import { useCallback, useEffect, useRef, useState } from 'react';
import AudioRecord from '@/database/models/audio-records';
import { reportError } from '@/features/logging/logging-handler';
import { useAudioStore } from './use-audio-store';
import { AudioFileNotFoundError } from '@/types/error.types';
import type { AudioRecordLocal } from '@/types/audio.types';

type AudioInput = string | string[] | null;
type ManagedAudio = {
  element: HTMLAudioElement;
  onEnded: () => void;
};
type AudioLoadPromise = Promise<boolean>;
type AudioLoadResolver = (loaded: boolean) => void;
type PlaybackStateSetters = Readonly<{
  setIsPlaying: (isPlaying: boolean) => void;
  setFailedFilenames: (update: (previous: Set<string>) => Set<string>) => void;
  setAudioError: (audioError: boolean) => void;
}>;

const AUDIO_DOWNLOAD_CONCURRENCY = 6;

/**
 * Hook to manage preloading and playback of audio files stored in the local
 * IndexedDB (via `AudioRecord` model). It keeps a small in-memory map of
 * `HTMLAudioElement`s and exposes controls for playing/stopping audio and
 * adjusting volume.
 *
 * @param audio - single filename, array of filenames, or null. The hook will
 *                attempt to preload the provided files from the IndexedDB.
 * @returns An object with playback controls and status flags.
 */
export function useAudioManager(audio: AudioInput) {
  const audioMapRef = useRef<Map<string, ManagedAudio>>(new Map());
  const loadPromisesRef = useRef<Map<string, AudioLoadPromise>>(new Map());
  const loadGenerationRef = useRef(0);
  const volume = useAudioStore((state) => state.volume);
  const audioInputKey = getAudioInputKey(audio);
  const requestedFilenames = getAudioFilesFromInputKey(audioInputKey);
  const audioInputKeyRef = useRef(audioInputKey);
  audioInputKeyRef.current = audioInputKey;
  const [audioStateInputKey, setAudioStateInputKey] = useState(audioInputKey);
  const [audioError, setAudioError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filenames, setFilenames] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [failedFilenames, setFailedFilenames] = useState<Set<string>>(new Set());
  const audioStateMatchesInput = audioStateInputKey === audioInputKey;

  // Load audio files
  useEffect(() => {
    let isDisposed = false;
    const files = getAudioFilesFromInputKey(audioInputKey);
    const loadGeneration = loadGenerationRef.current + 1;
    loadGenerationRef.current = loadGeneration;
    setAudioStateInputKey(audioInputKey);
    setLoading(true);
    setAudioError(false);
    setIsPlaying(false);
    setFailedFilenames(new Set());
    disposeAudioMap(audioMapRef.current);
    loadPromisesRef.current.clear();

    setFilenames(files);
    setCurrent(files[0] ?? null);

    if (!files.length) {
      setAudioError(false);
      setLoading(false);
      return;
    }

    const handleAudioEnded = () => {
      setIsPlaying(false);
    };
    const resolveLoads = new Map<string, AudioLoadResolver>();
    files.forEach((filename) => {
      const deferredLoad = createDeferredAudioLoad();
      loadPromisesRef.current.set(filename, deferredLoad.promise);
      resolveLoads.set(filename, deferredLoad.resolve);
    });

    const isCurrentLoad = () => !isDisposed && loadGenerationRef.current === loadGeneration;
    const resolveLoad = (filename: string, loaded: boolean) => {
      resolveLoads.get(filename)?.(loaded);
    };
    const failedFiles = new Set<string>();
    const downloadedRecords: AudioRecordLocal[] = [];

    const loadAllAudio = async () => {
      const cachedRecords = await AudioRecord.getCachedByFilenames(files);
      const missingFiles: string[] = [];

      cachedRecords.forEach((record, index) => {
        const filename = files[index];
        if (!filename) return;
        if (!record) {
          missingFiles.push(filename);
          return;
        }

        const didLoad = loadAudioRecord(
          filename,
          record,
          handleAudioEnded,
          isCurrentLoad,
          audioMapRef.current,
        );
        if (!didLoad) failedFiles.add(filename);
        resolveLoad(filename, didLoad);
      });

      await runWithConcurrency(missingFiles, AUDIO_DOWNLOAD_CONCURRENCY, async (filename) => {
        try {
          const audioRecord = await AudioRecord.downloadByFilename(filename);
          downloadedRecords.push(audioRecord);
          const didLoad = loadAudioRecord(
            filename,
            audioRecord,
            handleAudioEnded,
            isCurrentLoad,
            audioMapRef.current,
          );
          if (!didLoad) failedFiles.add(filename);
          resolveLoad(filename, didLoad);
        } catch (error) {
          if (!(error instanceof AudioFileNotFoundError)) {
            reportError('Audio Manager Error', error);
          }
          failedFiles.add(filename);
          resolveLoad(filename, false);
        }
      });

      if (downloadedRecords.length > 0) {
        try {
          await AudioRecord.cacheAudioRecords(downloadedRecords);
        } catch (error) {
          reportError('Audio Cache Error', error);
        }
      }

      if (isCurrentLoad()) {
        setFailedFilenames(new Set(failedFiles));
        setAudioError(failedFiles.size > 0);
      }
    };

    void loadAllAudio()
      .catch((error: unknown) => {
        reportError('Audio Manager Error', error);
        files.forEach((filename) => {
          failedFiles.add(filename);
          resolveLoad(filename, false);
        });
        if (isCurrentLoad()) {
          setFailedFilenames(new Set(failedFiles));
          setAudioError(true);
        }
      })
      .finally(() => {
        if (isCurrentLoad()) setLoading(false);
      });

    return () => {
      isDisposed = true;
      resolveLoads.forEach((resolve) => resolve(false));
      if (loadGenerationRef.current === loadGeneration) {
        loadGenerationRef.current += 1;
      }
      loadPromisesRef.current.clear();
      disposeAudioMap(audioMapRef.current);
    };
  }, [audioInputKey]);

  // Play audio: ignore non-string args (e.g., React click events),
  // then play current by default or a specific filename when provided.

  const playAudio = useCallback(
    async (filenameOrEvent?: unknown): Promise<boolean> => {
      if (audioInputKeyRef.current !== audioInputKey || !audioStateMatchesInput) {
        return false;
      }

      stopAndResetAll(audioMapRef.current);

      const filename = typeof filenameOrEvent === 'string' ? filenameOrEvent : undefined;
      const toPlay = resolveFilenameToPlay(filename, current, filenames);
      if (!toPlay) {
        setIsPlaying(false);
        return false;
      }

      const pendingLoad = loadPromisesRef.current.get(toPlay);
      if (pendingLoad) await pendingLoad;

      if (audioInputKeyRef.current !== audioInputKey) {
        setIsPlaying(false);
        return false;
      }

      const managedAudio = audioMapRef.current.get(toPlay);
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
          setFailedFilenames,
          setAudioError,
        });
        return false;
      }
    },
    [audioInputKey, audioStateMatchesInput, current, filenames],
  );

  const stopAudio = useCallback(() => {
    stopAndResetAll(audioMapRef.current);
    setIsPlaying(false);
  }, []);

  const isAudioReady = useCallback(
    (filename?: string) => {
      if (audioInputKeyRef.current !== audioInputKey || !audioStateMatchesInput) {
        return false;
      }

      if (filename) {
        return audioMapRef.current.has(filename) && !failedFilenames.has(filename);
      }

      return audioMapRef.current.size > 0;
    },
    [audioInputKey, audioStateMatchesInput, failedFilenames],
  );

  const effectiveAudioError = audioStateMatchesInput ? audioError : false;
  const effectiveLoading = audioStateMatchesInput ? loading : requestedFilenames.length > 0;
  const effectiveIsPlaying = audioStateMatchesInput ? isPlaying : false;
  const effectiveCurrent = audioStateMatchesInput ? current : null;
  const effectiveFilenames = audioStateMatchesInput ? filenames : [];

  useEffect(() => {
    audioMapRef.current.forEach(({ element }) => {
      element.volume = volume;
    });
  }, [volume]);

  return {
    playAudio, // playAudio() or playAudio(filename)
    stopAudio,
    audioError: effectiveAudioError,
    isAudioReady,
    loading: effectiveLoading,
    isPlaying: effectiveIsPlaying,
    current: effectiveCurrent,
    filenames: effectiveFilenames,
  };
}

/** Stops and resets one audio element to the start. */
function stopAndReset(element: HTMLAudioElement): void {
  element.pause();
  element.currentTime = 0;
}

/** Stops and resets all managed audio elements. */
function stopAndResetAll(audioMap: Map<string, ManagedAudio>): void {
  audioMap.forEach(({ element }) => stopAndReset(element));
}

/** Disposes all managed audio elements and revokes their object URLs. */
function disposeAudioMap(audioMap: Map<string, ManagedAudio>): void {
  audioMap.forEach(disposeManagedAudio);
  audioMap.clear();
}

function disposeManagedAudio({ element, onEnded }: ManagedAudio): void {
  stopAndReset(element);
  element.removeEventListener('ended', onEnded);
  const objectUrl = element.src;
  if (!objectUrl.startsWith('blob:')) return;
  element.removeAttribute('src');
  element.load();
  URL.revokeObjectURL(objectUrl);
}

/** Normalizes audio input to a deduplicated list of filenames. */
function normalizeAudioInput(audio: AudioInput): string[] {
  if (typeof audio === 'string' && audio) return [audio];
  if (!Array.isArray(audio)) return [];
  return [...new Set(audio.filter(Boolean))];
}

function getAudioInputKey(audio: AudioInput): string {
  return JSON.stringify(normalizeAudioInput(audio));
}

function getAudioFilesFromInputKey(inputKey: string): string[] {
  return JSON.parse(inputKey) as string[];
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
  setters.setFailedFilenames((previous) => new Set(previous).add(filename));
  setters.setAudioError(true);
}

function loadAudioRecord(
  filename: string,
  audioRecord: AudioRecordLocal,
  onEnded: () => void,
  isCurrentLoad: () => boolean,
  audioMap: Map<string, ManagedAudio>,
): boolean {
  if (!isCurrentLoad()) return false;

  try {
    if (!audioRecord?.audioBlob) throw new Error('Audio not found');

    const objectUrl = URL.createObjectURL(audioRecord.audioBlob);
    const audioElement = new Audio(objectUrl);
    audioElement.addEventListener('ended', onEnded);
    audioMap.set(filename, { element: audioElement, onEnded });
    return true;
  } catch (error) {
    reportError('Audio Manager Error', error);
    return false;
  }
}

function createDeferredAudioLoad(): Readonly<{
  promise: AudioLoadPromise;
  resolve: AudioLoadResolver;
}> {
  let resolvePromise!: AudioLoadResolver;
  const promise = new Promise<boolean>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

async function runWithConcurrency<T>(
  values: readonly T[],
  concurrency: number,
  operation: (value: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const workerCount = Math.min(values.length, concurrency);
  const processNext = async (): Promise<void> => {
    const currentIndex = nextIndex;
    if (currentIndex >= values.length) return;

    nextIndex += 1;
    const value = values[currentIndex];
    if (value !== undefined) await operation(value);
    return processNext();
  };
  const workers = Array.from({ length: workerCount }, () => processNext());
  await Promise.all(workers);
}
