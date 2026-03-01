import { useCallback, useEffect, useRef, useState } from 'react';
import AudioRecord from '@/database/models/audio-records';
import { errorHandler } from '@/features/logging/error-handler';

export function useAudioManager(audio: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(1);
  const [audioError, setAudioError] = useState(audio == null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isDisposed = false;

    setLoading(true);

    const loadAudio = async () => {
      if (!audio) {
        audioRef.current = null;
        setAudioError(true);
        setIsPlaying(false);
        if (!isDisposed) {
          setLoading(false);
        }
        return;
      }

      try {
        const audioRecord = await AudioRecord.getAudioRecord(audio);
        if (!audioRecord?.audioBlob) throw new Error('Audio not found');

        objectUrl = URL.createObjectURL(audioRecord.audioBlob);
        if (!isDisposed) {
          const audioElement = new Audio(objectUrl);
          audioElement.volume = volumeRef.current;
          audioElement.addEventListener('ended', () => setIsPlaying(false));
          audioRef.current = audioElement;
          setAudioError(false);
        }
      } catch (error) {
        if (!isDisposed) {
          audioRef.current = null;
          setIsPlaying(false);
          setAudioError(true);
        }
        errorHandler(`Audio Manager Error`, error);
      } finally {
        if (!isDisposed) {
          setLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      isDisposed = true;

      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
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
