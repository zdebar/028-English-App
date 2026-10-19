import { useAudioManager } from '@/features/audio/use-audio-manager';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
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

function getInitialStage(item: UserItemLocal | null): number {
  return item?.review_direction === 'en_to_cz' && item.audio ? 0 : 1;
}

function shouldAutoPlayAudio(isEnToCz: boolean, stage: number, audio: string | null | undefined): boolean {
  return isEnToCz && stage === 0 && Boolean(audio);
}

function getNextRevealStage(
  isEnToCz: boolean,
  stage: number,
  revealed: boolean,
): 'audio' | 'revealed' | 'ignore' {
  if (isEnToCz && stage === 0) return 'audio';
  if (revealed) return 'ignore';
  return 'revealed';
}

function getPracticeCzech(item: UserItemLocal | null, isEnToCz: boolean, stage: number): string | undefined {
  if (isEnToCz && stage < 2) return undefined;
  return getCzechText(item);
}

function playAudioForHiddenPhase(
  isEnToCz: boolean,
  stage: number,
  audio: string | null | undefined,
  playAudio: () => void,
): void {
  if (shouldAutoPlayAudio(isEnToCz, stage, audio)) void playAudio();
}

function skipFailedAudioPhase(
  isEnToCz: boolean,
  stage: number,
  audio: string | null | undefined,
  audioError: boolean,
  setStage: (stage: number) => void,
): void {
  if (shouldAutoPlayAudio(isEnToCz, stage, audio) && audioError) setStage(1);
}

function stopAudioOnCompletion(isCompletion: boolean, stopAudio: () => void): void {
  if (isCompletion) stopAudio();
}

function revealPracticeCard(
  isEnToCz: boolean,
  stage: number,
  revealed: boolean,
  audioError: boolean,
  playAudio: () => void,
  setStage: (stage: number) => void,
  setRevealed: Dispatch<SetStateAction<boolean>>,
): void {
  const revealStage = getNextRevealStage(isEnToCz, stage, revealed);
  if (revealStage === 'audio') {
    setStage(1);
    return;
  }
  if (revealStage === 'ignore') return;
  if (!isEnToCz && !audioError) void playAudio();
  setRevealed(true);
  setStage(2);
}

function usePracticeAudioPhases(
  currentItem: UserItemLocal | null,
  isEnToCz: boolean,
  stage: number,
  audioError: boolean,
  playAudio: () => void,
  setStage: (stage: number) => void,
  isCompletion: boolean,
  stopAudio: () => void,
): void {
  useEffect(() => {
    setStage(getInitialStage(currentItem));
  }, [currentItem?.item_id, currentItem?.review_direction, currentItem?.audio, setStage]);

  useEffect(() => {
    playAudioForHiddenPhase(isEnToCz, stage, currentItem?.audio, playAudio);
  }, [currentItem?.audio, isEnToCz, playAudio, stage]);

  useEffect(() => {
    skipFailedAudioPhase(isEnToCz, stage, currentItem?.audio, audioError, setStage);
  }, [audioError, currentItem?.audio, isEnToCz, setStage, stage]);

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
  const [enToCzStage, setEnToCzStage] = useState(1);
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
  usePracticeAudioPhases(
    currentItem,
    isEnToCz,
    enToCzStage,
    audioError,
    playAudioInternal,
    setEnToCzStage,
    isCompletion,
    stopAudio,
  );

  const czech = getPracticeCzech(currentItem, isEnToCz, enToCzStage);
  const english = getPracticeEnglish(currentItem, isEnToCz, enToCzStage, revealed, englishHinted);

  const resetQuestionState = useCallback(() => {
    setRevealed(false);
    setEnToCzStage(getInitialStage(currentItem));
    resetHint();
  }, [currentItem, resetHint, setRevealed]);

  const handleReveal = useCallback(() => {
    revealPracticeCard(
      isEnToCz,
      enToCzStage,
      revealed,
      audioError,
      playAudioInternal,
      setEnToCzStage,
      setRevealed,
    );
  }, [audioError, enToCzStage, isEnToCz, playAudioInternal, revealed, setRevealed]);

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
    pronunciation: getPracticePronunciation(currentItem, isEnToCz, enToCzStage, revealed),
    resetHint,
    resetQuestionState,
  };
}

function getPracticeEnglish(
  item: UserItemLocal | null,
  isEnToCz: boolean,
  stage: number,
  revealed: boolean,
  englishHinted: string,
): string | undefined {
  if (!isEnToCz) return getEnglishText(item, revealed, englishHinted);
  if (stage === 0) return undefined;
  return item?.english;
}

function getPracticePronunciation(
  item: UserItemLocal | null,
  isEnToCz: boolean,
  stage: number,
  revealed: boolean,
): string {
  if (!isEnToCz) return getPronunciationText(item, revealed);
  if (stage === 0) return NBSP;
  return item?.pronunciation || NBSP;
}
