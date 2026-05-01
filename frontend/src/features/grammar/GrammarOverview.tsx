import OverviewCard from '@/components/UI/OverviewCard';
import { useAuthStore } from '@/features/auth/use-auth-store';
import HelpButton from '@/features/help/HelpButton';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledButton from '@/components/UI/buttons/StyledButton';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { useOverview } from '../../hooks/use-overview';
import Grammar from '@/database/models/grammar';
import type { GrammarType } from '@/types/generic.types';
import UserItem from '@/database/models/user-items';
import { DataState } from '@/components/UI/DataState';

/**
 * GrammarOverview component displays a list of started grammar topics for the user.
 *
 * @returns {JSX.Element} A view with a grammar list and detail card, including progress reset and help features.
 * @throws Doesn't throw errors; displays toast messages on failures.
 */
export default function GrammarOverview(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const {
    data: grammarList,
    currentIndex,
    setCurrentIndex,
    currentItem,
    handleReset,
    fetchError,
    resetError,
    loading,
    hasData,
  } = useOverview<GrammarType>({
    fetchFunction: () => (userId ? Grammar.getStarted(userId) : Promise.resolve([])),
    resetFunction: (item) =>
      userId ? UserItem.resetItemsByGrammarId(userId, item.id) : Promise.resolve(),
  });

  // -- List view --
  if (currentIndex === null) {
    return (
      <div className={`card-width flex flex-col justify-start gap-1`}>
        <div className="h-button flex items-center justify-between gap-1">
          <div className="flex grow justify-start px-4">{TEXTS.grammarOverview}</div>
          <CloseButton onClick={() => navigate('/profile')} />
        </div>
        <DataState
          loading={loading}
          error={!!fetchError}
          hasData={hasData}
          noDataMessage={TEXTS.noGrammar}
        >
          {grammarList.map((item, index) => (
            <StyledButton
              key={item.id}
              className="h-input flex justify-start px-4 text-left"
              onClick={() => setCurrentIndex(index)}
              title={item.name}
            >
              <p className="overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</p>
            </StyledButton>
          ))}
        </DataState>
      </div>
    );
  }

  // -- GrammarCard view --
  return (
    <OverviewCard
      buttonTitle={currentItem?.name ?? TEXTS.grammarOverview}
      modalTitle={TEXTS.restartGrammarProgress}
      handleReset={handleReset}
      onClose={() => setCurrentIndex(null)}
      className="relative"
    >
      <div dangerouslySetInnerHTML={{ __html: currentItem?.note || '' }} className="grammar" />
      <HelpButton className="right-0 -bottom-10.5" />
    </OverviewCard>
  );
}
