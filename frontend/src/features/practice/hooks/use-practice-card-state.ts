import { useAudioManager } from '@/features/audio/use-audio-manager';
import { isAudioPlayable } from '@/features/audio/audio.utils';
import { reportError } from '@/features/logging/logging-handler';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { NBSP, useHint } from './use-hint';
import type { AudioPlaybackResult } from '@/features/audio/use-audio-playback';

type UsePracticeCardStateOptions = {
  currentItem: UserItemLocal | null;
  revealed: boolean;
  isCompletion?: boolean;
  setRevealed: Dispatch<SetStateAction<boolean>>;
};

type PracticeAudioPhasesOptions = {
  currentItem: UserItemLocal | null;
  isEnToCz: boolean;
  revealed: boolean;
  audioLoading: boolean;
  audioError: boolean;
  playAudio: () => Promise<AudioPlaybackResult>;
  attemptedAudioItem: { current: UserItemLocal | null };
  isCompletion: boolean;
  stopAudio: () => void;
};

export function usePracticeCardState({
  currentItem,
  revealed,
  isCompletion = false,
  setRevealed,
}: UsePracticeCardStateOptions) {
  const isEnToCz = currentItem?.review_direction === 'en_to_cz';
  const attemptedAudioItem = useRef<UserItemLocal | null>(null);
  const { englishHinted, czechHinted, resetHint, plusHint } = useHint(
    currentItem?.czech,
    currentItem?.english,
  );
  const {
    playAudio: playAudioForFilename,
    stopAudio,
    audioError,
    loading: audioLoading,
    isAudioReady,
    isPlaying,
  } = useAudioManager(currentItem?.audio ?? null);
  const playAudioInternal = useCallback(
    () => playAudioForFilename(currentItem?.audio ?? ''),
    [currentItem?.audio, playAudioForFilename],
  );

  const audioDisabled = isPracticeAudioDisabled(
    revealed,
    isEnToCz,
    currentItem,
    isAudioReady,
  );
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

  const czech = getPracticeCzech(currentItem, isEnToCz, revealed, czechHinted);
  const english = getPracticeEnglish(currentItem, isEnToCz, revealed, englishHinted);
  const czechHintVisible = isEnToCz && !revealed && czechHinted !== NBSP;

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
    czechHintVisible,
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

function getPracticeEnglish(
  item: UserItemLocal | null,
  isEnToCz: boolean,
  revealed: boolean,
  englishHinted: string,
): string | undefined {
  if (!isEnToCz) return getEnglishText(item, revealed, englishHinted);
  return revealed ? item?.english : englishHinted;
}

function isPracticeAudioDisabled(
  revealed: boolean,
  isEnToCz: boolean,
  currentItem: UserItemLocal | null,
  isAudioReady: (audio: string) => boolean | null,
): boolean {
  const shouldHideAudio = !revealed && !isEnToCz;
  const audioUnavailable = !isAudioPlayable(currentItem?.audio, isAudioReady);
  return shouldHideAudio || audioUnavailable;
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

function getPracticeCzech(
  item: UserItemLocal | null,
  isEnToCz: boolean,
  revealed: boolean,
  czechHinted: string,
): string | undefined {
  if (isEnToCz && !revealed) return czechHinted;
  return getCzechText(item);
}

function stopAudioOnCompletion(isCompletion: boolean, stopAudio: () => void): void {
  if (isCompletion) stopAudio();
}

function revealPracticeCard(
  isEnToCz: boolean,
  revealed: boolean,
  audioError: boolean,
  playAudio: () => Promise<AudioPlaybackResult>,
  setRevealed: Dispatch<SetStateAction<boolean>>,
): void {
  if (revealed) return;
  if (!isEnToCz && !audioError) {
    playAudio().catch((error: unknown) => reportError('Failed to play practice audio', error));
  }
  setRevealed(true);
}

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
