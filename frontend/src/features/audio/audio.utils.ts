import type { UserItemLocal } from '@/types/user-item.types';
import { TEXTS } from '@/locales/cs';

export function getItemAudioSources(
  items: readonly Pick<UserItemLocal, 'audio'>[],
): string[] {
  return items.flatMap((item) => item.audio?.trim() ? [item.audio] : []);
}

export async function playAudioWithToast(
  audio: string | null | undefined,
  playAudio: (audio: string) => Promise<boolean>,
  showToast: (message: string, type: 'error') => void,
): Promise<void> {
  if (!audio?.trim()) return;
  const didPlay = await playAudio(audio);
  if (!didPlay) showToast(TEXTS.noAudio, 'error');
}
