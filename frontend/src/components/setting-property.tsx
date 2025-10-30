interface SettingPropertyProps {
  label: string;
  value: string | null | undefined;
  className?: string;
}

export default function SettingProperty({
  label,
  value,
  className = "",
}: SettingPropertyProps) {
  return (
    <div className={`h-input flex items-center ${className}`}>
      <p className={`inline-block w-25 shrink-0 pl-2`}>{label}</p>
      <p>{value}</p>
    </div>
  );
}
