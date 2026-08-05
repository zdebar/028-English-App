import GrammarChunk from '@/database/models/grammar-chunks';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useCallback, useState } from 'react';
import type { GrammarDetail } from './GrammarDetailCard';
import { useAuthStore } from '@/features/auth/use-auth-store';

export function useGrammarViewer() {
  const userId = useAuthStore((state) => state.userId);
  const [isGrammarVisible, setIsGrammarVisible] = useState(false);
  const [grammarData, setGrammarData] = useState<GrammarDetail | null>(null);
  const showToast = useToastStore((state) => state.showToast);

  const openGrammar = useCallback(
    async (grammarChunkId: number | null | undefined) => {
      if (typeof grammarChunkId !== 'number' || !userId) return;

      try {
        const grammar = await GrammarChunk.getDetail(userId, grammarChunkId);
        if (!grammar) return;

        setGrammarData({ ...grammar, kind: 'chunk' });
        setIsGrammarVisible(true);
      } catch (error) {
        reportError('Error fetching grammar:', error);
        showToast(TEXTS.loadingError, 'error');
      }
    },
    [showToast, userId],
  );

  const closeGrammar = useCallback(() => {
    setIsGrammarVisible(false);
  }, []);

  return {
    isGrammarVisible,
    grammarData,
    openGrammar,
    closeGrammar,
  };
}
