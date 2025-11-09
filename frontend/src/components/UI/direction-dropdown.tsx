import { useMemo } from "react";

interface DirectionDropdownProps<T> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Direction Dropdown Component.
 * A reusable dropdown component for selecting a direction or option.

 */
export default function DirectionDropdown<T>({
  value,
  options,
  onChange,
  className = "",
}: DirectionDropdownProps<T>) {
  if (!options.some((option) => option.value === value)) {
    console.warn(`Hodnota "${value}" není platná pro DirectionDropdown.`);
  }

  const memoizedOptions = useMemo(() => {
    return options.map((option) => (
      <option key={String(option.value)} value={String(option.value)}>
        {option.label}
      </option>
    ));
  }, [options]);

  return (
    <div className={`centered ${className}`}>
      <label htmlFor="direction-dropdown" className="sr-only">
        Směr
      </label>
      <select
        id="direction-dropdown"
        name="direction"
        value={String(value)}
        onChange={(e) =>
          onChange(
            options.find((o) => String(o.value) === e.target.value)?.value as T
          )
        }
        className="h-button w-full"
      >
        {memoizedOptions}
      </select>
    </div>
  );
}
