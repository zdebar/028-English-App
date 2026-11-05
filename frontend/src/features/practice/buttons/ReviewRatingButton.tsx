import ForwardIcon from '@/components/UI/icons/ForwardIcon';
import ChevronRightIcon from '@/components/UI/icons/ChevronRightIcon';
import { TEXTS } from '@/locales/cs';
import ControlButton from './ControlButton';

type ReviewRating = 'known' | 'easy';

type ReviewRatingButtonProps = Readonly<{
  rating: ReviewRating;
  onClick?: () => void | Promise<void>;
  disabled: boolean;
}>;

const RATING_LABELS = {
  known: TEXTS.known,
  easy: TEXTS.easy,
} as const;

const RATING_ICONS = {
  known: <ChevronRightIcon />,
  easy: <ForwardIcon />,
} as const;

export default function ReviewRatingButton({ rating, onClick, disabled }: ReviewRatingButtonProps) {
  return (
    <ControlButton
      data-testid={`${rating}-btn`}
      icon={RATING_ICONS[rating]}
      label={RATING_LABELS[rating]}
      className="pos-help-top-right"
      onClick={() => void onClick?.()}
      disabled={disabled}
    />
  );
}
