import { TEXTS } from '@/config/texts';
import { useMemo } from 'react';

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
  if (!options.some((option) => option.value === value)) {
    console.error(`Value "${value}" is not valid for DirectionDropdown.`);
  }

  const memoizedOptions = useMemo(() => {
    return options.map((option) => (
      <option key={String(option.value)} value={String(option.value)}>
        {option.label}
      </option>
    ));
  }, [options]);

  return (
    <div className={`centered ${className} border-none`}>
      <label htmlFor="direction-dropdown" className="sr-only">
        {TEXTS.translationDirection}
      </label>
      <select
        id="direction-dropdown"
        name="direction"
        value={String(value)}
        onChange={(e) =>
          onChange(options.find((o) => String(o.value) === e.target.value)?.value as T)
        }
        className="h-button color-select w-full px-3"
      >
        {memoizedOptions}
      </select>
    </div>
  );
}
