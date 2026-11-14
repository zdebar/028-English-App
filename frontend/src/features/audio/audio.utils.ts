import type { UserItemLocal } from '@/types/user-item.types';
import { TEXTS } from '@/locales/cs';
import type { AudioPlaybackResult } from './use-audio-playback';

export function isAudioPlayable(
  audio: string | null | undefined,
  isAudioReady: (audio: string) => boolean | null,
): boolean {
  if (!audio?.trim()) return false;
  return isAudioReady(audio) !== false;
}

export function getItemAudioSources(
  items: readonly Pick<UserItemLocal, 'audio'>[],
): string[] {
  return items.flatMap((item) => item.audio?.trim() ? [item.audio] : []);
}

export async function playAudioWithToast(
  audio: string | null | undefined,
  playAudio: (audio: string) => Promise<AudioPlaybackResult>,
  showToast: (message: string, type: 'error') => void,
): Promise<void> {
  if (!audio?.trim()) return;
  const error = await playAudio(audio);
  if (error) showToast(TEXTS.noAudio, 'error');
}
