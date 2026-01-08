type PropertyViewProps = {
  label: string;
  value: string | number | null | undefined;
  className?: string;
};

/**
 * Visual component to display a setting property with its label and value.
 */
export default function PropertyView({ label, value, className = '' }: PropertyViewProps) {
  return (
    <dl className={`flex items-center ${className}`}>
      <dt className="inline-block w-35 shrink-0 font-bold">{label}</dt>
      <dd>{value ?? 'Není k dispozici'}</dd>
    </dl>
  );
}
