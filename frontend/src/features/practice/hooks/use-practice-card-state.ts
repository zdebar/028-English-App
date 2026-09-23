import { useAudioManager } from '@/features/audio/use-audio-manager';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { NBSP, useHint } from './use-hint';

type UsePracticeCardStateOptions = {
  currentItem: UserItemLocal | null;
  revealed: boolean;
  isCompletion?: boolean;
  setRevealed: Dispatch<SetStateAction<boolean>>;
};

function isPracticeAudioDisabled(
  revealed: boolean,
  currentItem: UserItemLocal | null,
  audioError: boolean,
): boolean {
  return !revealed || !currentItem?.audio || audioError;
}

function getCzechText(currentItem: UserItemLocal | null): string | undefined {
  return currentItem?.czech;
}

function getEnglishText(
  currentItem: UserItemLocal | null,
  revealed: boolean,
  englishHinted: string,
): string | undefined {
  return revealed ? currentItem?.english : englishHinted;
}

function getPronunciationText(currentItem: UserItemLocal | null, revealed: boolean): string {
  if (!revealed) return NBSP;
  return currentItem?.pronunciation || NBSP;
}

export function usePracticeCardState({
  currentItem,
  revealed,
  isCompletion = false,
  setRevealed,
}: UsePracticeCardStateOptions) {
  const { englishHinted, resetHint, plusHint } = useHint(
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

  const audioDisabled = isPracticeAudioDisabled(revealed, currentItem, audioError);
  const czech = getCzechText(currentItem);
  const english = getEnglishText(currentItem, revealed, englishHinted);

  const resetQuestionState = useCallback(() => {
    setRevealed(false);
    resetHint();
  }, [resetHint, setRevealed]);

  useEffect(() => {
    if (isCompletion) stopAudio();
  }, [isCompletion, stopAudio]);

  const handleReveal = useCallback(() => {
    if (revealed) return;
    if (!audioError) void playAudioInternal();
    setRevealed(true);
  }, [audioError, playAudioInternal, revealed, setRevealed]);

  return {
    audioDisabled,
    audioError,
    audioLoading,
    czech,
    english,
    handleReveal,
    isPlaying,
    playAudio: playAudioInternal,
    plusHint,
    pronunciation: getPronunciationText(currentItem, revealed),
    resetHint,
    resetQuestionState,
  };
}
