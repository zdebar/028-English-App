import { useCallback, useEffect, useRef, useState } from 'react';
import AudioRecord from '@/database/models/audio-records';
import { reportError } from '@/features/logging/monitoring-handler';
import { useAudioStore } from './use-audio-store';

type AudioInput = string | string[] | null;
type ManagedAudio = {
  element: HTMLAudioElement;
  onEnded: () => void;
};
type AudioLoadPromise = Promise<boolean>;

/**
 * Stop and reset an HTMLAudioElement to the start.
 */
function stopAndReset(element: HTMLAudioElement) {
  element.pause();
  element.currentTime = 0;
}

/**
 * Stop and reset all managed audio elements in the provided map.
 */
function stopAndResetAll(audioMap: Map<string, ManagedAudio>) {
  audioMap.forEach(({ element }) => {
    stopAndReset(element);
  });
}

/**
 * Dispose managed audio elements and revoke object URLs where needed.
 */
function disposeAudioMap(audioMap: Map<string, ManagedAudio>) {
  audioMap.forEach(disposeManagedAudio);
  audioMap.clear();
}

function disposeManagedAudio({ element, onEnded }: ManagedAudio) {
  stopAndReset(element);
  element.removeEventListener('ended', onEnded);
  const objectUrl = element.src;
  if (objectUrl.startsWith('blob:')) {
    element.removeAttribute('src');
    element.load();
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Normalize audio input (string | string[] | null) into an array of filenames.
 */
function normalizeAudioInput(audio: AudioInput): string[] {
  if (typeof audio === 'string' && audio) {
    return [audio];
  }
  if (Array.isArray(audio)) {
    return [...new Set(audio.filter(Boolean))];
  }
  return [];
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

async function loadSingleAudio(
  filename: string,
  onEnded: () => void,
): Promise<ManagedAudio | null> {
  try {
    const audioRecord = await AudioRecord.getByFilename(filename);
    if (!audioRecord?.audioBlob) {
      throw new Error('Audio not found');
    }

    const objectUrl = URL.createObjectURL(audioRecord.audioBlob);
    const audioElement = new Audio(objectUrl);
    audioElement.addEventListener('ended', onEnded);
    return { element: audioElement, onEnded };
  } catch (error) {
    reportError('Audio Manager Error', error);
    return null;
  }
}

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

    const loadPromises = files.map((filename) => {
      const loadPromise = loadSingleAudio(filename, handleAudioEnded).then((managedAudio) => {
        const isCurrentLoad =
          !isDisposed && loadGenerationRef.current === loadGeneration && managedAudio !== null;
        if (!isCurrentLoad) {
          if (managedAudio) disposeManagedAudio(managedAudio);
          return false;
        }

        audioMapRef.current.set(filename, managedAudio);
        return true;
      });
      loadPromisesRef.current.set(filename, loadPromise);
      return loadPromise;
    });

    const loadAllAudio = async () => {
      const loadResults = await Promise.all(loadPromises);
      const failedFiles = files.filter((_, index) => !loadResults[index]);

      const hasFailure = failedFiles.length > 0;

      if (!isDisposed && hasFailure) {
        setFailedFilenames(new Set(failedFiles));
        setAudioError(true);
      }

      if (!isDisposed) setLoading(false);
    };

    loadAllAudio();

    return () => {
      isDisposed = true;
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
        reportError('Audio Playback Error', error);
        setFailedFilenames((prev) => new Set(prev).add(toPlay));
        setAudioError(true);
        setIsPlaying(false);
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
