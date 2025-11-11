import { useState, useEffect, useCallback } from "react";
import { usePracticeDeck } from "@/hooks/use-practice-deck";
import { useAudioManager } from "@/hooks/use-audio-manager";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useUserStore } from "@/hooks/use-user";

export function usePracticeLogic() {
  const [revealed, setRevealed] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [grammarVisible, setGrammarVisible] = useState(false);

  const { userId } = useAuthStore();
  const { index, array, nextItem, currentItem, direction, hasGrammar } =
    usePracticeDeck(userId!);
  const { playAudio, stopAudio, setVolume, audioError, setAudioError } =
    useAudioManager(array);

  const isAudioDisabled =
    (direction && !revealed) || !currentItem?.audio || audioError;

  const handleNext = useCallback(
    async (progressIncrement: number = 0) => {
      setRevealed(false);
      stopAudio();
      nextItem(progressIncrement);
      setHintIndex(0);
    },
    [nextItem, stopAudio]
  );

  const playAudioForItem = useCallback(() => {
    if (currentItem?.audio) {
      playAudio(currentItem.audio);
    }
  }, [currentItem, playAudio]);

  // Auto-play audio on new item if not in reading direction
  useEffect(() => {
    if (!direction && currentItem && currentItem?.audio) {
      setTimeout(() => playAudio(currentItem.audio!), 500);
    }
  }, [currentItem, direction, playAudio]);

  // Handle audio errors and retries
  useEffect(() => {
    if (!currentItem || !currentItem?.audio || audioError) {
      setAudioError(true);
    } else {
      setAudioError(false);
    }
  }, [audioError, currentItem, setAudioError]);

  return {
    revealed,
    setRevealed,
    hintIndex,
    setHintIndex,
    grammarVisible,
    setGrammarVisible,
    handleNext,
    playAudioForItem,
    isAudioDisabled,
    currentItem,
    direction,
    hasGrammar,
    index,
    userId,
    userStats: useUserStore().userStats,
    playAudio,
    setVolume,
    audioError,
  };
}
