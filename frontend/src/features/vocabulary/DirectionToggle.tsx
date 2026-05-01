import { TEXTS } from '@/locales/cs';
import { useEffect, useMemo } from 'react';
import { errorHandler } from '../logging/error-handler';
import StyledButton from '@/components/UI/buttons/StyledButton';

type DirectionToggleProps<T> = Readonly<{
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}>;

/**
 * DirectionSwitch Component
 *
 * A generic, reusable toggle button component for switching between two directions.
 *
 * @template T - The type of the option values.
 * @param value - The currently selected value.
 * @param options - Array of selectable options, each with a value and label.
 * @param onChange - Callback invoked when the selected value changes.
 * @param className - Optional additional CSS classes for custom styling.
 * @returns A styled button that cycles through provided options.
 */
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
      errorHandler(
        'DirectionToggle expects at least 1 option, received 0.',
        new Error('Invalid toggle options count'),
      );
      return;
    }

    if (currentIndex !== -1) return;

    errorHandler(
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
            errorHandler(
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
