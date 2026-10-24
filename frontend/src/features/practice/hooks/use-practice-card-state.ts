import { useAudioManager } from '@/features/audio/use-audio-manager';
import { reportError } from '@/features/logging/monitoring-handler';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
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

function getPracticeCzech(item: UserItemLocal | null, isEnToCz: boolean, revealed: boolean): string | undefined {
  if (isEnToCz && !revealed) return undefined;
  return getCzechText(item);
}

function isAudioOnlyPhase(
  item: UserItemLocal | null,
  isEnToCz: boolean,
  revealed: boolean,
  audioError: boolean,
): boolean {
  return isEnToCz && !revealed && Boolean(item?.audio) && !audioError;
}

function stopAudioOnCompletion(isCompletion: boolean, stopAudio: () => void): void {
  if (isCompletion) stopAudio();
}

function revealPracticeCard(
  isEnToCz: boolean,
  revealed: boolean,
  audioError: boolean,
  playAudio: () => Promise<boolean>,
  setRevealed: Dispatch<SetStateAction<boolean>>,
): void {
  if (revealed) return;
  if (!isEnToCz && !audioError) {
    playAudio().catch((error: unknown) => reportError('Failed to play practice audio', error));
  }
  setRevealed(true);
}

type PracticeAudioPhasesOptions = {
  currentItem: UserItemLocal | null;
  isEnToCz: boolean;
  revealed: boolean;
  audioLoading: boolean;
  audioError: boolean;
  playAudio: () => Promise<boolean>;
  attemptedAudioItem: { current: UserItemLocal | null };
  isCompletion: boolean;
  stopAudio: () => void;
};

function usePracticeAudioPhases({
  currentItem,
  isEnToCz,
  revealed,
  audioLoading,
  audioError,
  playAudio,
  attemptedAudioItem,
  isCompletion,
  stopAudio,
}: PracticeAudioPhasesOptions): void {
  useEffect(() => {
    if (!currentItem?.audio || !isEnToCz || revealed || audioLoading || audioError) return;
    if (attemptedAudioItem.current === currentItem) return;
    attemptedAudioItem.current = currentItem;
    playAudio().catch((error: unknown) => reportError('Failed to play practice audio', error));
  }, [audioError, audioLoading, attemptedAudioItem, currentItem, isEnToCz, playAudio, revealed]);

  useEffect(() => {
    stopAudioOnCompletion(isCompletion, stopAudio);
  }, [isCompletion, stopAudio]);
}

export function usePracticeCardState({
  currentItem,
  revealed,
  isCompletion = false,
  setRevealed,
}: UsePracticeCardStateOptions) {
  const isEnToCz = currentItem?.review_direction === 'en_to_cz';
  const attemptedAudioItem = useRef<UserItemLocal | null>(null);
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
  usePracticeAudioPhases({
    currentItem,
    isEnToCz,
    revealed,
    audioLoading,
    audioError,
    playAudio: playAudioInternal,
    attemptedAudioItem,
    isCompletion,
    stopAudio,
  });

  const audioOnlyPhase = isAudioOnlyPhase(currentItem, isEnToCz, revealed, audioError);
  const czech = getPracticeCzech(currentItem, isEnToCz, revealed);
  const english = getPracticeEnglish(currentItem, isEnToCz, audioOnlyPhase, revealed, englishHinted);

  const resetQuestionState = useCallback(() => {
    setRevealed(false);
    resetHint();
  }, [currentItem, resetHint, setRevealed]);

  const handleReveal = useCallback(() => {
    revealPracticeCard(
      isEnToCz,
      revealed,
      audioError,
      playAudioInternal,
      setRevealed,
    );
  }, [audioError, isEnToCz, playAudioInternal, revealed, setRevealed]);

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
    pronunciation: getPracticePronunciation(currentItem, isEnToCz, audioOnlyPhase, revealed),
    resetHint,
    resetQuestionState,
  };
}

function getPracticeEnglish(
  item: UserItemLocal | null,
  isEnToCz: boolean,
  audioOnlyPhase: boolean,
  revealed: boolean,
  englishHinted: string,
): string | undefined {
  if (!isEnToCz) return getEnglishText(item, revealed, englishHinted);
  if (audioOnlyPhase) return undefined;
  return item?.english;
}

function getPracticePronunciation(
  item: UserItemLocal | null,
  isEnToCz: boolean,
  audioOnlyPhase: boolean,
  revealed: boolean,
): string {
  if (!isEnToCz) return getPronunciationText(item, revealed);
  if (audioOnlyPhase) return NBSP;
  return item?.pronunciation || NBSP;
}
