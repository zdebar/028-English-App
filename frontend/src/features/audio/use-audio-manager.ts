import { useCallback, useMemo } from 'react';
import { normalizeAudioInput } from '@/utils/audio.utils';
import {
  useAudioLoader,
  type AudioCacheSnapshot,
  type ManagedAudio,
} from './use-audio-loader';
import { useAudioPlayback } from './use-audio-playback';

type AudioInput = string | string[] | null;

/** Composes audio loading and playback controls for existing audio consumers. */
export function useAudioManager(
  audio: AudioInput,
  audioCacheSnapshot?: AudioCacheSnapshot,
) {
  const requestedFilesKey = JSON.stringify(normalizeAudioInput(audio));
  const filenames = useMemo(
    () => JSON.parse(requestedFilesKey) as string[],
    [requestedFilesKey],
  );
  const { audioMap, cacheLookupComplete, markAudioFailed } = useAudioLoader(
    filenames,
    audioCacheSnapshot,
  );
  const audioPlayback = useAudioPlayback(audioMap, markAudioFailed);
  const entries = [...audioMap.values()];
  const audioReadiness = useMemo(() => new Map<string, boolean | null>(
    filenames.map((filename) => [
      filename,
      getAudioReadiness(audioMap.get(filename)),
    ] as const),
  ), [audioMap, filenames]);
  const isAudioReady = useCallback((filename: string) => {
    return audioReadiness.get(filename) ?? null;
  }, [audioReadiness]);
  const isAudioLoading = useCallback((filename: string) => {
    return audioMap.get(filename)?.isLoading ?? false;
  }, [audioMap]);

  return {
    playAudio: audioPlayback.playAudio,
    stopAudio: audioPlayback.stopAudio,
    audioError: entries.some((entry) => entry.errorMessage !== null),
    isAudioReady,
    isAudioLoading,
    loading: entries.some((entry) => entry.isLoading),
    cacheLookupComplete,
    isPlaying: audioPlayback.isPlaying,
    filenames,
  };
}

function getAudioReadiness(entry: ManagedAudio | undefined): boolean | null {
  if (!entry) return null;
  if (entry.errorMessage !== null) return false;
  if (entry.audio) return true;
  return null;
}
