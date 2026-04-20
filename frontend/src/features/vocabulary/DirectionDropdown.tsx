import { TEXTS } from '@/locales/cs';
import { useEffect, useMemo } from 'react';
import { errorHandler } from '../logging/error-handler';
import BaseButton from '@/components/UI/buttons/BaseButton';

interface DirectionDropdownProps<T> {
  readonly value: T;
  readonly options: { value: T; label: string }[];
  readonly onChange: (value: T) => void;
  readonly className?: string;
}

/**
 * DirectionDropdown Component
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
export default function DirectionDropdown<T>({
  value,
  options,
  onChange,
  className = '',
}: DirectionDropdownProps<T>) {
  const currentIndex = useMemo(() => {
    return options.findIndex((option) => String(option.value) === String(value));
  }, [options, value]);

  useEffect(() => {
    if (options.length !== 2) {
      errorHandler(
        `DirectionDropdown expects exactly 2 options, received ${options.length}.`,
        new Error('Invalid toggle options count'),
      );
      return;
    }

    if (currentIndex !== -1) return;

    errorHandler(
      `Value "${value}" is not valid for DirectionDropdown.`,
      new Error('Invalid dropdown value'),
    );
  }, [currentIndex, options, value]);

  const currentOption = currentIndex >= 0 ? options[currentIndex] : options[0];
  const nextOption =
    options.length === 2 && currentIndex !== -1 ? options[(currentIndex + 1) % 2] : undefined;

  return (
    <div className={`centered border-none ${className}`} title={TEXTS.translationDirection}>
      <label htmlFor="direction-toggle" className="sr-only">
        {TEXTS.translationDirection}
      </label>
      <BaseButton
        id="direction-toggle"
        name="direction"
        type="button"
        title={TEXTS.translationDirection}
        onClick={() => {
          if (!nextOption) {
            errorHandler(
              'Cannot toggle DirectionDropdown: options are not valid.',
              new Error('Invalid toggle state'),
            );
            return;
          }

          onChange(nextOption.value);
        }}
        className="h-full"
      >
        {currentOption?.label ?? TEXTS.translationDirection}
      </BaseButton>
    </div>
  );
}
