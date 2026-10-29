import type { GroupType } from '@/types/table.types';

const IPA_MARKERS = new Set(['ˈ', 'ˌ', 'ː', 'ˑ', '.', ':', "'"]);

export type PronunciationSegment =
  | Readonly<{ kind: 'sound'; sound: GroupType }>
  | Readonly<{ kind: 'marker' | 'unknown'; text: string }>;

function normalizeIpa(pronunciation: string): string {
  let normalized = pronunciation.trim();
  const hasSlashDelimiters = normalized.startsWith('/') && normalized.endsWith('/');
  const hasBracketDelimiters = normalized.startsWith('[') && normalized.endsWith(']');
  if (hasSlashDelimiters || hasBracketDelimiters) normalized = normalized.slice(1, -1);
  return normalized;
}

export function splitPronunciationIntoSegments(
  pronunciation: string,
  sounds: readonly GroupType[],
): PronunciationSegment[] {
  const ipa = normalizeIpa(pronunciation);
  if (!ipa) return [];

  const symbols = sounds
    .filter((sound) => sound.type === 'sound' && !sound.deleted_at && sound.name.length > 0)
    .sort((left, right) => right.name.length - left.name.length || left.sort_order - right.sort_order);
  const segments: PronunciationSegment[] = [];

  for (let offset = 0; offset < ipa.length;) {
    const symbol = String.fromCodePoint(ipa.codePointAt(offset) ?? 0);
    const symbolLength = symbol.length;

    if (isIpaMarker(symbol)) {
      segments.push({ kind: 'marker', text: symbol });
      offset += symbolLength;
      continue;
    }

    const match = symbols.find((sound) => ipa.startsWith(sound.name, offset));
    if (match) {
      segments.push({ kind: 'sound', sound: match });
      offset += match.name.length;
      continue;
    }

    segments.push({ kind: 'unknown', text: symbol });
    offset += symbolLength;
  }

  return segments;
}

function isIpaMarker(symbol: string): boolean {
  return IPA_MARKERS.has(symbol) || /\s/u.test(symbol);
}

export function getSoundsFromPronunciationSegments(
  segments: readonly PronunciationSegment[],
): GroupType[] {
  return segments.flatMap((segment) => (segment.kind === 'sound' ? [segment.sound] : []));
}

export function splitPronunciationIntoSounds(
  pronunciation: string,
  sounds: readonly GroupType[],
): GroupType[] {
  return getSoundsFromPronunciationSegments(splitPronunciationIntoSegments(pronunciation, sounds));
}

export function getUniquePronunciationSounds(sounds: readonly GroupType[]): GroupType[] {
  const seenSoundIds = new Set<number>();
  return sounds.filter((sound) => {
    if (seenSoundIds.has(sound.id)) return false;
    seenSoundIds.add(sound.id);
    return true;
  });
}
