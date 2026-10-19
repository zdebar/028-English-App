import type { JSX, ReactNode } from 'react';

type PropertyViewProps = Readonly<{
  readonly label: string;
  readonly title?: string;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly classNameLabel?: string;
  readonly classNameValue?: string;
  readonly alignTop?: boolean;
}>;

/**
 * Visual component to display a setting property with its label and value.
 *
 * @param label Label for the property.
 * @param title Optional title text to provide additional information about the property.
 * @param children Content to display for the property.
 * @param className Additional CSS classes for custom styling.
 * @param classNameLabel CSS classes for the label element. Defaults to 'w-30'. Use Tailwind width classes.
 * @param classNameValue Additional CSS classes for the value element.
 * @returns The rendered property view element.
 */
export default function PropertyView({
  label,
  title,
  children,
  classNameLabel = 'w-30',
  className = '',
  classNameValue = '',
  alignTop = false,
}: PropertyViewProps): JSX.Element {
  return (
    <dl className={`flex ${alignTop ? 'items-start' : 'items-center'} ${className}`} title={title}>
      <dt
        className={`h-attribute inline-block shrink-0 truncate text-left font-bold ${classNameLabel}`}
      >
        {label}
      </dt>
      <dd className={classNameValue}>{children}</dd>
    </dl>
  );
}
