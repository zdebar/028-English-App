import { useEffect } from 'react';
import { useAudioStore } from './use-audio-store';

/**
 * Custom hook to initialize and update audio settings when userId changes.
 *
 * @param userId The current user ID (optional)
 */
export function useAudioLoader(userId: string | null) {
  const init = useAudioStore((s) => s.init);

  useEffect(() => {
    init(userId);
  }, [userId, init]);
}
