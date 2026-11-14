import { useEffect, useMemo, useRef, useState } from 'react';
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

/** Loads requested audio files and returns their current per-file states. */
export function useAudioLoader(audio: AudioInput): Map<string, ManagedAudio> {
  const requestedFilesKey = JSON.stringify(normalizeAudioInput(audio));
  const filenames = useMemo(
    () => JSON.parse(requestedFilesKey) as string[],
    [requestedFilesKey],
  );
  const initialAudioMap = useMemo(
    () => createLoadingAudioMap(filenames),
    [filenames],
  );
  const [audioMapState, setAudioMapState] = useState(() => ({
    requestedFilesKey,
    audioMap: initialAudioMap,
  }));
  const requestedFilesKeyRef = useRef(requestedFilesKey);
  requestedFilesKeyRef.current = requestedFilesKey;
  const audioMap = audioMapState.requestedFilesKey === requestedFilesKey
    ? audioMapState.audioMap
    : initialAudioMap;

  useEffect(() => {
    let isDisposed = false;
    const createdAudioElements = new Set<HTMLAudioElement>();
    setAudioMapState((current) => {
      if (current.requestedFilesKey === requestedFilesKey && current.audioMap === initialAudioMap) {
        return current;
      }
      return { requestedFilesKey, audioMap: initialAudioMap };
    });

    const isCurrentLoad = () =>
      !isDisposed && requestedFilesKeyRef.current === requestedFilesKey;
    const updateEntry = (filename: string, entry: ManagedAudio) => {
      if (!isCurrentLoad()) return;
      setAudioMapState((current) => {
        if (!isCurrentLoad() || current.requestedFilesKey !== requestedFilesKey) {
          return current;
        }

        const nextMap = new Map(current.audioMap);
        nextMap.set(filename, entry);
        return { requestedFilesKey, audioMap: nextMap };
      });
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

    void loadAudioFiles(filenames, isCurrentLoad, setLoadedAudio, setFailure).catch(
      (error: unknown) => {
        reportError('Audio Manager Error', error);
        filenames.forEach((filename) => setFailure(filename, error));
      },
    );

    return () => {
      isDisposed = true;
      disposeAudioElements(createdAudioElements);
    };
  }, [filenames, initialAudioMap, requestedFilesKey]);

  return audioMap;
}

function createLoadingAudioMap(filenames: readonly string[]): Map<string, ManagedAudio> {
  return new Map(
    filenames.map((filename) => [
      filename,
      { isLoading: true, audio: null, errorMessage: null },
    ]),
  );
}

async function loadAudioFiles(
  filenames: readonly string[],
  isCurrentLoad: () => boolean,
  setLoadedAudio: (filename: string, record: AudioRecordLocal) => void,
  setFailure: (filename: string, error: unknown) => void,
): Promise<void> {
  const cachedRecords = await AudioRecord.getCachedByFilenames(filenames);
  if (!isCurrentLoad()) return;

  const missingFiles: string[] = [];
  cachedRecords.forEach((record, index) => {
    const filename = filenames[index];
    if (!filename) return;
    if (!record) {
      missingFiles.push(filename);
      return;
    }

    setLoadedAudio(filename, record);
  });

  await runWithConcurrency(
    missingFiles,
    config.audio.downloadConcurrency,
    async (filename) => {
      if (!isCurrentLoad()) return;

      try {
        const audioRecord = await AudioRecord.downloadByFilename(filename);
        try {
          await AudioRecord.cacheAudioRecords([audioRecord]);
        } catch (error) {
          reportError('Audio Cache Error', error);
        }

        setLoadedAudio(filename, audioRecord);
      } catch (error) {
        setFailure(filename, error);
      }
    },
  );
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
