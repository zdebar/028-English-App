import { useState, useCallback } from 'react';

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
  czech = czech ?? '';
  english = english ?? '';

  const [index, setIndex] = useState(0);

  const plusHint = useCallback(() => {
    setIndex((prev) => prev + 1);
  }, []);

  const englishLength = english.length;
  const czechLength = czech.length;

  const englishHinted = english
    ? index === 0
      ? '\u00A0'
      : english.slice(0, Math.min(index, englishLength))
    : '\u00A0';

  const czechHinted = czech
    ? index <= englishLength
      ? '\u00A0'
      : czech.slice(0, Math.min(index - englishLength, czechLength))
    : '\u00A0';

  return {
    plusHint,
    englishHinted,
    czechHinted,
    index,
    resetHint: () => setIndex(0),
  };
}
