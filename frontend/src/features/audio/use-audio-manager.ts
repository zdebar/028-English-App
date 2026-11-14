import { useMemo } from 'react';
import { normalizeAudioInput } from '@/utils/audio.utils';
import { useAudioLoader } from './use-audio-loader';
import { useAudioPlayback } from './use-audio-playback';

type AudioInput = string | string[] | null;

/** Composes audio loading and playback controls for existing audio consumers. */
export function useAudioManager(audio: AudioInput) {
  const requestedFilesKey = JSON.stringify(normalizeAudioInput(audio));
  const filenames = useMemo(
    () => JSON.parse(requestedFilesKey) as string[],
    [requestedFilesKey],
  );
  const audioMap = useAudioLoader(filenames);
  const audioPlayback = useAudioPlayback(audioMap);
  const entries = [...audioMap.values()];

  return {
    playAudio: audioPlayback.playAudio,
    stopAudio: audioPlayback.stopAudio,
    audioError: audioPlayback.audioError || entries.some((entry) => entry.errorMessage !== null),
    isAudioReady: audioPlayback.isAudioReady,
    loading: entries.some((entry) => entry.isLoading),
    isPlaying: audioPlayback.isPlaying,
    current: audioPlayback.current,
    filenames,
  };
}
