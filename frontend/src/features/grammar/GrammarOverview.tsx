import OverviewCard from '@/components/UI/OverviewCard';
import Grammar from '@/database/models/grammar';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import HelpButton from '@/features/help/HelpButton';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import type { GrammarWithProgress } from '@/types/local.types';
import DOMPurify from 'dompurify';
import { useCallback, useMemo, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import CloseButton from '@/components/UI/buttons/CloseButton';
import PropertyView from '@/components/UI/PropertyView';
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
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  // -- Data Fetching and Effects --
  const fetchGrammarList = useCallback(async () => {
    if (!userId) return [];
    return Grammar.getStartedGrammarListWithProgress(userId);
  }, [userId]);

  const {
    data: grammarArray,
    currentIndex,
    currentItem: currentGrammar,
    reload,
    setCurrentIndex,
  } = useArray<GrammarWithProgress>(fetchGrammarList);

  const grammarList = grammarArray ?? [];
  const hasGrammar = grammarList.length > 0;
  const sanitizedNote = useMemo(() => {
    if (!currentGrammar?.note) return null;
    return DOMPurify.sanitize(currentGrammar.note);
  }, [currentGrammar?.note]);

  // -- Handlers --
  const handleClearGrammarUserItems = useCallback(async () => {
    if (!userId || typeof currentGrammar?.id !== 'number') return;

    try {
      await UserItem.resetGrammarItems(userId, currentGrammar.id);
      await reload();
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch {
      showToast(TEXTS.resetProgressErrorToast, 'error');
    }
  }, [currentGrammar?.id, reload, showToast, userId]);

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
          <div className="h-button flex grow justify-start p-4">{TEXTS.grammarOverview}</div>
          <CloseButton onClick={() => navigate('/profile')} />
        </div>
        {hasGrammar ? (
          grammarList.map((item, index) => (
            <ButtonRectangular
              key={item.id}
              className="h-input flex grow-0 justify-start p-4 text-left"
              onClick={() => handleOpenGrammar(index)}
            >
              {`${index + 1} : ${item.name} `}
            </ButtonRectangular>
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
      handleReset={handleClearGrammarUserItems}
      className="relative"
    >
      <PropertyView
        label={TEXTS.startedCount}
        value={`${currentGrammar?.startedCount ?? 0} / ${currentGrammar?.totalCount ?? 0}`}
        classNameValue="text-right w-20"
      />
      <PropertyView
        label={TEXTS.masteredCount}
        value={`${currentGrammar?.masteredCount ?? 0} / ${currentGrammar?.totalCount ?? 0}`}
        className="pb-4"
        classNameValue="w-20 text-right"
      />
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
