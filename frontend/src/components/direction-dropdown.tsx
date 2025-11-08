import { useMemo } from "react";

/**
 * Direction Dropdown Component.
 * A reusable dropdown component for selecting a direction.
 */
export default function DirectionDropdown({
  value,
  options,
  onChange,
  className = "",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  if (!options.some((option) => option.value === value)) {
    console.warn(`Hodnota "${value}" není platná pro DirectionDropdown.`);
  }

  const memoizedOptions = useMemo(() => {
    return options.map((option) => (
      <option key={option.value} value={option.value}>
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-button w-full"
      >
        {memoizedOptions}
      </select>
    </div>
  );
}
