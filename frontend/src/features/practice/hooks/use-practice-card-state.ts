import config from '@/config/config';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { NBSP, useHint } from './use-hint';

type UsePracticeCardStateOptions = {
  currentItem: UserItemLocal | null;
  isCzToEn: boolean;
  revealed: boolean;
  setRevealed: Dispatch<SetStateAction<boolean>>;
};

export function usePracticeCardState({
  currentItem,
  isCzToEn,
  revealed,
  setRevealed,
}: UsePracticeCardStateOptions) {
  const { czechHinted, englishHinted, resetHint, plusHint } = useHint(
    currentItem?.czech,
    currentItem?.english,
  );
  const {
    playAudio: playAudioInternal,
    audioError,
    loading: audioLoading,
    isPlaying,
  } = useAudioManager(currentItem?.audio ?? null);

  const audioDisabled = (isCzToEn && !revealed) || !currentItem?.audio || audioError;
  const czech = isCzToEn || revealed ? currentItem?.czech : czechHinted;
  const english = revealed || (audioDisabled && !isCzToEn) ? currentItem?.english : englishHinted;

  const [wasCzToEn, setWasCzToEn] = useState<boolean | null>(null);
  const showDirectionChange = wasCzToEn !== isCzToEn;
  const hideDirectionChange = useCallback(() => {
    setWasCzToEn(isCzToEn);
  }, [isCzToEn]);

  const resetQuestionState = useCallback(() => {
    setRevealed(false);
    resetHint();
  }, [resetHint, setRevealed]);

  useEffect(() => {
    if (audioDisabled || isCzToEn || audioLoading || showDirectionChange) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      playAudioInternal();
    }, config.practice.audioDelay);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [audioDisabled, isCzToEn, audioLoading, showDirectionChange, playAudioInternal, currentItem]);

  const handleReveal = useCallback(() => {
    if (showDirectionChange) {
      hideDirectionChange();
      return;
    }

    if (isCzToEn && !audioError && !revealed) {
      playAudioInternal();
    }

    setRevealed(true);
  }, [
    audioError,
    hideDirectionChange,
    isCzToEn,
    playAudioInternal,
    revealed,
    setRevealed,
    showDirectionChange,
  ]);

  return {
    audioDisabled,
    audioError,
    audioLoading,
    czech,
    english,
    handleReveal,
    hideDirectionChange,
    isPlaying,
    playAudio: playAudioInternal,
    plusHint,
    pronunciation: revealed ? currentItem?.pronunciation || NBSP : NBSP,
    resetHint,
    resetQuestionState,
    showDirectionChange,
  };
}
