import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AudioRecord from '@/database/models/audio-records';
import config from '@/config/config';
import { reportError } from '@/features/logging/logging-handler';
import { AudioFileNotFoundError } from '@/types/error.types';
import type { AudioRecordLocal } from '@/types/audio.types';
import { runWithConcurrency } from '@/utils/async.utils';
import { normalizeAudioInput } from '@/utils/audio.utils';

export type AudioInput = string | string[];

export type ManagedAudio = Readonly<{
  isLoading: boolean;
  audio: HTMLAudioElement | null;
  errorMessage: string | null;
}>;

export type AudioCacheSnapshot = Readonly<{
  filenames: readonly string[];
  records: readonly (AudioRecordLocal | undefined)[];
}>;

const AUDIO_CACHE_MISS_ERROR = 'Audio is not in IndexedDB';
const inFlightAudioDownloads = new Map<string, Promise<AudioRecordLocal>>();

/** Loads requested files and exposes the map update needed after a playback failure. */
export function useAudioLoader(
  audio: AudioInput,
  audioCacheSnapshot?: AudioCacheSnapshot,
) {
  const requestedFilesKey = JSON.stringify(normalizeAudioInput(audio));
  const filenames = useMemo(
    () => JSON.parse(requestedFilesKey) as string[],
    [requestedFilesKey],
  );
  const prefetchedRecords = useMemo(
    () => getPrefetchedRecords(filenames, audioCacheSnapshot),
    [audioCacheSnapshot, filenames],
  );
  const cacheLookupInitiallyComplete = hasCacheLookupResult(filenames, prefetchedRecords);
  const initialAudioMap = useMemo(
    () => createLoadingAudioMap(filenames, prefetchedRecords),
    [filenames, prefetchedRecords],
  );
  const [audioMapState, setAudioMapState] = useState(() => ({
    requestedFilesKey,
    audioMap: initialAudioMap,
    cacheLookupComplete: cacheLookupInitiallyComplete,
  }));
  const requestedFilesKeyRef = useRef(requestedFilesKey);
  requestedFilesKeyRef.current = requestedFilesKey;
  const audioMap = audioMapState.requestedFilesKey === requestedFilesKey
    ? audioMapState.audioMap
    : initialAudioMap;
  const cacheLookupComplete = audioMapState.requestedFilesKey === requestedFilesKey
    ? audioMapState.cacheLookupComplete
    : cacheLookupInitiallyComplete;
  const updateAudioEntry = useCallback((filename: string, entry: ManagedAudio) => {
    if (requestedFilesKeyRef.current !== requestedFilesKey) return;
    setAudioMapState((current) => {
      if (current.requestedFilesKey !== requestedFilesKey || !current.audioMap.has(filename)) {
        return current;
      }

      const nextMap = new Map(current.audioMap);
      nextMap.set(filename, entry);
      return { ...current, audioMap: nextMap };
    });
  }, [requestedFilesKey]);
  const markAudioFailed = useCallback((filename: string, errorMessage: string) => {
    updateAudioEntry(filename, {
      isLoading: false,
      audio: null,
      errorMessage,
    });
  }, [updateAudioEntry]);

  useEffect(() => {
    let isDisposed = false;
    const createdAudioElements = new Set<HTMLAudioElement>();
    setAudioMapState((current) => {
      if (current.requestedFilesKey === requestedFilesKey && current.audioMap === initialAudioMap) {
        return current;
      }
      return {
        requestedFilesKey,
        audioMap: initialAudioMap,
        cacheLookupComplete: cacheLookupInitiallyComplete,
      };
    });

    const isCurrentLoad = () =>
      !isDisposed && requestedFilesKeyRef.current === requestedFilesKey;
    const updateEntry = (filename: string, entry: ManagedAudio) => {
      if (!isCurrentLoad()) return;
      updateAudioEntry(filename, entry);
    };
    const setFailure = (filename: string, error: unknown) => {
      if (!isCurrentLoad()) return;
      if (!(error instanceof AudioFileNotFoundError)) {
        reportError('Audio Manager Error', error);
      }
      updateEntry(filename, {
        isLoading: false,
        audio: null,
        errorMessage: getErrorMessage(error),
      });
    };
    const setCacheMiss = (filename: string) => {
      updateEntry(filename, {
        isLoading: true,
        audio: null,
        errorMessage: AUDIO_CACHE_MISS_ERROR,
      });
    };
    const setLoadedAudio = (filename: string, audioRecord: AudioRecordLocal) => {
      if (!isCurrentLoad()) return;

      try {
        const audioElement = createAudioElement(audioRecord);
        createdAudioElements.add(audioElement);
        updateEntry(filename, {
          isLoading: false,
          audio: audioElement,
          errorMessage: null,
        });
      } catch (error) {
        reportError('Audio Manager Error', error);
        updateEntry(filename, {
          isLoading: false,
          audio: null,
          errorMessage: getErrorMessage(error),
        });
      }
    };

    const setCacheLookupComplete = () => {
      if (!isCurrentLoad()) return;
      setAudioMapState((current) => {
        if (current.requestedFilesKey !== requestedFilesKey) return current;
        return { ...current, cacheLookupComplete: true };
      });
    };

    void loadAudioFiles(
      filenames,
      isCurrentLoad,
      setLoadedAudio,
      setFailure,
      setCacheMiss,
      setCacheLookupComplete,
      prefetchedRecords,
    ).catch(
      (error: unknown) => {
        reportError('Audio Manager Error', error);
        filenames.forEach((filename) => setFailure(filename, error));
        setCacheLookupComplete();
      },
    );

    return () => {
      isDisposed = true;
      disposeAudioElements(createdAudioElements);
    };
  }, [filenames, initialAudioMap, prefetchedRecords, requestedFilesKey, updateAudioEntry]);

  return { audioMap, cacheLookupComplete, markAudioFailed };
}

async function loadAudioFiles(
  filenames: readonly string[],
  isCurrentLoad: () => boolean,
  setLoadedAudio: (filename: string, record: AudioRecordLocal) => void,
  setFailure: (filename: string, error: unknown) => void,
  setCacheMiss: (filename: string) => void,
  setCacheLookupComplete: () => void,
  prefetchedRecords: readonly (AudioRecordLocal | undefined)[] | null,
): Promise<void> {
  const cachedRecords = prefetchedRecords ?? await AudioRecord.getCachedByFilenames(filenames);
  if (!isCurrentLoad()) return;

  const missingFiles: string[] = [];
  cachedRecords.forEach((record, index) => {
    const filename = filenames[index];
    if (!filename) return;
    if (!record) {
      missingFiles.push(filename);
      setCacheMiss(filename);
      return;
    }

    setLoadedAudio(filename, record);
  });

  setCacheLookupComplete();

  await runWithConcurrency(
    missingFiles,
    config.audio.downloadConcurrency,
    async (filename) => {
      if (!isCurrentLoad()) return;

      try {
        const audioRecord = await downloadAndCacheAudio(filename);
        setLoadedAudio(filename, audioRecord);
      } catch (error) {
        setFailure(filename, error);
      }
    },
  );
}

function hasCacheLookupResult(
  filenames: readonly string[],
  prefetchedRecords: readonly (AudioRecordLocal | undefined)[] | null,
): boolean {
  return filenames.length === 0 || prefetchedRecords !== null;
}

function createLoadingAudioMap(
  filenames: readonly string[],
  prefetchedRecords: readonly (AudioRecordLocal | undefined)[] | null,
): Map<string, ManagedAudio> {
  return new Map(
    filenames.map((filename, index) => {
      const isCacheMiss = prefetchedRecords !== null && !prefetchedRecords[index];
      return [
        filename,
        {
          isLoading: true,
          audio: null,
          errorMessage: isCacheMiss ? AUDIO_CACHE_MISS_ERROR : null,
        },
      ];
    }),
  );
}

function getPrefetchedRecords(
  filenames: readonly string[],
  snapshot: AudioCacheSnapshot | undefined,
): readonly (AudioRecordLocal | undefined)[] | null {
  if (snapshot?.filenames.length !== filenames.length) return null;
  if (snapshot.records.length !== filenames.length) return null;
  if (snapshot.filenames.some((filename, index) => filename !== filenames[index])) return null;
  return snapshot.records;
}

function downloadAndCacheAudio(filename: string): Promise<AudioRecordLocal> {
  const existingDownload = inFlightAudioDownloads.get(filename);
  if (existingDownload) return existingDownload;

  const download = downloadAndCacheAudioFile(filename);
  inFlightAudioDownloads.set(filename, download);
  void download.then(
    () => clearInFlightAudioDownload(filename, download),
    () => clearInFlightAudioDownload(filename, download),
  );
  return download;
}

async function downloadAndCacheAudioFile(filename: string): Promise<AudioRecordLocal> {
  const audioRecord = await AudioRecord.downloadByFilename(filename);
  try {
    await AudioRecord.cacheAudioRecords([audioRecord]);
  } catch (error) {
    reportError('Audio Cache Error', error);
  }
  return audioRecord;
}

function clearInFlightAudioDownload(
  filename: string,
  download: Promise<AudioRecordLocal>,
): void {
  if (inFlightAudioDownloads.get(filename) === download) {
    inFlightAudioDownloads.delete(filename);
  }
}

function createAudioElement(audioRecord: AudioRecordLocal): HTMLAudioElement {
  if (!audioRecord.audioBlob) throw new Error('Audio not found');

  const objectUrl = URL.createObjectURL(audioRecord.audioBlob);
  try {
    return new Audio(objectUrl);
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function disposeAudioElements(audioElements: ReadonlySet<HTMLAudioElement>): void {
  audioElements.forEach((element) => {
    element.pause();
    element.currentTime = 0;
    const objectUrl = element.src;
    if (!objectUrl.startsWith('blob:')) return;
    element.removeAttribute('src');
    element.load();
    URL.revokeObjectURL(objectUrl);
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
