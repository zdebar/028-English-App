import config from '@/config/config';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { NBSP, useHint } from './use-hint';

type UsePracticeCardStateOptions = {
  currentItem: UserItemLocal | null;
  isCzToEn: boolean;
  revealed: boolean;
  isCompletion?: boolean;
  setRevealed: Dispatch<SetStateAction<boolean>>;
};

function isPracticeAudioDisabled(
  isCzToEn: boolean,
  revealed: boolean,
  currentItem: UserItemLocal | null,
  audioError: boolean,
): boolean {
  return (isCzToEn && !revealed) || !currentItem?.audio || audioError;
}

function getCzechText(
  currentItem: UserItemLocal | null,
  isCzToEn: boolean,
  revealed: boolean,
  czechHinted: string,
): string | undefined {
  if (isCzToEn || revealed) return currentItem?.czech;
  return czechHinted;
}

function getEnglishText(
  currentItem: UserItemLocal | null,
  isCzToEn: boolean,
  revealed: boolean,
  audioDisabled: boolean,
  englishHinted: string,
): string | undefined {
  if (revealed || (audioDisabled && !isCzToEn)) return currentItem?.english;
  return englishHinted;
}

function getPronunciationText(currentItem: UserItemLocal | null, revealed: boolean): string {
  if (!revealed) return NBSP;
  return currentItem?.pronunciation || NBSP;
}

function schedulePracticeAudio(
  audioDisabled: boolean,
  isCzToEn: boolean,
  audioLoading: boolean,
  showDirectionChange: boolean,
  isCompletion: boolean,
  playAudio: () => void,
): (() => void) | undefined {
  if (isCompletion || audioDisabled || isCzToEn || audioLoading || showDirectionChange) {
    return undefined;
  }

  const timeoutId = globalThis.setTimeout(playAudio, config.practice.audioDelay);
  return () => globalThis.clearTimeout(timeoutId);
}

function revealPracticeCard(
  showDirectionChange: boolean,
  hideDirectionChange: () => void,
  isCzToEn: boolean,
  audioError: boolean,
  revealed: boolean,
  playAudio: () => void,
  setRevealed: Dispatch<SetStateAction<boolean>>,
): void {
  if (showDirectionChange) {
    hideDirectionChange();
    return;
  }
  if (isCzToEn && !audioError && !revealed) playAudio();
  setRevealed(true);
}

export function usePracticeCardState({
  currentItem,
  isCzToEn,
  revealed,
  isCompletion = false,
  setRevealed,
}: UsePracticeCardStateOptions) {
  const { czechHinted, englishHinted, resetHint, plusHint } = useHint(
    currentItem?.czech,
    currentItem?.english,
  );
  const {
    playAudio: playAudioInternal,
    stopAudio,
    audioError,
    loading: audioLoading,
    isPlaying,
  } = useAudioManager(currentItem?.audio ?? null);

  const audioDisabled = isPracticeAudioDisabled(isCzToEn, revealed, currentItem, audioError);
  const czech = getCzechText(currentItem, isCzToEn, revealed, czechHinted);
  const english = getEnglishText(currentItem, isCzToEn, revealed, audioDisabled, englishHinted);

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
    if (isCompletion) {
      stopAudio();
      return undefined;
    }
    return schedulePracticeAudio(
      audioDisabled,
      isCzToEn,
      audioLoading,
      showDirectionChange,
      isCompletion,
      playAudioInternal,
    );
  }, [
    audioDisabled,
    isCzToEn,
    audioLoading,
    showDirectionChange,
    isCompletion,
    playAudioInternal,
    stopAudio,
    currentItem,
  ]);

  const handleReveal = useCallback(() => {
    revealPracticeCard(
      showDirectionChange,
      hideDirectionChange,
      isCzToEn,
      audioError,
      revealed,
      playAudioInternal,
      setRevealed,
    );
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
    pronunciation: getPronunciationText(currentItem, revealed),
    resetHint,
    resetQuestionState,
    showDirectionChange,
  };
}
