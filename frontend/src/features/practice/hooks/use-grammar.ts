import { useState, useCallback } from 'react';
import Grammar from '@/database/models/grammar';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '@/features/toast/use-toast-store';
import type { GrammarCardType } from '../GrammarCard';

export function useGrammar() {
  const [grammarVisible, setGrammarVisible] = useState(false);
  const [grammarData, setGrammarData] = useState<GrammarCardType | null>(null);
  const showToast = useToastStore((state) => state.showToast);

  const handleGrammar = useCallback(
    async (grammarId: number | null) => {
      if (typeof grammarId !== 'number') return;

      try {
        const grammar = await Grammar.getById(grammarId);
        setGrammarData(grammar);
        setGrammarVisible(true);
      } catch (error) {
        reportError('Error fetching grammar:', error);
        showToast(TEXTS.loadingError, 'error');
      }
    },
    [showToast],
  );

  const closeGrammar = useCallback(() => {
    setGrammarVisible(false);
  }, []);

  return {
    grammarVisible,
    grammarData,
    handleGrammar,
    closeGrammar,
  };
}
