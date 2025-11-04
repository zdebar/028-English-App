import { useCallback, useEffect, useRef, useState } from "react";
import type { UserItemLocal } from "@/types/local.types";
import AudioRecord from "@/database/models/audio-records";

export function useAudioManager(itemArray: UserItemLocal[]) {
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [audioReload, setAudioReload] = useState(false);

  useEffect(() => {
    const cacheAudio = async () => {
      if (itemArray.length === 0 || audioReload) return;

      try {
        if (itemArray.length > 0) {
          const audioKeys = itemArray
            .map((item) => item.audio)
            .filter(
              (audio): audio is string =>
                audio !== null && !audioCacheRef.current.has(audio)
            );
          if (audioKeys.length > 0) {
            const fetchedAudios = await AudioRecord.bulkGet(audioKeys);

            fetchedAudios.forEach((audioRecord) => {
              if (audioRecord) {
                const { filename, audioBlob } = audioRecord;
                if (filename && audioBlob) {
                  const audioUrl = URL.createObjectURL(audioBlob);
                  const audioElement = new Audio(audioUrl);
                  audioCacheRef.current.set(filename, audioElement);
                } else {
                  console.warn(`Audio not found for: ${filename}`);
                }
              }
            });
          }
        }
        setAudioReload(false);
      } catch (error) {
        console.error("Error caching audio files:", error);
      }
    };

    cacheAudio();
  }, [itemArray, audioReload]);

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
      console.warn(`Audio file not found in cache: ${audioPath}`);
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

  const muteAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.muted = true;
    }
  }, []);

  const unmuteAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.muted = false;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.min(Math.max(volume, 0), 1);
  }, []);

  const tryAudio = useCallback((audioPath: string | null): boolean => {
    if (audioPath && audioCacheRef.current.has(audioPath)) {
      return true;
    } else {
      console.warn(`Audio file not found in cache: ${audioPath}`);
      return false;
    }
  }, []);

  return {
    playAudio,
    stopAudio,
    muteAudio,
    unmuteAudio,
    setVolume,
    isPlaying,
    audioError,
    setAudioError,
    tryAudio,
    audioReload,
    setAudioReload,
  };
}
