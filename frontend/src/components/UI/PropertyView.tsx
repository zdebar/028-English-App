import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

type PropertyViewProps = {
  label: string;
  value: string | number | null | undefined;
  className?: string;
  classNameLabel?: string;
  classNameValue?: string;
};

/**
 * Visual component to display a setting property with its label and value.
 *
 * @param label Label for the property.
 * @param value Value to display for the property.
 * @param className Additional CSS classes for custom styling.
 * @param classNameLabel CSS classes for the label element. Defaults to 'w-30'. Use Tailwind width classes.
 * @param classNameValue Additional CSS classes for the value element.
 * @returns The rendered property view element.
 */
export default function PropertyView({
  label,
  value,
  classNameLabel: classNameLabel = 'w-30',
  className = '',
  classNameValue = '',
}: PropertyViewProps): JSX.Element {
  return (
    <dl className={`flex items-center ${className}`}>
      <dt
        className={`h-attribute inline-block shrink-0 truncate text-left font-bold ${classNameLabel}`}
      >
        {label}
      </dt>
      <dd className={classNameValue}>{value ?? TEXTS.notAvailable}</dd>
    </dl>
  );
}
