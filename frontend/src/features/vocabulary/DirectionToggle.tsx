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
 * @returns A styled button that toggles between exactly two provided options.
 */
export default function DirectionTogggle<T>({
  value,
  options,
  onChange,
  className = '',
}: DirectionToggleProps<T>) {
  const currentIndex = useMemo(() => {
    return options.findIndex((option) => String(option.value) === String(value));
  }, [options, value]);

  useEffect(() => {
    if (options.length !== 2) {
      errorHandler(
        `DirectionToggle expects exactly 2 options, received ${options.length}.`,
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
  const nextOption =
    options.length === 2 && currentIndex !== -1 ? options[(currentIndex + 1) % 2] : undefined;

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
          if (!nextOption) {
            errorHandler(
              'Cannot toggle DirectionToggle: options are not valid.',
              new Error('Invalid toggle state'),
            );
            return;
          }

          onChange(nextOption.value);
        }}
        className="h-full"
      >
        {currentOption?.label ?? TEXTS.translationDirection}
      </StyledButton>
    </div>
  );
}
