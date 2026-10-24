import ForwardIcon from '@/components/UI/icons/ForwardIcon';
import ChevronRightIcon from '@/components/UI/icons/ChevronRightIcon';
import TripleChevronIcon from '@/components/UI/icons/TripleChevronIcon';
import { TEXTS } from '@/locales/cs';
import ControlButton from './ControlButton';

type ReviewRating = 'hard' | 'good' | 'easy';

type ReviewRatingButtonProps = Readonly<{
  rating: ReviewRating;
  onClick?: () => void | Promise<void>;
  disabled: boolean;
}>;

const RATING_LABELS = {
  hard: TEXTS.hard,
  good: TEXTS.good,
  easy: TEXTS.easy,
} as const;

function getRatingIcon(rating: ReviewRating) {
  if (rating === 'good') return <ForwardIcon />;
  if (rating === 'hard') return <ChevronRightIcon />;
  return <TripleChevronIcon />;
}

export default function ReviewRatingButton({ rating, onClick, disabled }: ReviewRatingButtonProps) {
  return (
    <ControlButton
      data-testid={`${rating}-btn`}
      icon={getRatingIcon(rating)}
      label={RATING_LABELS[rating]}
      className="pos-help-top-right"
      onClick={() => void onClick?.()}
      disabled={disabled}
    />
  );
}
