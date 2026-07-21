import GrammarChunk from '@/database/models/grammar-chunks';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useCallback, useState } from 'react';
import type { GrammarDetail } from './GrammarDetailCard';

export function useGrammarViewer() {
  const [isGrammarVisible, setIsGrammarVisible] = useState(false);
  const [grammarData, setGrammarData] = useState<GrammarDetail | null>(null);
  const showToast = useToastStore((state) => state.showToast);

  const openGrammar = useCallback(
    async (grammarId: number | null | undefined) => {
      if (typeof grammarId !== 'number') return;

      try {
        const grammar = await GrammarChunk.getById(grammarId);
        if (!grammar) return;

        setGrammarData(grammar);
        setIsGrammarVisible(true);
      } catch (error) {
        reportError('Error fetching grammar:', error);
        showToast(TEXTS.loadingError, 'error');
      }
    },
    [showToast],
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
