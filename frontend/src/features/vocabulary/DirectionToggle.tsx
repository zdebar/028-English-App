import { TEXTS } from '@/locales/cs';
import { useEffect, useMemo } from 'react';
import { reportError } from '../logging/monitoring-handler';
import StyledButton from '@/components/UI/buttons/StyledButton';

type DirectionToggleProps<T> = Readonly<{
  /** Current selected option value. Compared by string value so primitive ids and enum-like values work. */
  value: T;
  /** Options cycled in array order. Empty arrays log an error and show fallback text. */
  options: { value: T; label: string }[];
  /** Receives the next option value when the toggle button is clicked. */
  onChange: (value: T) => void;
  /** Extra classes appended to the outer wrapper. */
  className?: string;
}>;

export default function DirectionTogggle<T>({
  value,
  options,
  onChange,
  className = '',
}: DirectionToggleProps<T>) {
  const currentIndex = useMemo(() => {
    return options.findIndex((entry) => String(entry.value) === String(value));
  }, [options, value]);

  useEffect(() => {
    if (options.length === 0) {
      reportError(
        'DirectionToggle expects at least 1 option, received 0.',
        new Error('Invalid toggle options count'),
      );
      return;
    }

    if (currentIndex !== -1) return;

    reportError(
      `Value "${value}" is not valid for DirectionToggle.`,
      new Error('Invalid toggle value'),
    );
  }, [currentIndex, options, value]);

  const currentOption = currentIndex >= 0 ? options[currentIndex] : options[0];

  return (
    <div className={`border-none text-center ${className}`} title={TEXTS.translationDirection}>
      <label htmlFor="direction-toggle" className="sr-only">
        {TEXTS.translationDirection}
      </label>
      <StyledButton
        id="direction-toggle"
        name="direction"
        type="button"
        title={TEXTS.translationDirection}
        onClick={() => {
          if (options.length === 0) {
            reportError(
              'Cannot toggle DirectionToggle: options are not valid.',
              new Error('Invalid toggle state'),
            );
            return;
          }

          const safeCurrentIndex = Math.max(currentIndex, 0);
          const nextIndex = (safeCurrentIndex + 1) % options.length;
          onChange(options[nextIndex].value);
        }}
        className="h-full"
      >
        {currentOption ? currentOption.label : TEXTS.translationDirection}
      </StyledButton>
    </div>
  );
}
