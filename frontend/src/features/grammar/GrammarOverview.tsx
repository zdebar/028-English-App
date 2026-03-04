import OverviewCard from '@/components/UI/OverviewCard';
import Grammar from '@/database/models/grammar';
import { useAuthStore } from '@/features/auth/use-auth-store';
import HelpButton from '@/features/help/HelpButton';
import { TEXTS } from '@/locales/cs';
import type { GrammarLocal } from '@/types/local.types';
import DOMPurify from 'dompurify';
import { useCallback, useMemo, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseButton from '@/components/UI/buttons/BaseButton';
import CloseButton from '@/components/UI/buttons/CloseButton';
import DelayedMessage from '@/components/UI/DelayedMessage';
import { useArray } from '@/hooks/use-array';
import NotificationText from '@/components/UI/NotificationText';

/**
 * GrammarOverview component displays a list of started grammar topics for the user.
 *
 * @returns {JSX.Element} A view with a grammar list and detail card, including progress reset and help features.
 * @throws Doesn't throw errors; displays toast messages on failures.
 */
export default function GrammarOverview(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();

  // -- Data Fetching and Effects --
  const fetchGrammarList = useCallback(async () => {
    if (!userId) return [];
    return Grammar.getStartedList(userId);
  }, [userId]);

  const {
    data: grammarArray,
    currentIndex,
    currentItem: currentGrammar,
    setCurrentIndex,
  } = useArray<GrammarLocal>(fetchGrammarList);

  const grammarList = grammarArray ?? [];
  const hasGrammar = grammarList.length > 0;
  const sanitizedNote = useMemo(() => {
    if (!currentGrammar?.note) return null;
    return DOMPurify.sanitize(currentGrammar.note);
  }, [currentGrammar?.note]);

  const handleOpenGrammar = useCallback(
    (index: number) => {
      setCurrentIndex(index);
    },
    [setCurrentIndex],
  );

  // List view
  if (currentIndex === null) {
    return (
      <div className={`card-width flex flex-col justify-start gap-1`}>
        <div className="h-button flex items-center justify-between gap-1">
          <div className="flex grow justify-start px-4">{TEXTS.grammarOverview}</div>
          <CloseButton onClick={() => navigate('/profile')} />
        </div>
        {hasGrammar ? (
          grammarList.map((item, index) => (
            <BaseButton
              key={item.id}
              className="h-input flex grow-0 justify-start px-4 text-left"
              onClick={() => handleOpenGrammar(index)}
            >
              {`${index + 1} : ${item.name} `}
            </BaseButton>
          ))
        ) : (
          <DelayedMessage>
            <NotificationText text={TEXTS.noGrammar} />
          </DelayedMessage>
        )}
      </div>
    );
  }

  // GrammarCard view
  return (
    <OverviewCard
      buttonTitle={currentGrammar?.name ?? TEXTS.grammarOverview}
      modalTitle={TEXTS.restartGrammarProgress}
      onClose={() => setCurrentIndex(null)}
      className="relative"
    >
      {sanitizedNote ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizedNote }} />
      ) : (
        <DelayedMessage>
          <NotificationText text={TEXTS.notAvailable} />
        </DelayedMessage>
      )}
      <HelpButton className="right-0 -bottom-10.5" />
    </OverviewCard>
  );
}
