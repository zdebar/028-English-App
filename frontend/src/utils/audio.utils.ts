/** Normalizes audio input to a deduplicated list of filenames. */
export function normalizeAudioInput(
  audio: string | readonly string[] | null | undefined,
): string[] {
  const filenames = typeof audio === 'string' ? [audio] : audio ?? [];
  return [...new Set(filenames.filter(Boolean))];
}
