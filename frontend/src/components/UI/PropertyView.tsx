import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';

type PropertyViewProps = {
  label: string;
  value: string | number | null | undefined;
  labelWidth?: string;
  className?: string;
  classNameValue?: string;
};

/**
 * Visual component to display a setting property with its label and value.
 *
 * @param label Label for the property.
 * @param labelWidth Width for the label element. Defaults to 'w-35'. Use Tailwind width classes.
 * @param value Value to display for the property.
 * @param className Additional CSS classes for custom styling.
 * @param classNameValue Additional CSS classes for the value element.
 * @returns The rendered property view element.
 */
export default function PropertyView({
  label,
  value,
  labelWidth = 'w-30',
  className = '',
  classNameValue = '',
}: PropertyViewProps): JSX.Element {
  return (
    <dl className={`flex items-center ${className}`}>
      <dt className={`inline-block shrink-0 truncate pl-4 text-left font-bold ${labelWidth}`}>
        {label}
      </dt>
      <dd className={classNameValue}>{value ?? TEXTS.notAvailable}</dd>
    </dl>
  );
}
