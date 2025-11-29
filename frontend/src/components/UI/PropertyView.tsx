/**
 * Visual component to display a setting property with its label and value.
 *
 * @param label - The label title.
 * @param value - The value content.
 * @param className - Optional additional CSS classes to apply to the component.
 * @returns A JSX element representing the labeled property.
 */
export default function PropertyView({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number | null | undefined;
  className?: string;
}) {
  return (
    <dl className={`flex items-center ${className}`}>
      <dt className="inline-block w-35 font-bold shrink-0">{label}</dt>
      <dd>{value ?? "Není k dispozici"}</dd>
    </dl>
  );
}
