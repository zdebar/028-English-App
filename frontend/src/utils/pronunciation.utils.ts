import type { GroupType } from '@/types/table.types';

const IGNORED_IPA_MARKS = /[ˈˌːˑ.\s]/gu;

function normalizeIpa(pronunciation: string): string {
  let normalized = pronunciation.trim();
  const hasSlashDelimiters = normalized.startsWith('/') && normalized.endsWith('/');
  const hasBracketDelimiters = normalized.startsWith('[') && normalized.endsWith(']');
  if (hasSlashDelimiters || hasBracketDelimiters) normalized = normalized.slice(1, -1);
  return normalized.replace(IGNORED_IPA_MARKS, '');
}

export function splitPronunciationIntoSounds(
  pronunciation: string,
  sounds: readonly GroupType[],
): GroupType[] {
  const ipa = normalizeIpa(pronunciation);
  if (!ipa) return [];

  const symbols = sounds
    .filter((sound) => sound.type === 'sound' && !sound.deleted_at && sound.name.length > 0)
    .sort((left, right) => right.name.length - left.name.length || left.sort_order - right.sort_order);
  const matchedSounds: GroupType[] = [];

  for (let offset = 0; offset < ipa.length;) {
    const match = symbols.find((sound) => ipa.startsWith(sound.name, offset));
    if (match) {
      matchedSounds.push(match);
      offset += match.name.length;
      continue;
    }
    offset += String.fromCodePoint(ipa.codePointAt(offset) ?? 0).length;
  }

  return matchedSounds;
}
