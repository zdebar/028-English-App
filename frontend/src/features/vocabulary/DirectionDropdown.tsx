import { TEXTS } from '@/locales/cs';
import { useEffect, useMemo } from 'react';
import { errorHandler } from '../logging/error-handler';

interface DirectionDropdownProps<T> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}

/**
 * DirectionDropdown Component
 *
 * A generic, reusable dropdown component for selecting a direction or option.
 *
 * @template T - The type of the option values.
 * @param value - The currently selected value.
 * @param options - Array of selectable options, each with a value and label.
 * @param onChange - Callback invoked when the selected value changes.
 * @param className - Optional additional CSS classes for custom styling.
 * @returns A styled dropdown select element for choosing among provided options.
 */
export default function DirectionDropdown<T>({
  value,
  options,
  onChange,
  className = '',
}: DirectionDropdownProps<T>) {
  const optionValueMap = useMemo(() => {
    return new Map(options.map((option) => [String(option.value), option.value]));
  }, [options]);

  const hasSelectedValue = optionValueMap.has(String(value));

  useEffect(() => {
    if (hasSelectedValue) return;

    errorHandler(
      `Value "${value}" is not valid for DirectionDropdown.`,
      new Error('Invalid dropdown value'),
    );
  }, [hasSelectedValue, value]);

  const memoizedOptions = useMemo(() => {
    return options.map((option) => (
      <option key={String(option.value)} value={String(option.value)}>
        {option.label}
      </option>
    ));
  }, [options]);

  return (
    <div className={`centered border-none ${className}`}>
      <label htmlFor="direction-dropdown" className="sr-only">
        {TEXTS.translationDirection}
      </label>
      <select
        id="direction-dropdown"
        name="direction"
        value={String(value)}
        onChange={(e) => {
          const selectedValue = optionValueMap.get(e.target.value);
          if (selectedValue === undefined) {
            errorHandler(
              `Selected value "${e.target.value}" is not available in DirectionDropdown options.`,
              new Error('Invalid dropdown selection'),
            );
            return;
          }
          onChange(selectedValue);
        }}
        className="h-button bg-background-light text-light dark:bg-background-dark dark:text-dark w-full border-none px-4"
      >
        {memoizedOptions}
      </select>
    </div>
  );
}
