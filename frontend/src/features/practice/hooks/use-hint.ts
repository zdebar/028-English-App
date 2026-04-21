import { useState, useCallback } from 'react';

const NBSP = '\u00A0';

/**
 * Hook for managing hint progression across two sections.
 *
 * @param lengthFirst - Maximum number of hints available for the first section
 * @param lengthSecond - Maximum number of hints available for the second section
 *
 * @returns Object containing:
 *   - `plusHint` - Callback to increment hint index
 *   - `englishHinted` - Current hint count for english (0 to lengthFirst)
 *   - `czechHinted` - Current hint count for czech (0 to lengthSecond)
 *   - `index` - Current absolute hint index
 *   - `reset` - Callback to reset hint index to 0
 *
 * Usage:
 *  - `from czech to english` - reveal english (with hintFirst)
 *  - `from english to czech` - reveal english (with hintFirst), then czech (with hintSecond)
 */
export function useHint(czech: string = '', english: string = '') {
  const [index, setIndex] = useState(0);

  const plusHint = useCallback(() => {
    setIndex((prev) => prev + 1);
  }, []);

  const englishRevealedLength = Math.min(index, english.length);
  const czechRevealedLength = Math.min(Math.max(index - english.length, 0), czech.length);

  const englishHinted = english.slice(0, englishRevealedLength) || NBSP;
  const czechHinted = czech.slice(0, czechRevealedLength) || NBSP;

  const resetHint = useCallback(() => {
    setIndex(0);
  }, []);

  return {
    plusHint,
    englishHinted,
    czechHinted,
    index,
    resetHint,
  };
}
