import { useCallback, useEffect, useRef, useState } from 'react';
import AudioRecord from '@/database/models/audio-records';
import { errorHandler } from '../logging/error-handler';

export function useAudioManager(audio: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(1);
  const [audioError, setAudioError] = useState(audio == null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let unmounted = false;
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

    // Start delayed loading indicator
    loadingTimeout = setTimeout(() => {
      if (!unmounted) setLoading(true);
    }, 250);

    const loadAudio = async () => {
      if (!audio) {
        audioRef.current = null;
        return;
      }
      try {
        const audioRecord = await AudioRecord.getAudio(audio);
        if (!audioRecord?.audioBlob) throw new Error('Audio not found');
        url = URL.createObjectURL(audioRecord.audioBlob);
        if (!unmounted) {
          const audioElement = new Audio(url);
          audioElement.volume = volumeRef.current;
          audioRef.current = audioElement;
          audioElement.addEventListener('ended', () => setIsPlaying(false));
          setAudioError(false);
        }
      } catch (error) {
        if (!unmounted) {
          audioRef.current = null;
          setAudioError(true);
        }
        errorHandler(`Audio Manager Error`, error);
      } finally {
        if (loadingTimeout) clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    loadAudio();

    return () => {
      unmounted = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setAudioError(false);
      if (url) URL.revokeObjectURL(url);
    };
  }, [audio]);

  const playAudio = useCallback(() => {
    if (!audioRef.current || audioError) return;
    audioRef.current.currentTime = 0;
    audioRef.current.volume = volumeRef.current;
    audioRef.current.play();
    setIsPlaying(true);
  }, [audioError]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.min(Math.max(volume, 0), 1);
    if (audioRef.current) {
      audioRef.current.volume = volumeRef.current;
    }
  }, []);

  return {
    playAudio,
    stopAudio,
    setVolume,
    audioError,
    isAudioReady: () => !!audioRef.current,
    loading,
    isPlaying,
  };
}
