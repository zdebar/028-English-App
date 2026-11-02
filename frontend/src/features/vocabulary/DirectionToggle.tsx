import StyledButton from '@/components/UI/buttons/StyledButton';
import { TEXTS } from '@/locales/cs';
import type { DisplayField } from './vocabulary.utils';

type DirectionToggleProps = Readonly<{
  value: DisplayField;
  onChange: (value: DisplayField) => void;
  className?: string;
}>;

export default function DirectionToggle({
  value,
  onChange,
  className = '',
}: DirectionToggleProps) {
  const isCzech = value === 'czech';
  const currentLabel = isCzech ? TEXTS.vocabularyCzechOption : TEXTS.vocabularyEnglishOption;
  const accessibleLabel = `${TEXTS.translationDirection}: ${currentLabel}`;

  return (
    <div className={`border-none text-center ${className}`}>
      <StyledButton
        name="direction"
        type="button"
        title={accessibleLabel}
        aria-label={accessibleLabel}
        onClick={() => onChange(isCzech ? 'english' : 'czech')}
        className="h-full"
      >
        {currentLabel}
      </StyledButton>
    </div>
  );
}
