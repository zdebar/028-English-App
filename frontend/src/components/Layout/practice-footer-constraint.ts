import {
  createContext,
  useContext,
  useLayoutEffect,
  type Dispatch,
  type SetStateAction,
} from 'react';

export const PracticeFooterConstraintContext = createContext<
  Dispatch<SetStateAction<boolean>> | undefined
>(undefined);

/** Marks the mounted content as an active practice session for the app shell. */
export function usePracticeFooterConstraint(): void {
  const setPracticeSessionActive = useContext(PracticeFooterConstraintContext);

  useLayoutEffect(() => {
    setPracticeSessionActive?.(true);
    return () => setPracticeSessionActive?.(false);
  }, [setPracticeSessionActive]);
}
