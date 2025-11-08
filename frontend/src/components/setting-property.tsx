interface SettingPropertyProps {
  label: string;
  value: string | number | null | undefined;
  className?: string;
}

export default function SettingProperty({
  label,
  value,
  className = "",
}: SettingPropertyProps) {
  return (
    <dl className={`flex items-center ${className}`}>
      <dt className="inline-block w-35 font-bold shrink-0">{label}</dt>
      <dd>{value ?? "Není k dispozici"}</dd>
    </dl>
  );
}
