import { useAudioLoader, type AudioInput } from './use-audio-loader';
import { useAudioPlayback } from './use-audio-playback';

/** Composes audio loading and playback controls into one public hook. */
export function useAudioManager(audio: AudioInput) {
  const audioLoader = useAudioLoader(audio);
  const audioPlayback = useAudioPlayback(audioLoader);

  return {
    playAudio: audioPlayback.playAudio,
    stopAudio: audioPlayback.stopAudio,
    audioError: audioLoader.audioError,
    isAudioReady: audioLoader.isAudioReady,
    loading: audioLoader.loading,
    isPlaying: audioPlayback.isPlaying,
    current: audioPlayback.current,
    filenames: audioLoader.filenames,
  };
}
