import { useState, useCallback } from 'react';
import Grammar from '@/database/models/grammar';
import { errorHandler } from '@/features/logging/error-handler';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '@/features/toast/use-toast-store';
import type { GrammarCardType } from '../GrammarCard';

export function useGrammar() {
  const [grammarVisible, setGrammarVisible] = useState(false);
  const [grammarData, setGrammarData] = useState<GrammarCardType | null>(null);
  const showToast = useToastStore((state) => state.showToast);

  const handleGrammar = useCallback(
    async (grammar_id: number | null) => {
      if (!grammar_id) return;
      try {
        const grammar = await Grammar.getGrammarById(grammar_id);
        setGrammarData(grammar);
        setGrammarVisible(true);
      } catch (error) {
        errorHandler('Error fetching grammar:', error);
        showToast(TEXTS.loadingError, 'error');
      }
    },
    [showToast],
  );

  const closeGrammar = () => setGrammarVisible(false);

  return {
    grammarVisible,
    grammarData,
    handleGrammar,
    closeGrammar,
  };
}
