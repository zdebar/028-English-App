import { TEXTS } from '@/config/texts';

type PropertyViewProps = {
  label: string;
  value: string | number | null | undefined;
  className?: string;
};

/**
 * Visual component to display a setting property with its label and value.
 *
 * @param label Label for the property.
 * @param value Value to display for the property.
 * @param className Additional CSS classes for custom styling.
 */
export default function PropertyView({ label, value, className = '' }: PropertyViewProps) {
  return (
    <dl className={`flex items-center ${className}`}>
      <dt className="inline-block w-35 shrink-0 font-bold">{label}</dt>
      <dd>{value ?? TEXTS.notAvailable}</dd>
    </dl>
  );
}
