import Button from '@/components/UI/buttons/Button';
import CloseIcon from '@/components/UI/icons/CloseIcon';
import ButtonAsyncModal from './buttons/ButtonAsyncModal';
import Loading from './Loading';
import Hint from '@/components/UI/Hint';
import { useOverlayStore } from '@/hooks/use-overlay-store';

interface OverviewCardProps {
  titleText?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  handleReset?: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * OverviewCard component for displaying a card with a title, actions, and content.
 */
export default function OverviewCard({
  titleText = 'bez názvu',
  isLoading = false,
  error = null,
  className = '',
  handleReset,
  onClose,
  children,
}: OverviewCardProps) {
  const { isOpen } = useOverlayStore();

  return (
    <div className={`card-height card-width flex flex-col justify-start gap-1 ${className}`}>
      <div className="h-button flex items-center justify-between gap-1">
        <ButtonAsyncModal
          message={titleText}
          modalTitle="Vymazat pokrok"
          modalDescription="Opravdu chcete vymazat veškerý pokrok? Změna již nepůjde vrátit."
          onConfirm={() => {
            if (handleReset) {
              handleReset();
            }
            onClose();
          }}
          disabled={!handleReset}
          className="shape-button-rectangular color-button flex grow items-center justify-start pl-4"
        />
        <Hint visibility={isOpen} style={{ top: '0px', left: '14px' }}>
          obnovit pokrok
        </Hint>
        <Button className="w-button grow-0" onClick={onClose}>
          <CloseIcon />
        </Button>
      </div>
      <div className="w-full grow p-4">
        {isLoading ? <Loading /> : error ? <p>{error}</p> : children}
      </div>
    </div>
  );
}
