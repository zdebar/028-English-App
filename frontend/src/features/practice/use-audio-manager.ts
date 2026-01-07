import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserItemLocal } from '@/types/local.types';
import AudioRecord from '@/database/models/audio-records';

/**
 * Manages audio playback and caching for a list of user items.
 *
 * @param itemArray Practice deck items containing audio references.
 */
export function useAudioManager(itemArray: UserItemLocal[]) {
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map()); // Cache for audio elements
  const currentAudioRef = useRef<HTMLAudioElement | null>(null); // Currently playing audio WHY?
  const volumeRef = useRef(0.5); // Volume settings
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false); // Audio error state while playing

  const MAX_CACHE_SIZE = 500; // Maximum number of audio files to keep in the cache

  // Function to clean the audio cache
  const cleanCache = useCallback(() => {
    if (audioCacheRef.current.size > MAX_CACHE_SIZE) {
      const keysToRemove = Array.from(audioCacheRef.current.keys()).slice(
        0,
        audioCacheRef.current.size - MAX_CACHE_SIZE,
      );

      keysToRemove.forEach((key) => {
        const audio = audioCacheRef.current.get(key);
        if (audio) {
          audio.pause();
          URL.revokeObjectURL(audio.src); // Revoke the object URL to free memory
        }
        audioCacheRef.current.delete(key);
      });

      console.log(
        `Audio cache cleaned. Removed ${keysToRemove.length} items. Current cache size: ${audioCacheRef.current.size}`,
      );
    }
  }, []);

  useEffect(() => {
    const cacheAudio = async () => {
      if (itemArray.length === 0) return;

      try {
        const audioKeys = itemArray
          .map((item) => item.audio)
          .filter((audio): audio is string => audio !== null && !audioCacheRef.current.has(audio));
        if (audioKeys.length > 0) {
          const fetchedAudios = await AudioRecord.bulkGet(audioKeys);

          fetchedAudios.forEach((audioRecord) => {
            const { filename, audioBlob } = audioRecord;
            if (filename && audioBlob) {
              const audioUrl = URL.createObjectURL(audioBlob);
              const audioElement = new Audio(audioUrl);
              audioCacheRef.current.set(filename, audioElement);
            } else {
              console.warn(`Audio not found for: ${filename}`);
            }
          });

          cleanCache();
        }
      } catch (error) {
        console.error('Error caching audio files:', error);
      }
    };

    cacheAudio();
  }, [itemArray, cleanCache]);

  // Function to play audio
  const playAudio = useCallback((audioPath: string | null) => {
    if (audioPath && audioCacheRef.current.has(audioPath)) {
      const audio = audioCacheRef.current.get(audioPath);
      if (audio) {
        // Stop any currently playing audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
        }

        // Play the new audio
        audio.volume = volumeRef.current;
        currentAudioRef.current = audio;
        audio.currentTime = 0;

        audio
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });

        audio.onended = () => {
          setIsPlaying(false);
        };

        audio.onpause = () => {
          setIsPlaying(false);
        };

        setAudioError(false);
      }
    } else {
      setIsPlaying(false);
      setAudioError(true);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.min(Math.max(volume, 0), 1);
  }, []);

  const isAudioReady = useCallback((audioPath: string | null): boolean => {
    if (audioPath && audioCacheRef.current.has(audioPath)) {
      return true;
    } else {
      return false;
    }
  }, []);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
        setIsPlaying(false);
      }
    };
  }, []);

  return {
    playAudio,
    stopAudio,
    setVolume,
    isPlaying,
    audioError,
    setAudioError,
    isAudioReady,
  };
}
