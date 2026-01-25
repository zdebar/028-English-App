import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { TEXTS } from '@/config/texts';

type ListItem = {
  id: string | number;
  name: string;
};

type ListOverviewProps = {
  listTitle?: string;
  emptyTitle?: string;
  array: ListItem[] | null;
  loading: boolean;
  error: string | null;
  onSelect: (index: number) => void;
  onClose: () => void;
};

/**
 * ListOverview component displays a list of grammar items.
 *
 * @param listTitle Title of the list overview.
 * @param emptyTitle Title to display when the list is empty.
 * @param array Array of ListItem items.
 * @param loading Loading state.
 * @param error Error message.
 * @param onSelect Callback when a grammar item is selected.
 * @param onClose Callback when the close button is clicked.
 */
export default function ListOverview({
  listTitle,
  emptyTitle = TEXTS.noNotesToDisplay,
  array,
  loading,
  error,
  onSelect,
  onClose,
}: ListOverviewProps) {
  return (
    <div className="card-width flex flex-col justify-start gap-1">
      <div className="h-button flex items-center justify-between gap-1">
        <div className="h-button flex grow justify-start p-4">
          {loading ? TEXTS.buttonLoading : error || listTitle}
        </div>
        <CloseButton onClick={onClose} />
      </div>
      {array && array.length > 0 ? (
        array.map((item, index) => (
          <ButtonRectangular
            key={item.id}
            className="h-input flex grow-0 justify-start p-4 text-left"
            onClick={() => onSelect(index)}
          >
            {`${index + 1} : ${item.name} `}
          </ButtonRectangular>
        ))
      ) : (
        <p className="h-input flex justify-start p-4 text-left">{emptyTitle}</p>
      )}
    </div>
  );
}
