import Button from '@/components/UI/buttons/Button';
import CloseIcon from '@/components/UI/icons/CloseIcon';

/**
 * Minimal type for list items.
 */
type ListItem = {
  id: string | number;
  name: string;
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
  emptyTitle = 'Žádné položky k zobrazení',
  array,
  loading,
  error,
  onSelect,
  onClose,
}: {
  listTitle?: string;
  emptyTitle?: string;
  array: ListItem[] | null;
  loading: boolean;
  error: string | null;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="card-width flex flex-col justify-start gap-1">
      <div className="h-button flex items-center justify-between gap-1">
        <div className="h-button flex grow justify-start p-4">
          {loading ? 'Načítání...' : error || listTitle}
        </div>
        <Button className="w-button grow-0" onClick={onClose}>
          <CloseIcon />
        </Button>
      </div>
      {array && array.length > 0 ? (
        array.map((item, index) => (
          <Button
            key={item.id}
            className="h-input flex grow-0 justify-start p-4 text-left"
            onClick={() => onSelect(index)}
          >
            {`${index + 1} : ${item.name} `}
          </Button>
        ))
      ) : (
        <p className="h-input flex justify-start p-4 text-left">{emptyTitle}</p>
      )}
    </div>
  );
}
