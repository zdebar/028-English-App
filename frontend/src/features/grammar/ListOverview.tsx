import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import CloseButton from '@/components/UI/buttons/CloseButton';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

type ListItem = {
  id: string | number;
  name: string;
};

type ListOverviewProps = {
  array: ListItem[] | null;
  listTitle?: string;
  onSelect: (index: number) => void;
  onClose: () => void;
  className?: string;
};

/**
 * ListOverview component displays a list of grammar items.
 *
 * @param array Array of ListItem items.
 * @param listTitle Title of the list overview.
 * @param onSelect Callback when a grammar item is selected.
 * @param onClose Callback when the close button is clicked.
 * @returns {JSX.Element} A list overview component.
 */
export default function ListOverview({
  listTitle = TEXTS.notAvailable,
  array,
  onSelect,
  onClose,
  className = '',
}: ListOverviewProps): JSX.Element {
  return (
    <div className={`card-width flex flex-col justify-start gap-1 ${className}`}>
      <div className="h-button flex items-center justify-between gap-1">
        <div className="h-button flex grow justify-start p-4">{listTitle}</div>
        <CloseButton onClick={onClose} />
      </div>
      {array &&
        array.map((item, index) => (
          <ButtonRectangular
            key={item.id}
            className="h-input flex grow-0 justify-start p-4 text-left"
            onClick={() => onSelect(index)}
          >
            {`${index + 1} : ${item.name} `}
          </ButtonRectangular>
        ))}
    </div>
  );
}
