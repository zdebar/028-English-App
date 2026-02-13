import { validateNonNegativeInteger } from '@/utils/validation.utils';

/**
 * Alternates the direction of the words based on their progress.
 * @param progress - The progress value.
 * @returns True if direction is CZ -> EN, false otherwise.
 * @throws Error if progress is not a non-negative integer.
 */
export function alternateDirection(progress: number): boolean {
  validateNonNegativeInteger(progress, 'progress');
  return progress % 2 === 0;
}
