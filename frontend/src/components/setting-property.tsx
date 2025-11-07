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
    <div className={`flex items-center ${className}`}>
      <p className={`inline-block w-35 font-bold shrink-0 `}>{label}</p>
      <p>{value}</p>
    </div>
  );
}
