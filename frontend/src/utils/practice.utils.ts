/**
 * Alternates the direction of the words based on their progress.
 * @param progress - The progress value.
 * @returns True if direction is CZ -> EN, false otherwise.
 */
export function alternateDirection(progress: number): boolean {
  return progress % 2 === 0;
}
