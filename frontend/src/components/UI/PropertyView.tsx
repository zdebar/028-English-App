import { TEXTS } from '@/config/texts';

type PropertyViewProps = {
  label: string;
  labelWidth?: string;
  value: string | number | null | undefined;
  className?: string;
};

/**
 * Visual component to display a setting property with its label and value.
 *
 * @param label Label for the property.
 * @param labelWidth Width for the label element. Defaults to 'w-35'. Use Tailwind width classes.
 * @param value Value to display for the property.
 * @param className Additional CSS classes for custom styling.
 */
export default function PropertyView({
  label,
  labelWidth = 'w-35',
  value,
  className = '',
}: PropertyViewProps) {
  return (
    <dl className={`flex items-center ${className}`}>
      <dt className={`inline-block shrink-0 font-bold ${labelWidth}`}>{label}</dt>
      <dd>{value ?? TEXTS.notAvailable}</dd>
    </dl>
  );
}
