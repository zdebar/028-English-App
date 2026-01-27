/**
 * Alternates the direction of the words based on their progress.
 * @param progress - The progress value.
 * @returns True if direction is CZ -> EN, false otherwise.
 * @throws Error if progress is not a non-negative integer.
 */
export function alternateDirection(progress: number): boolean {
  if (!Number.isInteger(progress) || progress < 0) {
    throw new Error('progress must be a non-negative integer');
  }
  return progress % 2 === 0;
}
