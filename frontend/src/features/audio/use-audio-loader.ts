import { useCallback, useEffect, useRef, useState } from 'react';
import AudioRecord from '@/database/models/audio-records';
import { reportError } from '@/features/logging/logging-handler';
import { AudioFileNotFoundError } from '@/types/error.types';
import type { AudioRecordLocal } from '@/types/audio.types';

export type AudioInput = string | string[] | null;

export type ManagedAudio = Readonly<{
  element: HTMLAudioElement;
  onEnded: () => void;
}>;

type AudioLoadPromise = Promise<boolean>;
type AudioLoadResolver = (loaded: boolean) => void;

export type AudioLoaderState = Readonly<{
  audioInputKey: string;
  audioInputKeyRef: { current: string };
  audioMapRef: { current: Map<string, ManagedAudio> };
  loadPromisesRef: { current: Map<string, AudioLoadPromise> };
  audioEndedRef: { current: () => void };
  audioStateMatchesInput: boolean;
  audioError: boolean;
  isAudioReady: (filename?: string) => boolean;
  loading: boolean;
  filenames: string[];
  firstRequestedFilename: string | null;
  markAudioFailure: (filename: string) => void;
}>;

const AUDIO_DOWNLOAD_CONCURRENCY = 6;

/** Loads audio records and owns their HTMLAudioElement lifecycle. */
export function useAudioLoader(audio: AudioInput): AudioLoaderState {
  const audioMapRef = useRef<Map<string, ManagedAudio>>(new Map());
  const loadPromisesRef = useRef<Map<string, AudioLoadPromise>>(new Map());
  const audioEndedRef = useRef<() => void>(() => undefined);
  const loadGenerationRef = useRef(0);
  const audioInputKey = getAudioInputKey(audio);
  const requestedFilenames = getAudioFilesFromInputKey(audioInputKey);
  const audioInputKeyRef = useRef(audioInputKey);
  audioInputKeyRef.current = audioInputKey;
  const [audioStateInputKey, setAudioStateInputKey] = useState(audioInputKey);
  const [audioError, setAudioError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filenames, setFilenames] = useState<string[]>([]);
  const [failedFilenames, setFailedFilenames] = useState<Set<string>>(new Set());
  const audioStateMatchesInput = audioStateInputKey === audioInputKey;

  useEffect(() => {
    let isDisposed = false;
    const files = getAudioFilesFromInputKey(audioInputKey);
    const loadGeneration = loadGenerationRef.current + 1;
    loadGenerationRef.current = loadGeneration;
    setAudioStateInputKey(audioInputKey);
    setLoading(true);
    setAudioError(false);
    setFailedFilenames(new Set());
    disposeAudioMap(audioMapRef.current);
    loadPromisesRef.current.clear();

    setFilenames(files);

    if (!files.length) {
      setAudioError(false);
      setLoading(false);
      return;
    }

    const handleAudioEnded = () => {
      audioEndedRef.current();
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

  const markAudioFailure = useCallback(
    (filename: string) => {
      if (audioInputKeyRef.current !== audioInputKey) return;
      setFailedFilenames((previous) => new Set(previous).add(filename));
      setAudioError(true);
    },
    [audioInputKey],
  );

  return {
    audioInputKey,
    audioInputKeyRef,
    audioMapRef,
    loadPromisesRef,
    audioEndedRef,
    audioStateMatchesInput,
    audioError: audioStateMatchesInput ? audioError : false,
    isAudioReady,
    loading: audioStateMatchesInput ? loading : requestedFilenames.length > 0,
    filenames: audioStateMatchesInput ? filenames : [],
    firstRequestedFilename: requestedFilenames[0] ?? null,
    markAudioFailure,
  };
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

/** Stops and resets one audio element to the start. */
function stopAndReset(element: HTMLAudioElement): void {
  element.pause();
  element.currentTime = 0;
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
