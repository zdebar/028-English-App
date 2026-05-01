import { useCallback, useEffect, useRef, useState } from 'react';
import AudioRecord from '@/database/models/audio-records';
import { errorHandler } from '@/features/logging/error-handler';

type AudioInput = string | string[] | null;
type ManagedAudio = {
  element: HTMLAudioElement;
  onEnded: () => void;
};

function stopAndReset(element: HTMLAudioElement) {
  element.pause();
  element.currentTime = 0;
}

function stopAndResetAll(audioMap: Map<string, ManagedAudio>) {
  audioMap.forEach(({ element }) => {
    stopAndReset(element);
  });
}

function disposeAudioMap(audioMap: Map<string, ManagedAudio>) {
  audioMap.forEach(({ element, onEnded }) => {
    stopAndReset(element);
    element.removeEventListener('ended', onEnded);
    if (element.src.startsWith('blob:')) {
      URL.revokeObjectURL(element.src);
    }
  });
  audioMap.clear();
}

function normalizeAudioInput(audio: AudioInput): string[] {
  if (typeof audio === 'string' && audio) {
    return [audio];
  }
  if (Array.isArray(audio)) {
    return audio.filter(Boolean);
  }
  return [];
}

function resolveFilenameToPlay(
  requestedFilename: string | undefined,
  currentFilename: string | null,
  filenames: string[],
  audioMap: Map<string, ManagedAudio>,
): string | null {
  if (requestedFilename && audioMap.has(requestedFilename)) {
    return requestedFilename;
  }
  if (!requestedFilename && currentFilename && audioMap.has(currentFilename)) {
    return currentFilename;
  }
  if (!requestedFilename && filenames.length > 0 && audioMap.has(filenames[0])) {
    return filenames[0];
  }
  return null;
}

async function loadSingleAudio(
  filename: string,
  volume: number,
  onEnded: () => void,
  audioMap: Map<string, ManagedAudio>,
): Promise<boolean> {
  try {
    const audioRecord = await AudioRecord.getByFilename(filename);
    if (!audioRecord?.audioBlob) {
      throw new Error('Audio not found');
    }

    const objectUrl = URL.createObjectURL(audioRecord.audioBlob);
    const audioElement = new Audio(objectUrl);
    audioElement.volume = volume;
    audioElement.addEventListener('ended', onEnded);
    audioMap.set(filename, { element: audioElement, onEnded });
    return true;
  } catch (error) {
    errorHandler('Audio Manager Error', error);
    return false;
  }
}

async function loadAudioBatch(
  filenames: string[],
  volume: number,
  onEnded: () => void,
  audioMap: Map<string, ManagedAudio>,
): Promise<boolean> {
  let hasFailure = false;

  for (const filename of filenames) {
    const wasLoaded = await loadSingleAudio(filename, volume, onEnded, audioMap);
    if (!wasLoaded) {
      hasFailure = true;
    }
  }

  return hasFailure;
}

export function useAudioManager(audio: AudioInput) {
  const audioMapRef = useRef<Map<string, ManagedAudio>>(new Map());
  const volumeRef = useRef(1);
  const [audioError, setAudioError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filenames, setFilenames] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  // Load audio files
  useEffect(() => {
    let isDisposed = false;
    setLoading(true);
    setAudioError(false);
    setIsPlaying(false);
    disposeAudioMap(audioMapRef.current);

    const files = normalizeAudioInput(audio);
    setFilenames(files);
    setCurrent(files[0] ?? null);

    if (!files.length) {
      setAudioError(true);
      setLoading(false);
      return;
    }

    const handleAudioEnded = () => {
      setIsPlaying(false);
    };

    const loadAllAudio = async () => {
      const hasFailure = await loadAudioBatch(
        files,
        volumeRef.current,
        handleAudioEnded,
        audioMapRef.current,
      );

      if (hasFailure) {
        setAudioError(true);
      }

      if (!isDisposed) setLoading(false);
    };

    void loadAllAudio();

    return () => {
      isDisposed = true;
      disposeAudioMap(audioMapRef.current);
    };
  }, [audio]);

  // Play audio: if no arg, play current; if arg, play that file
  const playAudio = useCallback(
    (filename?: string) => {
      // Always stop all first
      stopAndResetAll(audioMapRef.current);
      setIsPlaying(false);

      const toPlay = resolveFilenameToPlay(filename, current, filenames, audioMapRef.current);
      if (!toPlay) return;
      const managedAudio = audioMapRef.current.get(toPlay);
      if (!managedAudio) return;

      managedAudio.element.currentTime = 0;
      managedAudio.element.volume = volumeRef.current;
      void managedAudio.element.play();
      setCurrent(toPlay);
      setIsPlaying(true);
    },
    [current, filenames],
  );

  const stopAudio = useCallback(() => {
    stopAndResetAll(audioMapRef.current);
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.min(Math.max(volume, 0), 1);
    audioMapRef.current.forEach(({ element }) => {
      element.volume = volumeRef.current;
    });
  }, []);

  return {
    playAudio, // playAudio() or playAudio(filename)
    stopAudio,
    setVolume,
    audioError,
    isAudioReady: () => audioMapRef.current.size > 0,
    loading,
    isPlaying,
    current,
    filenames,
  };
}
